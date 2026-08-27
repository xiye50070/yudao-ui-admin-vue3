# 数据市场运营工作台 Design QA

## Evidence

- source visual truth path: `/Users/wangmingzhang/.codex/generated_images/01a036ce-41fd-71e0-bd2b-d7698bf52a89/exec-a0f9d80a-d1ba-4245-abbf-94d6964eceda.png`
- implementation screenshot path: `/Users/wangmingzhang/.codex/visualizations/2026/08/25/01a036ce-41fd-71e0-bd2b-d7698bf52a89/data-market-home-implementation-v2.png`
- full-view comparison: `/Users/wangmingzhang/.codex/visualizations/2026/08/25/01a036ce-41fd-71e0-bd2b-d7698bf52a89/data-market-home-comparison-v2.png` (left: source, right: implementation)
- focused lower-region comparison: `/Users/wangmingzhang/.codex/visualizations/2026/08/25/01a036ce-41fd-71e0-bd2b-d7698bf52a89/data-market-home-focused-comparison-v2.png` (left: source, right: implementation)
- viewport: `1487 x 1058` CSS px
- source pixels: `1487 x 1058`; implementation pixels: `1487 x 1058`
- density normalization: both artifacts compared at 1:1 pixel dimensions; no scaling or device frame
- state: signed-in administrator, light theme, data-market menu expanded, live local APIs, current permission routes

## Full-view comparison

The implementation preserves the source hierarchy: compact title/actions, a mist-blue process focus panel, a two-column application/assets region, quick entries, and system notices. All major regions fit in the matched viewport after the second pass. Existing product chrome (the tags row and live menu contents) remains unchanged because it is outside the homepage component.

## Focused-region comparison

The focused comparison covers the dense table, four asset metrics, six quick entries, and notices at readable 1:1 resolution. It confirms that real long application numbers are truncated without colliding with names, all four verified asset totals remain on one row, and the notice card is visible above the fold.

## Required fidelity surfaces

- Fonts and typography: uses the product's system Chinese sans-serif stack and existing primary token. Heading/body scale, weight, line height, truncation, and numeric alignment remain consistent with the source hierarchy. No decorative display font was introduced.
- Spacing and layout rhythm: hero height, card gaps, two-column proportions, radii, borders, and vertical rhythm align with the source after pass 2. The actual tags row changes the available canvas, so the homepage header and hero were compressed to retain all operational regions.
- Colors and visual tokens: mist-blue `#eff7ff` to `#e2f0ff` focus surface, white cards, restrained shadows, blue process states, teal completion, and semantic warning/success colors preserve the approved visual direction.
- Image quality and asset fidelity: the target contains interface icons rather than photographic/raster assets. The implementation uses the product's real Iconify/Element Plus icon library; no emoji, placeholder imagery, custom SVG, or CSS illustration substitutes are used.
- Copy and content: all displayed values come from verified APIs and fields. Unsupported mock fields such as priority, owner, waiting duration, timeout, overdue, daily/monthly deltas, and fabricated announcements were removed. Zero remains a valid displayed value; unauthorized modules are not requested or rendered.
- Responsiveness: at `1024 x 800`, document and body width both remained `1024`, the focus panel remained visible, and the content grid collapsed to one `784px` column without page overflow.
- Accessibility and states: semantic headings, table headers, native buttons, accessible refresh label, visible status text, reduced-motion handling, loading/empty/error states, and title text for truncated values are present.

## Interaction and console verification

- `处理待办` navigated to `/data-market-management/application` and rendered the application filter.
- `数据集管理` navigated to `/data-market-management/dataset`.
- Refresh returned the homepage to `接口实时数据`.
- No error was logged from the homepage origin. Observed console noise came from browser extensions plus the application's pre-existing Vue Router `next()` deprecation warning; neither originates in `src/views/Home/Index.vue`.

## Comparison history

### Pass 1 — blocked

