# Firefly

Clean, bright and modern theme for the [Ngwg](https://github.com/Ngwgers/Ngwg-core) static site generator.

## Features

- Wallpaper banner with a per-build random image (desktop/mobile variants) and
  a typewriter subtitle on the home page
- Post cards with optional cover, excerpt clamping and tag list; `pinned: true`
  in a post's frontmatter sorts it above the date order and adds a pin badge
- Archive (grouped by year), tag and category listing pages, and a 404 page
- Home pagination with square page buttons and a jump-to-page box
- Post page with banner info, tag/category meta, neighbour links, licence notice
  and a comments hook; an `updated:` frontmatter adds a last-updated date
- Sidebar widgets: profile, announcement, categories, tags, site statistics,
  recent-activity card (with heatmap) and the TOC
- Dynamic (moments) page: a directory of short markdown pages rendered as a feed
  with in-page text search and a year filter
- Light/dark/system theme switch and a display-settings panel with an accent-hue
  slider
- Client-side search, opened from the navbar or with Ctrl/Cmd+K (opt-in)
- Navbar links with dropdown menus (accordions in the mobile drawer)
- Pjax navigation, reading progress bar (post pages only), back-to-top and code
  copy buttons
- Long-post segmented loading
- Markdown: admonitions (`!!! tip … !!!`), GFM alerts (`> [!NOTE]`), task lists,
  tab containers (`::: tabs` + `@tab`), Mermaid diagrams and TeX math
- i18n (ships `zh_CN` and `en_US`)
- SEO/RSS/sitemap through [Ngwg-ext-seo](https://github.com/Ngwgers/Ngwg-ext-seo)

## Requirements

- [Ngwg-files](https://github.com/Ngwgers/Ngwg-files) — **required**
- [Ngwg-feature](https://github.com/Ngwgers/Ngwg-feature) — **required**
- [Ngwg-ext-seo](https://github.com/Ngwgers/Ngwg-ext-seo) — optional, enables
  the `og:`/`twitter:`/canonical meta, `sitemap.xml` and `rss.xml`
- TeX math is opt-in and configured on the files plugin (see below)

## Install

Declare the theme and the plugins in `ngwg.yaml`:

```yaml
theme: firefly

themes:
  firefly: https://github.com/0xarch/firefly-theme.git

plugins:
  files: {}
  feature: {}
  seo: https://github.com/Ngwgers/Ngwg-ext-seo # optional
```

## Configuration

Everything under `theme.yaml` can be overridden from `ngwg.yaml` via
`theme.<name>` — objects merge key by key, scalars replace:

```yaml
theme:
  firefly:
    themeColor:
      hue: 210          # any 0-360; drives the whole oklch palette
      defaultMode: dark # light | dark | system
    sidebar:
      position: left    # left | right | both
    banner:
      desktop: [/assets/images/wallpaper/d3.avif]
```

The main knobs (see `theme.yaml` for the full list and defaults):

| Key | Meaning |
| --- | --- |
| `themeColor.hue` / `defaultMode` | accent hue (0-360) and initial colour scheme |
| `themeColor.displaySettings` | show the navbar display-settings panel (hue slider); `false` hides it |
| `profile.*` | sidebar avatar, name, bio and links |
| `announcement.*` | sidebar announcement card (enable, content, link, closable) |
| `navbar.*` | title, logo, `menuAlign` (`left` puts the links beside the title), `mode` (`static`/`fixed`/`dynamic`), links |
| `navbar.links[].children` | turns a link into a dropdown menu |
| `banner.*` | `mode` (`banner`/`none`), image lists, `position`, `dimOpacity`, home title/subtitle/typewriter/links, post info |
| `sidebar.enable/position/tabletSidebar/hideOnPostPage` + `left`/`right` | widget columns (`profile`, `announcement`, `categories`, `tags`, `stats`, `recent`, `toc`) |
| `sidebar.collapse.categories` / `.tags` | entry count past which a widget is clipped behind a more/collapse toggle (0 disables) |
| `siteStats.enable/startDate` | sidebar statistics card |
| `recent.count` / `recent.heatmap.enabled` / `recent.heatmap.clickable` | "recent" card: list length, whether the heatmap is drawn, whether a click filters the list |
| `dynamic.title` / `description` / `profileUrl` | moments page fallbacks and the avatar/name link target |
| `postList.layout` / `postList.mobileLayout` | card layout: `list` (wide cards) or `grid` (auto-filled columns) |
| `postList.*` | cover side, excerpt lines, stats, tags |
| `license.*` | end-of-post licence notice (`enable`, `name`, `url`); a post may override with `license` / `licenseUrl` frontmatter |
| `search.enable` / `limit` / `excerptLength` / `hotkey` | client-side search |
| `comments.*` | giscus hook (disabled by default) |

Local assets are addressed as `/assets/...` (the theme's `assets/` directory is
deployed verbatim). Point `profile.avatar`, `banner.desktop` etc. at your own
files placed under `source/assets/` or at remote URLs; the wallpapers, avatar
and favicons bundled in `assets/images/` are git-ignored, so a fresh clone
expects you to bring your own.

### Responsive layout

| Width | Layout |
| --- | --- |
| < 768px | no side columns; the sidebar widgets stack below the content |
| 768-1279px | one sticky side column — `sidebar.tabletSidebar` picks the side when `sidebar.position` is `both` |
| >= 1280px | every configured column |

### Search

```yaml
theme:
  firefly:
    search:
      enable: true
      limit: 20          # result cap
      excerptLength: 150 # stored excerpt length
      hotkey: true       # Ctrl/Cmd+K
```

### TeX / Mermaid

TeX is off by default (it is expensive at build time); a post's frontmatter can
override the global setting per article:

```yaml
plugins:
  files:
    option:
      markdown:
        tex:
          enabled: true   # default false
          backend: katex  # "katex" (default) or "mathjax"
```

```markdown
---
tex: true          # or "katex" / "mathjax"
---

Inline $E = mc^2$ and display $$\int_{-\infty}^{\infty} e^{-x^2} dx$$ math.
```

Mermaid needs no configuration — a ```` ```mermaid ```` code block renders as a
diagram.

### Recent card

```yaml
theme:
  firefly:
    recent:
      count: 5            # list length
      heatmap:
        enabled: true
        clickable: true   # a cell with posts filters the list to that week
```

### Dynamic page

A moments feed is a source directory with one markdown file per moment:

```text
source/dynamic/
  index.md                  # frontmatter: layout: dynamic
  2026-09-12-night-walk.md  # title/date/location/pinned frontmatter
```

`index.md` renders the feed; every other `.md` in the directory is listed
pinned-first, then newest first, each also reachable at `/dynamic/<slug>/`.
Add `/dynamic/` to `navbar.links` yourself — the theme does not assume the
page exists.

### Post frontmatter extras

```yaml
---
title: Hello
pinned: true           # sort above the date order, badge on cards
updated: 2026-10-20    # last-updated date beside the publish date
hidden: true           # deploy the page but keep it out of every listing
no_segment: true       # opt out of long-post segmentation
license: CC-BY-4.0     # override the theme licence notice
licenseUrl: https://…
---
```

### Per-post language

A post can declare its own language without changing the site UI language:

```yaml
---
title: Hello
lang: en_US            # or the alias `language:`
multi_language:
  zh_CN: /posts/hello/
  en_US: /posts/hello-en/
---
```

`lang` sets that page's `<html lang>` and `og:locale`; `multi_language` lists
the translated versions — each key becomes an `hreflang` alternate link and a
link in the switcher above the article.

### i18n

`i18n/<language>.yaml` holds the UI strings; the language is resolved by Ngwg
(`language` in `ngwg.yaml` → `$NGWG_LANG` → theme `default_language`). Nav items
may use an i18n key (`home`, `archives`, …) or a literal label.

## Comments

```yaml
theme:
  firefly:
    comments:
      enable: true
      provider: giscus
      giscus:
        repo: your/repo
        repoId: …
        category: …
        categoryId: …
```

## Customising

- Override any template by keeping your own copy of the theme directory and
  pointing `themes.firefly` at it, or fork this repository.
- Layouts live in `layout/` (same base names as `layouts:` in `theme.yaml`),
  reusable fragments in `partial/`, stylesheets in `assets/css/`, the runtime
  in `assets/js/` with `main.js` as the only script the page loads.
- An `icon:` value may be a full `collection:icon` reference from any iconify
  pack you install (e.g. `icon: fa7-brands:codeberg`), or a short name that is
  looked up in `ICON_MANIFEST` (in `partial/icon.ejs`) and then in the packs
  declared in `package.json`. Unknown names render as an empty placeholder
  instead of failing the build.
- The theme's npm dependencies (the iconify packs) are installed by Ngwg on
  first build; `ngwg update theme firefly` installs them when fetching the
  theme into `.ngwg/themes/`.

## Credits & license

MIT. See `LICENSE` and `NOTICE`. The colour system, layout and interaction
design are inspired by [Firefly](https://github.com/CuteLeaf/Firefly)
([Fuwari](https://github.com/saicaca/fuwari)); the templates, CSS and JS here
are an original implementation for Ngwg. Bundled wallpapers/avatar/logo are
copied from Firefly under the same MIT license.
