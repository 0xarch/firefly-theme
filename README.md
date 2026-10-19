# Ngwg-firefly-theme

Clean, bright and modern theme for the [Ngwg](https://github.com/Ngwgers/Ngwg-core)
static site generator — a port of the [Firefly](https://github.com/CuteLeaf/Firefly)
Astro theme (itself based on [Fuwari](https://github.com/saicaca/fuwari)) to the
Ngwg theme contract.

Everything is plain **EJS + CSS + vanilla JS**: no npm packages, no build step,
no runtime framework. Dependencies are provided by Ngwg's own plugins.

## Features

- Wallpaper banner with a per-build random image (desktop/mobile variants) and
  a typewriter subtitle on the home page
- Post cards with optional cover, excerpt clamping and tag list
- Archive (grouped by year), tag and category listing pages
- Post page with banner info, tag/category meta, neighbour links, comments hook
- Left sidebar widgets: profile, announcement, categories, tags; right sidebar
  TOC (client-rendered, scroll-spy)
- Light/dark/system theme with an accent hue you can change from one variable
- Pjax navigation, reading progress bar, back-to-top, code copy buttons
- Long-post segmented lazy loading (provided by Ngwg-files)
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
  firefly: https://github.com/Ngwgers/Ngwg-firefly-theme.git

plugins:
  files: {}
  feature: {}
  seo: {}          # optional
```

`files`/`feature` may be declared with only `option` (an empty value), in which
case Ngwg uses the official source. Then run `ngwg build`.

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
| `profile.*` | sidebar avatar, name, bio and links |
| `announcement.*` | sidebar announcement card (enable, content, link, closable) |
| `navbar.*` | title, logo, `menuAlign`, `mode` (`static`/`fixed`/`dynamic`), links |
| `banner.*` | `mode` (`banner`/`none`), image lists, `position`, `dimOpacity`, home title/subtitle/typewriter/links, post info |
| `sidebar.enable/position/hideOnPostPage` + `left`/`right` | widget columns (`profile`, `announcement`, `categories`, `tags`, `toc`) |
| `postList.*` | list layout (`data-layout`), cover side, excerpt lines, stats, tags |
| `comments.*` | giscus hook (disabled by default) |

Local assets are addressed as `/assets/...` (the theme's `assets/` directory is
deployed verbatim). Point `profile.avatar`, `banner.desktop` etc. at your own
files placed under `source/assets/` or at remote URLs.

### i18n

`i18n/<language>.yaml` holds the UI strings; the language is resolved by Ngwg
(`language` in `ngwg.yaml` → `$NGWG_LANG` → theme `default_language`). Nav items
may use an i18n key (`home`, `archives`, …) or a literal label.

## Integration hooks

`comments`, `search` and `music` are reserved, off-by-default hook points, so the
theme can stay dependency-free while leaving room for these features:

- **Comments** — only giscus is wired up. Set
  `comments: { enable: true, provider: giscus, giscus: { repo, repoId, category, categoryId } }`;
  the loader script injects `https://giscus.app/client.js` on demand and follows
  the light/dark switch.
- **Search** / **Music** — no implementation yet; add a widget partial under
  `partial/widget/` and register it in `sidebar.left`/`right`.

## Customising

- Override any template by keeping your own copy of the theme directory and
  pointing `themes.firefly` at it, or fork this repository.
- Layouts live in `layout/` (same base names as `layouts:` in `theme.yaml`),
  reusable fragments in `partial/` (call with `partial('name', { ...extra })`).
- Icons are inlined from `partial/icon.ejs` — add an entry to `ICONS` (stroke)
  or `FILLED` and use `partial('icon', { name: 'my-icon' })`.

## Known limitations

- The TOC is built client-side from the rendered `<h2>`/`<h3>`/`<h4>` and grows
  as long-post segments load; without JavaScript there is no TOC.
- Long posts whose headings only appear in later segments still get a TOC (the
  widget is emitted based on the full source, `page.body`), but it fills in
  progressively.
- Capability tiers beyond the core blog experience (live2d, music player, photo
  carousel, immersive reading) are not ported.
- Ngwg does not generate `/tags/` or `/categories/` index pages, so the sidebar
  links only to the per-slug pages.

## Credits & license

MIT. See `LICENSE` and `NOTICE`. The colour system, layout and interaction
design are inspired by Firefly/Fuwari; the templates, CSS and JS here are an
original implementation for Ngwg. Bundled wallpapers/avatar/logo are copied from
Firefly under the same MIT license.
