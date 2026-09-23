#!/usr/bin/env python3
"""
gds2web.py - turn a SkyWater SKY130 GDSII layout into assets for the site's chip viewer.

  python3 tools/gds2web.py path/to/tt_um_govardhana_adpll.gds  [--px 3200] [--out assets/chip]

Writes one transparent WebP per layer (anti-aliased), plus chip.json with the die size,
layer list, a census of standard-cell types, and the bounding box of every placed cell
so the viewer can say what's under the cursor.

Needs: pip install gdstk opencv-python-headless pillow numpy
"""
import argparse, json, os, re, sys
from collections import Counter
import numpy as np, cv2, gdstk
from PIL import Image

# SKY130 drawing layers, bottom to top. (gds layer, datatype, key, label, colour, shown by default)
LAYERS = [
    (64, 20, "nwell", "N-well",       "#6b7f3a", False),
    (65, 20, "diff",  "Diffusion",    "#35b36a", True),
    (66, 20, "poly",  "Poly",         "#e0513f", True),
    (67, 20, "li1",   "Local interconnect", "#9b86f0", False),
    (68, 20, "met1",  "Metal 1",      "#4c8dff", True),
    (69, 20, "met2",  "Metal 2",      "#ea5fb0", True),
    (70, 20, "met3",  "Metal 3",      "#2fd3d6", True),
    (71, 20, "met4",  "Metal 4",      "#f4ad3d", True),
    (72, 20, "met5",  "Metal 5",      "#e6e6e6", False),
]
# vias are drawn into the metal above them, so a via stack reads as one dot
VIAS = {(67, 44): "met1", (68, 44): "met2", (69, 44): "met3", (70, 44): "met4", (71, 44): "met5"}

