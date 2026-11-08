# startpage

![screenshot](img/screenshot.png)

A personal, monochrome browser startpage with a terminal-style prompt, a working DuckDuckGo search, an animated illustration and a few columns of links. Plain HTML, CSS and JavaScript, no build step, no dependencies. Hosted on GitHub Pages.

Live at `https://favnywastaken.github.io`

## Features

- Terminal-style prompt with a built-in DuckDuckGo search (press Enter, `!bangs` work)
- Link columns defined in one config file
- Animated transparent illustration on the left, replaceable from the settings
- Monochrome theme with faint leaves and a slow background shimmer
- Monocraft font
- Settings panel (gear icon, bottom left) for editing everything except the font
- Responsive layout, respects `prefers-reduced-motion`

## Structure

```
.
├── index.html
├── style.css
├── script.js
├── config.js
├── fonts/
│   └── Monocraft.ttf
└── img/
    └── cat.webp
```

## Run locally

```sh
git clone https://github.com/FavnyWasTaken/FavnyWasTaken.github.io
cd FavnyWasTaken.github.io
python -m http.server 8000
```

Open `http://localhost:8000`. Run the server from inside the project folder, otherwise it only shows a directory listing.

## Font

Monocraft is not committed by default. Download it into `fonts/`:

```sh
curl -L -o fonts/Monocraft.ttf https://cdn.jsdelivr.net/gh/IdreesInc/Monocraft@main/dist/Monocraft-ttf/Monocraft.ttf
```

Without it the page falls back to the system monospace font.

## Deploy

Push to `main`. GitHub Pages serves the repository root.

```sh
git add .
git commit -m "update"
git push
```

If the site does not appear, check Settings → Pages: the source must be Deploy from a branch, `main`, `/ (root)`.

## Configuration

Defaults live in `config.js`.

```js
window.CONFIG = {
  title: "start",
  prompt: "favny@arch ~/",
  search: "https://duckduckgo.com/?q=",
  theme: { bg: "#0d0d0d", text: "#c9c9c9", leaf: "#171717" },
  hero: { src: "img/cat.webp", w: 460 },
  sections: [ ... ],
  leaves: 26,
};
```

| Key | What it does |
| --- | --- |
| `title` | Browser tab title |
| `prompt` | Text shown after `>` before the search field |
| `search` | Search URL prefix, the query is appended |
| `theme` | Background, text and leaf colors |
| `hero` | Default illustration path and width in px |
| `sections` | Link columns |
| `leaves` | Number of background leaves, `0` removes them |

### Links

Each section has a title, a color and a list of links:

```js
{
  title: "Tools", color: "#bdbdbd",
  links: [
    { name: "YouTube", url: "https://www.youtube.com/" },
  ],
},
```

Add, remove or reorder objects to change the page. A trailing `/` is added to every title by CSS.

### Search engine

Change `search` to any URL that takes the query at the end, for example `https://www.startpage.com/do/search?q=`.

### Colors

Edit `theme` and the `color` of each section. Keep them neutral grays for the monochrome look.

## Settings panel

Click the gear icon to open it, `Esc` closes it. You can change:

- tab title and prompt text
- background, text and leaf colors
- section titles, section colors, link names and URLs, add and remove links
- illustration size
- illustration image (`.gif`, `.png`, `.jpg`, `.webp`), with `restore cat` to bring the default back

Settings are saved in the browser (`localStorage` and IndexedDB), per address and per browser. They are not part of the repository and do not sync between devices or between `localhost` and `github.io`. `reset everything` at the bottom of the panel clears them.

To make a change permanent, edit `config.js` and push.

When `config.js` changes in a way that should override saved settings, bump the `KEY` constant at the top of `script.js` (for example `startpage.v4`).

## Illustration

The default `img/cat.webp` is an animated WebP with a transparent background, so it blends into any theme. GIF only supports on/off transparency, which leaves jagged edges, so WebP or PNG are better for transparent artwork. A replacement image with its own background is shown as is.

## Credits

- [Monocraft](https://github.com/IdreesInc/Monocraft) by IdreesInc, licensed under OFL-1.1
- Layout inspired by terminal-style startpages, written from scratch