- [P2] The focus panel was about one third taller than the source, pushing system notices below the matched viewport.
- [P2] Four asset metrics wrapped to a second row, making the right column too tall.
- [P2] Real long application numbers visually collided with application names.

Fixes: removed decorative English kickers, reduced homepage header and focus-panel vertical spacing, tightened summary rows and process nodes, kept four asset metrics on one row, and added safe ellipsis/title behavior for real application numbers.

### Pass 2 — passed

Post-fix evidence in the full and focused comparison shows all major regions within the matched viewport, four asset metrics in one row, and clean separation between application number and name. No actionable P0/P1/P2 fidelity, usability, or responsiveness findings remain.

## Accepted differences / P3

- The implementation shows the product's real tags row and current menu inventory; the source mock omitted the tags row.
- Real API values and the single authorized system notice naturally differ from the source's illustrative numbers and fabricated notice copy.
- The implementation uses quieter outline icons than the mock's filled process icons to stay consistent with the existing product icon system.

## Implementation checklist

- [x] Preserve existing business shell and navigation.
- [x] Remove all advertising, repository promotion, and fake analytics blocks.
- [x] Gate modules by both current route and permission.
- [x] Load verified application, asset, master-data, and notice APIs independently.
- [x] Preserve valid zeroes and isolate unavailable data.
- [x] Verify desktop fidelity, narrower desktop layout, primary navigation, refresh, and console.

final result: passed

---

# 登录页轻盈蓝框重设计 Design QA

## Evidence

- source visual truth path: `/Users/wangmingzhang/.codex/generated_images/01a04110-917b-7110-a859-1cada5f4f4e5/exec-4fa07efe-6475-4d0e-9e93-80826bea6c33.png`
- implementation screenshot path: `/Users/wangmingzhang/.codex/visualizations/2026/08/27/01a04110-917b-7110-a859-1cada5f4f4e5/login-implementation-1487x1058.png`
- full-view comparison: `/Users/wangmingzhang/.codex/visualizations/2026/08/27/01a04110-917b-7110-a859-1cada5f4f4e5/login-reference-vs-implementation.png` (left: source, right: implementation)
- responsive evidence: `/Users/wangmingzhang/.codex/visualizations/2026/08/27/01a04110-917b-7110-a859-1cada5f4f4e5/login-responsive-1024x768.png`, `/Users/wangmingzhang/.codex/visualizations/2026/08/27/01a04110-917b-7110-a859-1cada5f4f4e5/login-responsive-1024x768-bottom.png`, and `/Users/wangmingzhang/.codex/visualizations/2026/08/27/01a04110-917b-7110-a859-1cada5f4f4e5/login-mobile-390x844.png`
- matched desktop viewport: `1487 x 1058` CSS px
- source pixels: `1487 x 1058`; implementation pixels: `1487 x 1058`
- state: signed out, account-login form, light theme, environment-driven tenant and account defaults

## Full-view comparison

The implementation preserves the selected light-frame direction: a softly tinted page edge, large rounded white shell, restrained product header, centered account form, and a pale-blue data-capability panel. Desktop shell margins, `1.1 : 1` column ratio, form width, panel position, heading rhythm, primary action, and orbit-art scale were calibrated against the same-size source in two visual passes.

## Required fidelity surfaces

- Fonts and typography: uses the product's existing Chinese system font stack, with a `30px` account heading, compact field labels, and restrained supporting copy. No decorative typeface was introduced.
- Spacing and layout: the shell uses the source-like outer breathing room, `32px` radius, `8px` ice-blue border, `96px` header, and matched form/panel proportions. The desktop panel disappears below `1080px` so authentication remains focused and readable.
- Colors and tokens: blue primary actions, white form surfaces, pale-blue illustration field, and low-elevation cool shadows match the approved direction while preserving the existing theme switch.
- Image quality and asset fidelity: the right-hand orbit is a real generated raster asset at `1254 x 1254`, placed without stretching or a visible background seam. Product logo and field icons reuse existing project assets and Iconify/Element Plus integration.
- Copy and content: the marked social-login and `萌新必读` sections are removed. Tenant, username, password, remember-me, reset-password, mobile-login, QR-login, and registration capabilities remain intact.
- Responsiveness: at `1024 x 768`, the illustration is removed, there is no horizontal overflow, and the internally scrollable page exposes all actions. At `390 x 844`, all account inputs and four actions fit in one viewport with a `390px` client and scroll width.
- Accessibility and states: the account and visual regions have semantic labels, inputs retain labels and autocomplete hints, visible buttons remain native Element Plus controls, focus styles are present, and reduced-motion preferences are respected.

