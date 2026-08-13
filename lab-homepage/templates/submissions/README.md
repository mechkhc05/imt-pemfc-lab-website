# Incoming student submissions — staging area

Drop each student's raw materials here, in whatever format they sent them
(filled-in `student-research-template.md`, a Word doc, a KakaoTalk-exported
text blob, loose photo/figure files, etc.) — no need to clean them up first.

## Convention

One subfolder per student, named after them, e.g.:

```
submissions/
├── lit-le/
│   ├── template-filled.md   (or .docx / .hwp / pasted text as .txt)
│   ├── lit.jpg               profile photo
│   └── lit-research.png      research figure
├── shantharaja/
│   └── ...
```

Once a student's folder has at minimum a name/role and a short research
write-up, it can be turned into a `.research-card` block in
`member/index.html` (photo → `images/team/`, figure → `images/research/`,
per the existing pattern documented in the top-level `lab-homepage/README.md`).

After a submission is merged into the site, its raw files can be deleted
from here — this folder is just an inbox, not the source of truth.
