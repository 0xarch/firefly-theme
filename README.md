# Firefly

由 [0xarch](https://github.com/0xarch) 以个人名义发布、面向 [Ngwg](https://github.com/Ngwgers/Ngwg-core) 的 EJS 主题。提供壁纸 banner、文章卡片、可配置双侧栏、归档/标签/分类、404、搜索、动态页、PJAX、长文分段和 giscus 评论集成。UI 翻译提供 `zh_CN` 与 `en_US`。

## 安装

在站点 `ngwg.yaml` 中声明：

```yaml
title: 我的站点
theme: firefly
themes:
  firefly: https://github.com/0xarch/firefly-theme.git
language: zh_CN
plugins:
  seo: https://github.com/Ngwgers/Ngwg-ext-seo.git
```

通过 Ngwg CLI 使用时，files、feature 由 CLI 的回退声明补齐。主题依赖官方 [Ngwg-files](https://github.com/Ngwgers/Ngwg-files) 的 EJS/Markdown deployer，以及 [Ngwg-feature](https://github.com/Ngwgers/Ngwg-feature) 的 helper；直接嵌入 Core 时需由调用方提供这两个插件。SEO 插件可省略，主题不会因其仅出现在 `plugins.optional` 中就自动启用它。

```fish
ngwg build
ngwg dev
```

主题的图标包依赖写在 [package.json](package.json)，Ngwg 首次发现缺失 `node_modules` 时会运行 `bun install`。已有依赖目录时 Core 不会自动检查其是否过期。

### 首次使用的图片

`assets/images/` 被 git 忽略，仓库不包含默认配置引用的壁纸、头像、logo 和 favicon。将自己的文件放到站点 `source/assets/images/`，或者覆盖对应的主题 URL。直接引用远程图片也可以。图片路径不会因为写在主题配置中而由 Markdown 图片提取器自动收集。

favicon 在 `partial/header.ejs` 中固定引用 `/assets/images/favicon/firefly-32.png` 与 `firefly-180.png`；提供同路径文件，或修改 header partial。

## 配置方式

全部默认配置见 [theme.yaml](theme.yaml)。在 `ngwg.yaml` 使用映射形式的 `theme` 覆盖，替代原来的 `theme: firefly`：

```yaml
theme:
  firefly:
    themeColor:
      hue: 210
      defaultMode: dark
    profile:
      name: 我的名字
      avatar: /assets/images/avatar.webp
    banner:
      desktop: [/assets/images/wallpaper.webp]
      mobile: [/assets/images/wallpaper-mobile.webp]
    sidebar:
      position: left
```

普通对象按键深合并，数组整体替换。`themes.firefly.options` 也可提供配置底座，优先级低于 `theme.firefly`。下面列出当前实现读取的字段；未列出的任意新增字段不会自动产生功能。

### 通用与外观

| 配置 | 默认值 / 作用 |
| --- | --- |
| `per_page` | 10，首页分页大小 |
| `default_language` | `zh_CN`，UI 默认语言 |
| `segment_threshold` | 8000，HTML 分段阈值，files 插件同名选项优先 |
| `layouts` | index/post/page/archive/tag/category 映射；`404.ejs` 自动用于错误页，`dynamic.ejs` 由 frontmatter 选择 |
| `themeColor.hue` | 165，oklch 调色板色相，建议 0–360 |
| `themeColor.defaultMode` | `system`；`light` / `dark` / `system` |
| `themeColor.displaySettings` | true，显示色相滑块与 Atom One/GitHub 代码配色开关 |
| `profile.name/avatar/bio` | 侧栏名字、头像和简介 |
| `profile.links[]` | `{ name, icon, url, showName }`，侧栏链接 |
| `announcement.enable/title/content/closable` | 公告卡片，标题为空时使用翻译表 |
| `announcement.link` | `{ enable, text, url, external }`，公告按钮 |

手动颜色模式、色相和代码配色选择保存在浏览器 `localStorage`，会覆盖下一次访问时的配置默认值。

### 导航、banner 与侧栏

| 配置 | 默认值 / 作用 |
| --- | --- |
| `navbar.title` | 空时使用站点标题 |
| `navbar.widthFull` / `menuAlign` | false / `center`；`menuAlign: left` 靠近站点名 |
| `navbar.mode` | `dynamic`；`static` 随页滚动、`fixed` 固定、`dynamic` 下滚隐藏 |
| `navbar.logo.light/dark` | 两种配色下的 logo URL，空值可不渲染 |
| `navbar.links[]` | `{ name, url, icon, external }`；`name` 可为翻译表 `nav` 下的键或普通文案 |
| `navbar.links[].children` | 子链接数组，桌面下拉菜单、移动端折叠菜单 |
| `banner.mode` | `banner` / `none`；none 隐藏壁纸与 banner 内容 |
| `banner.position` / `dimOpacity` | 桌面壁纸定位 / 黑色遮罩透明度（建议 0–1） |
| `banner.desktop/mobile` | 图片 URL 或 URL 数组，渲染每个页面时分别随机选择，移动图片缺失则回退桌面图片 |
| `banner.homeText.enable/title/titleSize` | 首页标题显示、文案与 CSS 字号 |
| `banner.homeText.subtitle/subtitleSize` | 副标题字符串数组与 CSS 字号 |
| `banner.homeText.typewriter` | `{ enable, speed, deleteSpeed, pauseTime }`，毫秒；关闭时客户端随机选择一条副标题 |
| `banner.homeText.links[]` | `{ name, icon, url, showName }`，首页 banner 链接 |
| `banner.postInfo.mode` | `description` / `meta`，文章 banner 展示摘要或日期/字数/阅读时长 |
| `sidebar.enable/position` | true / `both`；position 为 `left` / `right` / `both` |
| `sidebar.tabletSidebar` | `left`；双栏在 768–1279px 保留哪一侧 |
| `sidebar.hideOnPostPage` | false，true 时文章页隐藏侧栏 |
| `sidebar.left/right` | 按顺序排列 widget 名称；可用 profile、announcement、categories、tags、stats、recent、toc |
| `sidebar.collapse.categories/tags` | 5 / 10，超过条目数时裁切并显示展开按钮；0 关闭裁切 |

768px 以下，存在的侧栏移到正文后；768–1279px 保留单侧；1280px 起显示配置的侧栏。没有可渲染 widget 的侧栏不会占据空列。

### 卡片、统计、搜索与许可

| 配置 | 默认值 / 作用 |
| --- | --- |
| `postList.layout/mobileLayout` | `list` / `grid`；列表或网格卡片，移动布局在 780px 以下生效 |
| `postList.coverPosition` | `right` / `left`，list 模式封面位置 |
| `postList.descriptionLines` | 2，摘要行数；0 不裁切 |
| `postList.showTags/tagCount` | true / 3；tagCount ≤ 0 显示全部标签 |
| `postList.stats.published/words/reading` | 默认 true，日期/字数/阅读时长 |
| `siteStats.enable/startDate` | true / `2025-01-01`，站点统计和运行天数起点 |
| `recent.count` | 5，最近更新文章数；0 只保留热力图 |
| `recent.heatmap.enabled/clickable` | true / true，热力图和点击过滤 |
| `search.enable` | false，开启客户端文章搜索 |
| `search.limit/excerptLength/hotkey` | 12 / 120 / true，结果数、索引摘要长度、Ctrl/Cmd+K 快捷键 |
| `license.enable/name/url` | 默认显示 CC BY-NC-SA 4.0 文章许可块 |
| `dynamic.title/description/profileUrl` | 动态页标题、介绍和头像链接；标题/介绍为空时回退翻译，profileUrl 默认 `/about/` |

最近文章按 `updated` → `date` 排序；热力图取最新发表年份，分为 12 个月 × 每月 4 个日期桶（1–7、8–14、15–21、22 日起），不是完整 ISO 周历。搜索索引来自全部可见文章的标题、日期、标签、分类与截断摘要，不索引完整正文和普通页面；没有搜索服务器。

## 文章与页面

```yaml
---
title: Hello
date: 2026-10-20
updated: 2026-10-21
pinned: true
cover: /assets/images/cover.webp
no_segment: true
license: CC BY 4.0
licenseUrl: https://creativecommons.org/licenses/by/4.0/
author: 我的名字
---
```

文章放在 `source/_posts/`。`pinned: true` 排在普通文章前；`updated` 显示更新日期并影响最近文章卡片。封面按 `cover` → `image` → `banner` 字符串取值。`<!-- more -->` 前内容用作列表摘要，文章页保留全文。`hidden: true` **文章**仍有页面，但不进入首页、归档、分类、标签、搜索和 feed。普通页面不应用这个文章隐藏规则。

### 动态页

```text
source/dynamic/
├── index.md
├── 2026-09-12-night-walk.md
└── photos/
    └── another.md
```

`index.md`：

```markdown
---
title: 动态
layout: dynamic
---
```

布局会从 `site.pages` 中选择与聚合页同目录前缀的其他页面，**包含子目录页面**，按 pinned（真值）优先、date 倒序排列；`location` 可显示地点。每条仍是普通页面，例如 `2026-09-12-night-walk.md` 的地址是 `/dynamic/2026-09-12-night-walk/`，不会因为文件名带日期而删除 URL 中的日期前缀。普通页面的 `slug` 不改变该地址。

可用输入框和年份选择过滤已经渲染的动态内容。不要把要隐藏的普通页面仅标记 `hidden: true` 后放在聚合目录中；当前布局不会据此排除它。导航不会自动添加动态页，需要自行修改 `navbar.links` 数组。

### 单篇语言

```yaml
---
title: Hello
lang: en_US
multi_language:
  zh_CN: /posts/hello/
  en_US:
    url: /posts/hello-en/
    title: English
---
```

`lang`（或 `language` 别名）改变文档 `<html lang>`，安装 SEO 插件时也影响 `og:locale`；UI 翻译仍由站点部署语言决定。`multi_language` 只声明已有翻译页面，主题不会翻译内容或生成额外页面。键成为 hreflang alternate，文章上方还会显示语言切换链接。与 SEO helper 配合时建议使用站点根相对路径，避免其 URL 拼接将完整外链当作站点路径。

## 评论

```yaml
theme:
  firefly:
    comments:
      enable: true
      provider: giscus
      giscus:
        repo: your/repo
        repoId: YOUR_REPO_ID
        category: General
        categoryId: YOUR_CATEGORY_ID
        mapping: pathname
        reactionsEnabled: true
        inputPosition: bottom
        lang: zh-CN
```

仅实现 giscus；至少需要 `repo`、`repoId`，其他值应使用 giscus 为目标仓库生成的配置。`mapping` 默认 pathname，`inputPosition` 默认 bottom。模板接受 `giscus.theme`，但当前客户端加载器会按主题的实际深浅色覆盖为 light/dark，并在切换时更新 iframe。加载器在页面初始化时插入 giscus 脚本，iframe 使用 lazy loading；不是等滚动到评论区才发出所有请求。

## Markdown 与分段

Markdown 方言由 Ngwg-files 提供，包括 admonition、GFM alert、task list、tabs、Mermaid 和可选 TeX。TeX 默认关闭：

```yaml
plugins:
  files:
    option:
      markdown:
        tex:
          enabled: true
          backend: katex
      segment_threshold: 8000
      chunk_size: 4000
```

单篇 frontmatter `tex: true` / `katex` / `mathjax` / `false` 覆盖全局设置；KaTeX CSS/字体由插件部署、主题引用，MathJax 后端在构建期渲染。Mermaid 在浏览器运行，片段加载后也会初始化新图表和 tabs。

文章 HTML 超过阈值且有可用顶层块切点时，只将首段写入文章页，其余写入 `seg/N.html`。Firefly 接近已加载内容末尾时一次请求一段；目标锚点位于后续片段时，会继续取段寻找目标。片段失败自动重试一次，再失败会跳过该片段，因此网络故障可能造成正文缺段。

分段依赖 JavaScript；禁用 JavaScript 时只看到首段。需要完整无脚本阅读时，将 `chunk_size` 设为负数，或为文章设置 `no_segment: true`。无 JavaScript 时搜索、TOC、tabs 切换、热力图、评论和手动配色等交互也不可用，静态正文与普通链接仍能使用。

## PJAX、SEO 与部署限制

PJAX 默认开启，没有公开的 `theme.pjax` 开关。同源站内页面导航更新地址后再初始化页面组件，保持菜单高亮与新地址一致；popstate 也会重建页面。用链接属性 `data-no-pjax` 可退出拦截。404 布局生成 `public/404.html`，带 noindex；需静态托管平台自行配置错误响应。

可选 SEO 插件生成 RSS、Atom、sitemap，并提供 meta helper；`ngwg.yaml.url` 是站点 origin。当前 Core 生成的分页、归档、标签、分类载荷缺少 `page.url`，SEO helper 会将这些页面的 canonical/og:url 回退到首页，不是完整的逐列表页 SEO。

主题资源、导航、卡片与分类链接大量使用 `/...`，建议在域名根目录部署。单独设置 `baseurl: /blog/` 不会重写主题链接，不能直接实现子路径部署。

## 定制与目录

- 布局位于 `layout/`，partial 位于 `partial/`；widget 子目录中的文件仍以末级文件名调用，例如 `partial('recent')`。
- 样式在 `assets/css/`，脚本在 `assets/js/`，入口是 `main.js`，由浏览器加载其 ES module 依赖。
- `partial/icon.ejs` 接受短名称或 `collection:icon`，先查内置映射，再查主题中安装的 Iconify 包；未知图标输出占位并记录警告，不会自动安装新的图标包。
- 定制模板应 fork 主题或把 `themes.firefly` 指向自己的本地目录。修改主题依赖后，应全量构建或重启 dev；主题热重载不刷新插件集。

完整主题契约见 [主题开发文档](https://github.com/Ngwgers/Ngwg-docs/blob/main/theme-development.md)。

## 许可与来源

[MIT](LICENSE)，第三方来源与归属见 [NOTICE](NOTICE)。配色、布局和交互参考 [Firefly](https://github.com/CuteLeaf/Firefly) / [Fuwari](https://github.com/saicaca/fuwari)。默认配置引用的演示图片不随本仓库分发，使用者应提供有权使用的图片。