FAMILY = [  # sky130_fd_sc_hd__<name>_<drive>  ->  friendly family
    (r"^(dfrtp|dfrbp|dfstp|dfxtp|dfxbp|dfbbp|dfsbp|edfxtp|sdf\w*|dlxtp|dlrtp|dlxbn)", "Flip-flop / latch"),
    (r"^(inv|clkinv|einv)", "Inverter"),
    (r"^(buf|clkbuf|dlygate|dlymetal|bufbuf|dlclkp|clkdlybuf)", "Buffer / delay"),
    (r"^(nand|and|nor|or|xor|xnor|a\d|o\d|maj|ha|fa)", "Logic gate"),
    (r"^(mux)", "Multiplexer"),
    (r"^(conb)", "Tie cell"),
    (r"^(fill|decap|tapvpwrvgnd|tap)", "Fill / decap / tap"),
    (r"^(diode)", "Antenna diode"),
]
def family(cell):
    m = re.match(r"^sky130_\w+?__(.+?)(?:_\d+)?$", cell)
    base = m.group(1) if m else cell
    for pat, fam in FAMILY:
        if re.match(pat, base): return fam, base
    return "Other", base

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("gds"); ap.add_argument("--px", type=int, default=3200)
    ap.add_argument("--out", default="assets/chip"); ap.add_argument("--top", default=None)
    ap.add_argument("--composite", default="assets/img/adpll-layout.png", help="static all-layer render for the ADPLL case study")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    lib = gdstk.read_gds(a.gds)
    tops = lib.top_level()
    top = next((c for c in tops if a.top and c.name == a.top), None) or \
          next((c for c in tops if c.name.startswith("tt_um_")), None) or \
          max(tops, key=lambda c: (lambda b: 0 if b is None else (b[1][0]-b[0][0])*(b[1][1]-b[0][1]))(c.bounding_box()))
    (x0, y0), (x1, y1) = top.bounding_box()
    W_um, H_um = x1 - x0, y1 - y0
    s = a.px / max(W_um, H_um)
    PW, PH = int(round(W_um * s)), int(round(H_um * s))
    SS = 3  # supersample for clean anti-aliasing
    print(f"top cell {top.name}: {W_um:.2f} x {H_um:.2f} um -> {PW} x {PH} px", file=sys.stderr)

    # every placed cell (one level of hierarchy, which is how a routed block is organised)
    cells, types, census = [], {}, Counter()
    # use each standard cell's placement boundary (layer 235/4 in SKY130) when present,
    # so a cell reads 2.72 um tall rather than including its power-rail overhang
    bnd_cache = {}
    def boundary_cell(c):
        if c.name not in bnd_cache:
            polys = c.get_polygons(layer=235, datatype=4, depth=0)
            if polys:
                bc = gdstk.Cell("_bnd_" + c.name); bc.add(*polys); bnd_cache[c.name] = bc
            else:
                bnd_cache[c.name] = None
        return bnd_cache[c.name]
    for r in top.references:
        name = r.cell.name if hasattr(r.cell, "name") else str(r.cell)
        bc = boundary_cell(r.cell) if hasattr(r.cell, "get_polygons") else None
        if bc is not None:
            bb = gdstk.Reference(bc, r.origin, r.rotation, r.magnification, r.x_reflection).bounding_box()
        else:
            bb = r.bounding_box()
        if bb is None: continue
        fam, base = family(name); census[fam] += 1
        t = types.setdefault(name, len(types))
        (bx0, by0), (bx1, by1) = bb
        cells.append([round((bx0-x0)*s, 1), round((y1-by1)*s, 1), round((bx1-bx0)*s, 1), round((by1-by0)*s, 1), t])

    # flatten a copy and pull polygons per layer
    flat = top.copy(top.name + "_flat").flatten()
    buckets = {k: [] for _, _, k, *_ in LAYERS}
    lut = {(l, d): k for l, d, k, *_ in LAYERS}
    lut.update(VIAS)
    for p in flat.polygons:
        k = lut.get((p.layer, p.datatype))
        if k: buckets[k].append(p.points)
    for path in flat.paths:
        for p in path.to_polygons():
            k = lut.get((p.layer, p.datatype))
            if k: buckets[k].append(p.points)

    out_layers = []
    for l, d, k, label, col, on in LAYERS:
        polys = buckets[k]
        if not polys: continue
        mask = np.zeros((PH*SS, PW*SS), np.uint8)
        pts = [np.round(np.column_stack(((pp[:,0]-x0)*s*SS, (y1-pp[:,1])*s*SS)) * 16).astype(np.int32) for pp in polys]
        cv2.fillPoly(mask, pts, 255, lineType=cv2.LINE_AA, shift=4)
        mask = cv2.resize(mask, (PW, PH), interpolation=cv2.INTER_AREA)
        r_, g_, b_ = (int(col[i:i+2], 16) for i in (1, 3, 5))
        rgba = np.zeros((PH, PW, 4), np.uint8); rgba[..., 0], rgba[..., 1], rgba[..., 2] = r_, g_, b_; rgba[..., 3] = mask
        fn = f"{k}.webp"
        Image.fromarray(rgba, "RGBA").save(os.path.join(a.out, fn), "WEBP", quality=88, method=6)
        cov = float((mask > 64).mean())
        out_layers.append({"id": k, "label": label, "color": col, "file": fn, "on": on, "polys": len(polys), "coverage": round(cov, 4)})
        print(f"  {k:6s} {len(polys):7d} polygons  {cov*100:5.1f}% coverage", file=sys.stderr)

    # static composite (screen-blended on a dark field) for the case-study figure
    if a.composite and out_layers:
        acc = np.zeros((PH, PW, 3), np.float32); acc[:] = (10, 12, 15)
        for L in out_layers:
            if not L["on"]: continue
            im = np.asarray(Image.open(os.path.join(a.out, L["file"])).convert("RGBA")).astype(np.float32) / 255
            c = im[..., :3] * im[..., 3:4] * 0.92
            acc = 255 - (255 - acc) * (1 - c)          # screen blend
        cw = 1400; ch = int(PH * cw / PW)
        os.makedirs(os.path.dirname(a.composite) or ".", exist_ok=True)
        Image.fromarray(np.clip(acc, 0, 255).astype(np.uint8)).resize((cw, ch), Image.LANCZOS).save(a.composite, optimize=True)
        print(f"wrote {a.composite}", file=sys.stderr)

    logic = sum(v for f, v in census.items() if f not in ("Fill / decap / tap",))
    meta = {
        "top": top.name, "pdk": "SkyWater SKY130",
        "um": [round(W_um, 3), round(H_um, 3)], "px": [PW, PH], "scale": s,
        "layers": out_layers,
        "types": [None] * len(types), "cells": cells,
        "census": dict(census.most_common()), "placed": len(cells), "logic_cells": logic,
    }
    for name, i in types.items(): meta["types"][i] = name
    with open(os.path.join(a.out, "chip.json"), "w") as f: json.dump(meta, f, separators=(",", ":"))
    print(f"{len(cells)} placed cells ({logic} excluding fill/decap/tap); wrote {a.out}/chip.json", file=sys.stderr)

if __name__ == "__main__":
    main()
