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
listing for the exact volume/pages/DOI. Event photos are still
placeholders — newer files for those are coming.

## Structure

```
lab-homepage/
├── index.html                        Home — real "Our expertise" text
├── member/
│   ├── index.html                    category landing
│   ├── professor.html                filled in — Prof. HyunChul Kim
│   ├── research-professor.html       template (no current member)
│   ├── postdoctoral-fellow.html      filled in — 3 postdocs
│   ├── phd-candidate.html            filled in — 1 Ph.D candidate
│   ├── master-student.html           filled in — 5 master's students
│   ├── undergraduate-student.html    filled in — 1 undergrad
│   └── alumni.html                   filled in — 1 alumnus
├── research/index.html               filled in — 8 real research themes
├── publication/
│   ├── index.html                    category landing
│   ├── paper.html                    filled in — 22 papers, 2022-2026
│   ├── patent.html                   template
│   └── conference.html               template
├── achievement/index.html            template
├── event/index.html                  template — awaiting event photos
├── benefit/index.html                template
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
Thien, 이완태, and 전형준. 이주영 and 조지현 (undergrad) still use the
illustrated placeholder — drop their photos into `images/team/` and update
the `<img src>` in `member/master-student.html` /
`member/undergraduate-student.html` once available.

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
- **Publications**: copy a `<li>` inside `.pub-list-year` on
  `publication/paper.html`; start a new `.pub-year-band` for a new year.
- **Highlights / Achievements / Events**: copy a `.highlight-card` block.
- Replace any `images/placeholders/*.svg` with a real photo of the same
  filename, or update the `src` to point at a new file.