## Interaction and console verification

- Account login switched to mobile login and returned successfully.
- Account login switched to QR login and returned successfully.
- Account login switched to registration and returned successfully.
- Forgot-password opened the reset-password form and returned successfully.
- Password visibility changed `password -> text -> password`.
- Theme switching enabled dark mode and restored light mode.
- The language menu exposed `简体中文` and `English` without changing the current locale.
- No login-page error was logged. The only observed console message is the application's pre-existing Vue Router `next()` deprecation warning.

## Comparison history

### Pass 1 — refinement required

- [P2] The outer shell filled too much of the viewport compared with the source.
- [P2] The illustration panel and orbit artwork were oversized and vertically distributed too low.
- [P2] The raster artwork background was slightly darker than the panel, exposing a rectangular seam.
- [P2] The primary action used the application's lighter default blue instead of the selected visual's stronger blue.

Fixes: matched the source's `52px` desktop perimeter, increased header breathing room, changed the content columns to `1.1 : 1`, aligned the panel color to the raster edge color, moved and resized the orbit composition, and set the primary button to `#1769f5`.

### Pass 2 — passed

The final side-by-side comparison and responsive evidence show no actionable P0/P1/P2 fidelity, usability, accessibility, or responsive findings. All retained entry points and visible state transitions were verified in the local browser.

## Accepted differences / P3

- The real ThemeSwitch and LocaleDropdown stay as the product's compact controls; the source mock showed expanded text labels.
- The source's decorative grid and carousel dots are omitted because they do not represent product functionality or an available source asset.
- Tenant and account defaults remain environment/cache driven instead of hard-coding the illustrative `首都实业` value.

## Implementation checklist

- [x] Remove the marked social-login and onboarding/promotion content.
- [x] Preserve all supported authentication entry points and validation logic.
- [x] Use a real raster illustration and existing icon system.
- [x] Add Chinese and English copy for the redesigned visual.
- [x] Verify matched desktop fidelity, tablet/mobile responsiveness, theme, locale menu, password visibility, and form switching.

final result: passed

---

# 数据目录重设计 Design QA

## Evidence

- source visual truth path: `/Users/wangmingzhang/.codex/generated_images/01a036ce-41fd-71e0-bd2b-d7698bf52a89/exec-2141103b-6afc-4250-9328-d087c91853fd.png`
- implementation screenshot path: `/Users/wangmingzhang/.codex/visualizations/2026/08/25/01a036ce-41fd-71e0-bd2b-d7698bf52a89/catalog-implementation-1536x1024.png`
- full-view comparison: `/Users/wangmingzhang/.codex/visualizations/2026/08/25/01a036ce-41fd-71e0-bd2b-d7698bf52a89/catalog-comparison-side-by-side.png` (left: source, right: implementation)
- responsive evidence: `/Users/wangmingzhang/.codex/visualizations/2026/08/25/01a036ce-41fd-71e0-bd2b-d7698bf52a89/catalog-responsive-1024x800.png`
- matched desktop viewport: `1536 x 1024` CSS px at device scale factor 1
- source pixels: `1536 x 1024`; implementation pixels: `1536 x 1024`
- state: signed-in administrator, light theme, data-market menu expanded, live local APIs, current permission routes

## Full-view comparison

The implementation matches the approved search-first direction: compact title and actions, one restrained asset strip, a two-card taxonomy rail, one filter row, an Element Plus data table, and pagination. The final card height and whitespace now align with the source, and no advertising, fabricated charts, or unsupported operational metrics are present.

