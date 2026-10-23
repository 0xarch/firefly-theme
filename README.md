# Firefly

Clean, bright and modern theme for the [Ngwg](https://github.com/Ngwgers/Ngwg-core) static site generator.

As for now this is a port of the [Firefly](https://github.com/CuteLeaf/Firefly) Astro theme (itself based on [Fuwari](https://github.com/saicaca/fuwari))
to the Ngwg theme contract.

This theme uses EJS + CSS + ES (Vanilla).

## Features

- Wallpaper banner with a per-build random image (desktop/mobile variants) and
  a typewriter subtitle on the home page
- Post cards with optional cover, excerpt clamping and tag list
- Archive (grouped by year), tag and category listing pages
- Home pagination with the original theme's square page buttons and a
  jump-to-page box, on upstream's 768/780/1280px breakpoints
- Post page with banner info, tag/category meta, neighbour links, licence notice
  and a comments hook; an `updated:` frontmatter adds a last-updated date beside
  the publish date, skipped when it equals the publish day
- Left sidebar widgets: profile, announcement, categories, tags; right sidebar
  site statistics, a recent-activity card and the TOC (client-rendered,
  scroll-spy); below the desktop breakpoint the TOC card gives way to a floating
  button with the same list
- "Recent" card: the newest `updated:`/published posts above a month × week
  heatmap (no month labels) whose cells carry a tooltip and, when
  `recent.heatmap.clickable` is on, filter the list to that week
- Light/dark/system theme switch, plus a display-settings panel with a live
  accent-hue slider (both stored in `localStorage`) and a `darkreader-lock` so
  browser dark-mode extensions leave the theme alone
- Client-side search, opened from the navbar or with Ctrl/Cmd+K (opt-in)
- Navbar links with dropdown menus (the same groups become accordions in the
  mobile drawer)
- Tag/category widgets that collapse to 7.5rem with a more/collapse toggle once
  they grow past their threshold
- Pjax navigation, a reading progress bar (post pages only), back-to-top and
  code copy buttons
- Long-post segmented lazy loading (provided by Ngwg-files)
- Markdown admonitions (`!!! tip … !!!`, all 15 types the parser knows) with the
  type's tint, icon and label — ported from the
  [Nextario](https://github.com/0xarch/fewu-theme-next) theme, which shares the
  markdown dialect (see known limitations for the one deviation)
- i18n (ships `zh_CN` and `en_US`)
- SEO/RSS/sitemap through [Ngwg-ext-seo](https://github.com/Ngwgers/Ngwg-ext-seo)

## Requirements

- A Ngwg core that exposes the merged theme config to templates (`theme` in the
  render context) — see `Ngwg-docs/theme-development.md`
- [Ngwg-files](https://github.com/Ngwgers/Ngwg-files) (default parser/deployer;
  installed for you when you declare it) — **required**
- [Ngwg-feature](https://github.com/Ngwgers/Ngwg-feature) (helpers used by the
  templates) — **required**
- [Ngwg-ext-seo](https://github.com/Ngwgers/Ngwg-ext-seo) — optional, enables
  the `og:`/`twitter:`/canonical meta, `sitemap.xml` and `rss.xml`

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

Everything under `theme.yaml`'s `theme` section can be overridden from
`ngwg.yaml` via `theme.<name>` — objects merge key by key, scalars replace:

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
| `navbar.*` | title, logo, `menuAlign` (`left` puts the links beside the title, upstream-style), `mode` (`static`/`fixed`/`dynamic`), links |
| `navbar.links[].children` | turns a link into a dropdown menu (hover/click on desktop, accordion in the drawer) |
| `banner.*` | `mode` (`banner`/`none`), image lists, `position`, `dimOpacity`, home title/subtitle/typewriter/links, post info |
| `sidebar.enable/position/tabletSidebar/hideOnPostPage` + `left`/`right` | widget columns (`profile`, `announcement`, `categories`, `tags`, `stats`, `recent`, `toc`); `tabletSidebar` picks the single side kept between 768px and 1279px |
| `sidebar.collapse.categories` / `.tags` | entry count past which a widget is clipped to 7.5rem behind a more/collapse toggle (0 disables; upstream uses 5 and 10) |
| `siteStats.enable/startDate` | sidebar statistics card (posts/categories/tags/words; running days and last-activity are refreshed in the browser) |
| `recent.count` / `recent.heatmap.enabled` / `recent.heatmap.clickable` | sidebar "recent" card: list length, whether the heatmap is drawn, whether a click filters the list |
| `postList.layout` / `postList.mobileLayout` | card layout above / below 780px: `list` (wide cards with the cover beside the text) or `grid` (auto-filled columns) |
| `postList.*` | cover side, excerpt lines, stats, tags |
| `license.*` | end-of-post licence notice (`enable`, `name`, `url`); a post may override with `license` / `licenseUrl` frontmatter |
| `search.enable` / `limit` / `excerptLength` / `hotkey` | client-side search over an index rendered beside the navbar |
| `comments.*` | giscus hook (disabled by default) |

Local assets are addressed as `/assets/...` (the theme's `assets/` directory is
deployed verbatim). Point `profile.avatar`, `banner.desktop` etc. at your own
files placed under `source/assets/` or at remote URLs.

### Responsive layout

The breakpoints follow the original theme:

| Width | Layout |
| --- | --- |
| < 768px | no side columns; the sidebar widgets stack below the content |
| 768-1279px | one sticky side column under the navbar — `sidebar.tabletSidebar` (left by default) when `sidebar.position` is `both` |
| >= 1280px | every configured column |

The listing also switches to `postList.mobileLayout` (grid) below 780px, so a
phone shows one card per row while the ~660-780px band fits two; from 780px up
the wide `list` cards are used.

### Search

`search.enable: true` renders a JSON index of every post (URL, title, date, tags,
categories and the `<!-- more -->` excerpt) beside the navbar and puts a
magnifier in the navbar actions; Ctrl/Cmd+K opens the panel too. Filtering runs
in the browser, so there is no service to run and no build step: every query
token must match, title hits rank first, then tags/categories, then the excerpt.
The arrow keys walk the results and Enter opens one (through pjax when it is
active). `limit` caps the result count, `excerptLength` the stored excerpt and
`hotkey: false` drops the shortcut. Because only the `<!-- more -->` slice is
indexed, a listing page never carries the rest of the article into its HTML.

### Recent card

`partial/widget/recent.ejs` lists the `recent.count` posts with the newest
activity first (`updated:` when present, otherwise `date:`) and draws the
heatmap below a divider. The grid has one column per month and one row per week
of the month (days 1-7, 8-14, 15-21, 22+); the year is the newest publication
year, so a static build never shows an empty grid. Unlike upstream there are no
month labels: each cell carries a tooltip built from `recent.heatmap_week`
(`7 月第 3 周 · 1 篇文章`).

With `recent.heatmap.clickable` (default on) a cell that holds posts replaces
the list with that week's posts, using the same row design; clicking the
selected cell again restores the recent list. Cells without posts only show the
tooltip. The recent list and the grid are rendered at build time, so the card
still reads without JavaScript — only the filtering needs it.

The heatmap counts publication dates while the list sorts by activity, so a post
published in January but updated this week is listed first and appears in the
January cell.

### i18n support

`i18n/<language>.yaml` holds the UI strings; the language is resolved by Ngwg
(`language` in `ngwg.yaml` → `$NGWG_LANG` → theme `default_language`). Nav items
may use an i18n key (`home`, `archives`, …) or a literal label.

## Integration hooks

`comments` and `music` are reserved, off-by-default hook points, so the theme can
stay dependency-free while leaving room for these features:

- **Comments** — only giscus is wired up. Set
  `comments: { enable: true, provider: giscus, giscus: { repo, repoId, category, categoryId } }`;
  the loader script injects `https://giscus.app/client.js` on demand and follows
  the light/dark switch.
- **Music** — no implementation yet; add a widget partial under
  `partial/widget/` and register it in `sidebar.left`/`right`.

## Customising

- Override any template by keeping your own copy of the theme directory and
  pointing `themes.firefly` at it, or fork this repository.
- Layouts live in `layout/` (same base names as `layouts:` in `theme.yaml`),
  reusable fragments in `partial/` (call with `partial('name', { ...extra })`).
- Icons are resolved at render time by `partial/icon.ejs`, which maps a short
  name to an [iconify](https://iconify.design) icon from the packs the original
  theme uses — the same `@iconify-json/*` packages declared in this theme's
  `package.json`. Ngwg installs those dependencies into the theme directory and
  the EJS deployer exposes a theme-scoped `require`, so the drawings are never
  copied into this repository.
  An `icon:` value resolves in this order: a full `collection:icon` reference
  is used as given (any pack you install works, so `icon: fa7-brands:codeberg`
  needs no theme change); otherwise the short name is looked up in
  `ICON_MANIFEST`; otherwise it is searched in the theme's packs, in order
  (`fa7-brands` > `fa7-regular` > `fa7-solid` > `material-symbols`). A name
  only the fallback can resolve works but is reported at verbose level
  (`--verbose`), suggesting the `ICON_MANIFEST` entry that pins it; a name
  nothing can resolve warns (naming the missing pack or icon) and renders as an
  empty placeholder instead of failing the build.

## Known limitations

- The TOC is built client-side from the rendered `<h2>`/`<h3>`/`<h4>` and grows
  as long-post segments load; without JavaScript there is no TOC.
- Long posts whose headings only appear in later segments still get a TOC (the
  widget is emitted based on the full source, `page.body`), but it fills in
  progressively.
- Capability tiers beyond the core blog experience (live2d, music player, photo
  carousel, immersive reading) are not ported.
- Ngwg does not generate `/tags/` or `/categories/` index pages, so the sidebar
  links only to the per-slug pages. Upstream's tag widget turns its "more"
  button into a link to that index; here both widgets expand in place instead.
- The statistics card's running days and last-activity rows are computed in the
  browser; without JavaScript they keep the values from build time.
- On non-home desktop pages the banner is a 45vh band whose wallpaper is cropped
  to that band; upstream instead shifts a 65vh wrapper up behind the panel. The
  visible height and the text centring match, only the crop of the image differs.
- No media is shipped with the theme: `assets/images/` (wallpapers, avatar,
  logo, favicons) is git-ignored, while the default `theme.yaml` still points at
  `/assets/images/...`. A fresh clone therefore renders without those images
  until you copy your own files into the theme's `assets/images/` or into your
  site's `source/assets/images/`.
- The theme depends on npm packages (the iconify sets) and therefore needs
  `node_modules` in the theme directory: `ngwg update theme firefly` installs it
  when fetching the theme into `.ngwg/themes/`, and Core runs `bun install` on
  first build when it is missing. Layouts are EJS, because only the EJS deployer
  exposes `require` to templates.
- The recent card's heatmap covers one year (the newest publication year), so
  older years cannot be selected; clicking a cell is client-side only.
- Admonition titles take the type's accent colour and its icon, while the body
  keeps the normal text colour. Upstream Firefly colours the title only (as
  here); Nextario also tints the body text, which would drop a light-mode
  `warning` body to roughly 2.7:1 contrast, so that part is not copied.

## Credits & license

MIT. See `LICENSE` and `NOTICE`. The colour system, layout and interaction
design are inspired by Firefly/Fuwari; the templates, CSS and JS here are an
original implementation for Ngwg. Bundled wallpapers/avatar/logo are copied from
Firefly under the same MIT license.
