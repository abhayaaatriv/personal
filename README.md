# Abhaya's Bag

A personal scrapbook site: a pink bag on crumpled paper with a camcorder, a Sony camera and earphones poking out.
Each opens a Windows XP style window.

- **Camcorder**: Reel Log, a searchable Letterboxd diary with ratings and reviews
- **Camera**: Photo Roll, polaroid posts with photos and writing
- **Earphones**: Now Spinning, a spinning record with a link to Spotify
- **Header**: the chrome A and a link to the work site
- Draggable stickers, flying dragonflies, a disco ball, and synthesised XP style sounds (toggle in the Start menu)

Single self-contained page, no dependencies. Fonts (Anton, Caveat) load from Google Fonts.

## Build

    python3 build.py

Reads `src/` and `data/diary.csv` (a Letterboxd diary export) and writes `index.html`.
Update the diary by replacing `data/diary.csv` and rebuilding.

## Deploy on GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root. The site is then at `https://<user>.github.io/<repo>/`.

## The admin

The Admin window (Start → Admin) edits movies, posts and the Spotify link, and its publish button rewrites the page.
That button needs the Claude artifact runtime (`window.claude`), so it only works on the version published at claude.ai, not on GitHub Pages.
On Pages the site is read-only: rebuild from `data/diary.csv` and `src/` and push instead.
`artifact.html` is the exact fragment that is published on claude.ai.

## Layout

    src/        style.css, app.js, stickers.json (sticker images embedded as base64)
    data/       diary.csv
    tools/      the scripts used to cut stickers out of the source photos
    build.py