## Required fidelity surfaces

- Fonts and typography: uses the product's existing Chinese system sans-serif stack. Heading, metric values, filter text, table headers, and row text preserve the source hierarchy without adding decorative typography.
- Spacing and layout: desktop proportions, `14px` section gaps, compact hero, segmented metric strip, `230px` taxonomy rail, table density, borders, radii, and low-elevation shadows follow the selected visual. The data card fills the usable viewport instead of leaving an exposed empty page.
- Colors and tokens: existing Element Plus primary blue, white surfaces, neutral page background, semantic success/info states, and the real standard-tag color are used. No gradients or decorative CSS illustrations were introduced.
- Icons and assets: all visible icons come from the project's existing Iconify/Element Plus integration. There are no custom SVG, emoji, placeholder images, or fake product assets.
- Copy and content: dataset, domain, tag, and source totals come from verified management APIs. Dataset rows only use returned fields plus names resolved from permitted domain/source responses. Missing references render `—` or `已停用或不可见`; valid zeroes remain visible.
- Permissions and failure states: each module is gated by both current route and permission before its API is called. Module failures render local `暂不可用` states and do not hide unrelated successful data.
- Responsiveness: at `1024 x 800` with the existing navigation collapsed, metrics become `2 x 2`, taxonomy cards become two columns, filters wrap, and the dataset table remains usable without page-level horizontal overflow.
- Accessibility: semantic `h1`/`h2` structure, table headers, native buttons, accessible refresh label, focus-visible states, reduced-motion handling, and Element Plus loading/empty/error components are present.

## Interaction and console verification

- Keyword `test_family` returned only the matching real dataset.
- Clicking the real `HR` theme-domain card returned the three HR datasets.
- Selecting source system `协同办公系统` returned only `测试B`.
- Selecting publish status `草稿` produced the real empty result `暂无匹配的数据集`.
- `进入数据集管理` navigated to `/data-market-management/dataset`.
- Refresh restored verified totals: data sets `4`, domains `2`, standard tags `1`, source systems `2`.
- Rapid out-of-order dataset requests are sequence-guarded so an older response cannot overwrite the latest filter result.
- No error originated from `src/views/dataMarket/catalog/index.vue`. Console noise was limited to a browser-extension modal-list error and the application's pre-existing Vue Router `next()` deprecation warning.

## Comparison history

### Pass 1 — refinement required

- [P2] Extra update-time text, reset control, and physical-table subtitles made the implementation denser than the selected visual.
- [P2] The main catalog card ended too early, leaving more exposed page background than the source.

Fixes: removed the extra copy and control, kept the source's single-row dataset presentation, strengthened the real tag tint, and extended the workspace card to the usable viewport height.

### Pass 2 — responsive issue found

- [P2] At a `1024px` viewport, the existing application sidebar reduced the content canvas enough that the desktop catalog columns became cramped.

Fix: moved the catalog's stacked-layout breakpoint to `1180px`; the verified responsive screenshot shows clean `2 x 2` metrics, two taxonomy cards, wrapped filters, and a full-width table.

### Pass 3 — passed

The final combined desktop comparison and responsive evidence show no actionable P0/P1/P2 fidelity, usability, accessibility, or responsive findings. Browser interaction checks and the dedicated request-order regression test also pass.

## Accepted differences / P3

- The implementation preserves the product's real header, tags row, sidebar widths, icons, and current menu inventory; the generated visual approximated those shell details.
- Real API records determine the displayed text and table values, so content can differ from illustrative mock values while retaining the selected layout.

## Implementation checklist

- [x] Use Element Plus controls, loading, empty, status, table, tag, and pagination components.
- [x] Preserve existing shell and routes.
- [x] Display only verified modules, permissions, API fields, and real totals.
- [x] Isolate module failures and preserve valid zeroes.
- [x] Verify desktop fidelity, responsive layout, filters, navigation, refresh, request ordering, and console.

final result: passed
