# IMT & PEMFC Lab Website

A multi-page website for the Intelligent Manufacturing Technology (IMT) &
PEMFC Laboratory, Future & Automotive Engineering Department, Kongju
National University (Cheonan Campus).

The structure (dark header with dropdown nav, home carousel + Highlights
grid, per-role Member pages, circular Research grid, year-grouped
Publication list, Contact page with map) mirrors the composition of
[HOPE Lab's site](https://sites.google.com/view/hopelab2020/home), rebuilt
as a static, no-build-step HTML/CSS/JS site instead of Google Sites.

Real content (bio, member roster, research themes, address/contact) has
been migrated in from the lab's actual
[Google Sites page](https://sites.google.com/view/imtlab23/home) where
available. The publication list (2022&ndash;2026, 22 papers) was compiled
from the lab's own paper PDFs and cross-checked against each journal's
listing for the exact volume/pages/DOI. The Event page has its first two
real photos in; captions (event name/date) are still placeholders since
those weren't provided yet.

## Structure

```
lab-homepage/
├── index.html                        Home — real "Our expertise" text
├── member/
│   └── index.html                    all roles on one page (Professor,
│                                      Postdoctoral Fellow, Ph.D Candidate,
│                                      Master Student, Undergraduate
│                                      Student, Alumni) — no per-role pages,
│                                      no Research Professor (no current member).
│                                      Postdoc/Ph.D/Master/Undergrad each show
│                                      a `.research-card`: photo+name next to
│                                      their own research figure + summary
├── templates/
│   └── student-research-template.md  hand to each student to fill in and
│                                      send back (photo, research figure,
│                                      short write-up, keywords)
├── research/index.html               filled in — 8 themes, each with a real
│                                      figure pulled from one of the lab's
│                                      own papers (images/research/)
├── publication/
│   ├── index.html                    category landing
│   ├── paper.html                    filled in — 22 papers, 2022-2026
│   ├── patent.html                   template
│   └── conference.html               template
├── event/index.html                  2 real photos in, captions pending
├── contact/index.html                filled in — real address, phone, email
├── assets/
│   ├── site.css                      shared design system
│   └── site.js                       injects header/footer, nav dropdowns, carousel
└── images/
    ├── team/                          real photos for most members (see below)
    ├── gallery/                       still placeholder photos
    └── placeholders/                  generic placeholders used by the new pages
```

Real photos are wired in for HyunChul Kim, Nguyen Ba Hieu, Shantharaja,
Shambhulinga Araleka, Vuong Duc Thinh, Ngo Cam Tu, Lit Le, Nguyen Chi
Thien, 선민호 (Minho Sun), 한순민 (Sunmin Han), 이완태, and 전형준. 이주영,
조지현 (undergrad), and 황선재 still use the illustrated placeholder — drop
their photos into `images/team/` and update the `<img src>` for their
card in `member/index.html` once available.

Research cards are filled in for Shantharaja (no figure submitted yet —
still shows the placeholder figure), Vuong Duc Thinh, Lit Le, Nguyen Chi
Thien, 선민호, 한순민, and 황선재 (no photo or figure submitted yet). Still
pending a submission: Nguyen Ba Hieu, Shambhulinga Araleka, 이주영, 이완태.

Pages marked **template** share the same components as their filled-in
counterpart (`.member-card`, `.pub-year-band` + `.pub-list-year`, or
`.highlight-card`) with one sample block and a dashed `.placeholder-frame`
box explaining what to duplicate.

## How the shared header/footer works

Every page has an empty `<div id="site-header"></div>` and
`<div id="site-footer"></div>`, plus `<body data-page="..." data-base="...">`.
`assets/site.js` renders the nav and footer into those placeholders at load
time, using `data-base` (e.g. `"../"` from one folder deep) to build correct
links and `data-page` to highlight the active nav item. This keeps the nav
in one file instead of duplicated across every page — edit `NAV` in
`assets/site.js` to add or rename a page.

## Viewing locally

Opening a page directly (`file://...`) works for styling, but the header/nav
still loads correctly since `site.js` is a plain script include, not a
`fetch()`. To see it exactly as it will run on a real server, use any static
file server from the `lab-homepage/` folder, e.g.:

```bash
python -m http.server 8090
```

then open `http://localhost:8090/index.html`.

## Adding real content

- **Member photos**: replace files under `images/team/`, or add new ones and
  point a `.member-card`'s `<img>` at them.
- **Student research cards**: send each postdoc/Ph.D/master/undergrad student
  `templates/student-research-template.md`. Once they send back their photo,
  one research figure, and a short write-up, drop the figure into
  `images/research/` (or `images/team/`), duplicate a `.research-card` block
  in `member/index.html`, and fill in `rc-figure`, `rc-title`, and `rc-desc`.
  An optional `.rc-keywords` list of `<span>` tags can hold 2&ndash;4 keywords.
- **Publications**: copy a `<li>` inside `.pub-list-year` on
  `publication/paper.html`; start a new `.pub-year-band` for a new year.
- **Highlights — Latest Paper**: the lab has no journal cover yet, so this
  slot always shows the most recently published paper instead. Each time a
  new paper comes out, swap its image for that paper's graphical abstract (or
  a photo of the student author if there's no abstract figure), and update
  the `.tag` (journal &middot; year) and `.desc` (title &mdash; authors) text
  in the first `.highlight-card` on `index.html`. Switch the column back to
  an actual "Cover" once the lab lands a real journal cover.
- **Highlights — Award / Event**: copy a `.highlight-card` block.
- Replace any `images/placeholders/*.svg` with a real photo of the same
  filename, or update the `src` to point at a new file.
