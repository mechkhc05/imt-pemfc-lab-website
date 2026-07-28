# IMT & PEMFC Lab Website

A multi-page website for the Intelligent Manufacturing Technology (IMT) &
PEMFC Laboratory, Future & Automotive Engineering Department, Kongju
National University (Cheonan Campus).

The structure (dark header with dropdown nav, home carousel + Highlights
grid, per-role Member pages, circular Research grid, year-grouped
Publication list, Contact page with map) mirrors the composition of
[HOPE Lab's site](https://sites.google.com/view/hopelab2020/home), rebuilt
as a static, no-build-step HTML/CSS/JS site instead of Google Sites.

## Structure

```
lab-homepage/
├── index.html                        Home
├── member/
│   ├── index.html                    category landing
│   ├── professor.html                filled in — Prof. Hyun-Chul Kim
│   ├── research-professor.html       template
│   ├── postdoctoral-fellow.html      template
│   ├── phd-candidate.html            template
│   ├── master-student.html           template
│   ├── undergraduate-student.html    template
│   └── alumni.html                   template
├── research/index.html               filled in — 6 research themes
├── publication/
│   ├── index.html                    category landing
│   ├── paper.html                    filled in — real publication list
│   ├── patent.html                   template
│   └── conference.html               template
├── achievement/index.html            template
├── event/index.html                  template
├── benefit/index.html                template
├── contact/index.html                filled in — opening + map
├── assets/
│   ├── site.css                      shared design system
│   └── site.js                       injects header/footer, nav dropdowns, carousel
└── images/
    ├── team/, gallery/                existing placeholder photos
    └── placeholders/                  generic placeholders used by the new pages
```

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
