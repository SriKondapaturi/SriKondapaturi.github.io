# SriKondapaturi.github.io

Portfolio for Govardhana Kondapaturi, physical design engineer. Hand-written HTML, CSS and JavaScript. No framework, no build step. The only third-party requests are the Credly badge images in Certifications (a letter tile shows if Credly is unreachable). Type is Apple's SF Pro on iPhone, iPad and Mac (via the system font, as Apple's own sites do; SF Pro may not be hosted on the web) and Inter, its closest open match, everywhere else.

```
index.html                      the page
404.html                        "unconnected net" error page (GitHub Pages serves it automatically)
assets/css/site.css             all styling: navy & gold light and dark themes, print styles
assets/css/hello.css            the "Off the clock" opener and its film strip
assets/js/site.js               die animation, figures, skills matrix, command palette, form
assets/js/hello.js              film strip: slow auto-scroll, drag, full-size photo viewer
assets/img/life/                the ten personal photos (location data removed)
assets/fonts/                   Inter (fallback for SF Pro on non-Apple devices) + Plex Mono, ~80 KB
assets/img/og.png               1200×630 link preview for LinkedIn / Slack / iMessage
assets/img/favicon.svg
assets/Govardhana_Kondapaturi_Resume.pdf
.nojekyll  robots.txt  sitemap.xml
```

## Images you can add later (no code changes needed)

Drop a file at the exact path below and push. The page detects it on load.

| Path | What happens |
|---|---|
| `assets/img/headshot.jpg` | Replaces the "GK" panel in About. Portrait, about 4:5, 900×1125 px or larger. |
| `assets/img/adpll-layout.png` | ADPLL figure gains a **Layout / Architecture** toggle and opens on Layout. A KLayout or 3D-viewer screenshot works well. |
| `assets/img/soc-layout.png` | Same, for the chiplet SoC (Innovus floorplan or routed view). |
| `assets/img/systolic-layout.png` | Same, for the systolic accelerator. |
| `assets/img/dft-layout.png` | Same, for DFT (a TetraMAX coverage report screenshot is fine; the tab reads "Screenshot"). |

Keep screenshots around 1200–1600 px wide and under ~400 KB. `squoosh.app` shrinks them without visible loss.

## Personal photos (film strip)

The page opens with "Hello, I'm Sri." and a film strip of personal photos, then hands off to the professional section ("On the clock").

- **Change the text:** edit the `00 · HELLO` block at the top of `index.html`.
- **Add a photo:** save it in `assets/img/life/` (about 1,000–1,400 px on the long side, under ~250 KB), then copy one `<button class="fr">…</button>` line in the film strip and change the file name, `alt` text, frame number and caption. Keep `width` and `height` matching the photo.
- **Remove a photo:** delete its `<button class="fr">` line.
- Phone photos can carry GPS location. Strip it before adding (on a Mac: Preview → Tools → Show Inspector → GPS → Remove Location Info).

## Contact form

Out of the box the form opens the visitor's email app with their message filled in, so it works with zero setup. To receive messages directly instead:

1. Sign up at formspree.io with `srigovardhan96@gmail.com` (free tier: 50 messages/month).
2. Create a form; copy its ID (the part after `/f/`).
3. In `index.html`, replace `YOUR_FORM_ID` in `action="https://formspree.io/f/YOUR_FORM_ID"`.

The script notices the change on its own: it switches to sending in the background and shows a "Message sent" confirmation. A hidden honeypot field filters most spam.

## Publish

1. Create a **public** GitHub repo named exactly `SriKondapaturi.github.io` (empty: no README, no license).
2. From this folder:

```bash
git init -b main
git add .
git commit -m "Portfolio v3"
git remote add origin https://github.com/SriKondapaturi/SriKondapaturi.github.io.git
git push -u origin main
```

3. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
4. Live in about a minute at **https://srikondapaturi.github.io**. Your Tiny Tapeout page at `/tt-um-govardhana-adpll/` keeps working.

To update later: `git add . && git commit -m "…" && git push`.

**Check the link preview** after publishing by pasting the URL into LinkedIn's Post Inspector (linkedin.com/post-inspector). It should show `og.png`.

## Editing content

- **Text** lives in `index.html`, one commented block per section (`<!-- 01 · WORK -->` and so on).
- **Skill ratings** live in the Skills section of `index.html`. To change a rating, edit `data-lv="1"`…`"5"` on that skill; the squares and the Expert/Advanced/Proficient/Familiar label update on their own. `data-p` lists the projects that skill was used in (`adpll soc npu dft`), which drives the "Used in" filter and the coloured dots.
- **Colours**: the `:root` block at the top of `site.css`. `--cu` is the antique-gold accent; change it and every accent follows.
- **Headline numbers** in the band under the hero: edit the `data-to` attribute and the fallback text together.

## Things built in that are easy to miss

- **⌘K / Ctrl+K** (or `/`) opens a command palette: jump to any section or project, copy email, download the resume, open links, switch theme, replay the animation, print. On phones the **Menu** button opens it.
- **Print / Save as PDF** produces a clean black-on-white datasheet version of the page.
- **Reduced motion**: visitors who turn off animation in their OS get the finished die and static figures.
- **Contact** is a bond-wired chip: hover or tap a pad and its wire lights up while the die shows that contact with action buttons. Contact details live in `CONTACT_PINS` in `site.js`.
- **Structured data** (schema.org `Person`) helps Google show your name, title and profiles properly.
