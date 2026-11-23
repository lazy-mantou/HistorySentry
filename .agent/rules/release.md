# HistorySentry 打包与发布规范 (Release & Packaging Rules)

本文档是 **HistorySentry** 项目进行正式版本打包、应用商店物料归档与发布交付的标准门禁与规范准则。在此代码库中触发打包分发或正式发版时，开发者与 AI Agent 必须严格遵守以下约定（注：项目文件夹保持 `HistGuard` 不变，对外产品及项目名统一使用 `HistorySentry`）。

---

## 1. 发布前置质量门禁 (Pre-flight Checklist)

在进入任何正式打包或发版流程之前，必须逐一验证以下前置条件：

### 1.1 版本号三处强同步 (Triple-Sync)
以下三个配置文件中的版本号字段必须完全一致，符合 [SemVer](https://semver.org/lang/zh-CN/) 语义化版本规范：
- [package.json](../../package.json) (`version`)
- [manifest.chrome.json](../../manifest.chrome.json) (`version`)
- [manifest.firefox.json](../../manifest.firefox.json) (`version`)

> **红线**：严禁出现版本号不一致导致的分发撕裂。发版前必须显式检查并同步这三处。

### 1.2 零外部依赖与纯离线红线
- 严禁引入任何运行时第三方 NPM 依赖；
- 严禁引入外部 CDN 脚本、远程字体或网络跟踪代码；
- 扩展必须保持 100% 本地离线运行与零遥测。

### 1.3 自动化测试 100% 通过 (Quality Gate)
- 执行原生单元测试套件：
  ```bash
  npm test
  # 或直接运行: node --test tests/*.test.js
  ```
- 必须确保 **100% 测试通过（0 fail）**。任何存在测试失败或 Flaky 的情况下，严禁进行打包与发布。

### 1.4 多语言文案完整性
- 核心功能如有文案增改，必须在 `src/core/locales/` 下全部 12 种语言字典中 100% 对齐（`en`, `zh-CN`, `zh-TW`, `es`, `ar`, `pt`, `id`, `fr`, `ru`, `de`, `ja`, `ko`）；
- 检查 `_locales/` 目录下的扩展标题与简介清单文件是否完整。

---

## 2. 构建与产物验证 (Build Process & Verification)

### 2.1 执行构建脚本
- 运行原生构建脚本（构建产物自动输出至 `dist/`）：
  ```bash
  node build.js
  ```

### 2.2 产物完整性检验清单
构建完成后，必须校验以下产物目录及核心文件：

#### Chromium 产物 (`dist/chrome/`)
- [x] `dist/chrome/manifest.json`（语法有效，遵循 MV3 Service Worker 架构）
- [x] `dist/chrome/icons/`（全规格图标，含科技蓝与翡翠绿状态）
- [x] `dist/chrome/_locales/`（扩展商店多语言清单）
- [x] `dist/chrome/adapters/`（ChromiumAdapter.js 等适配器）
- [x] `dist/chrome/core/`（urlParser、ruleMatcher、storage、historyCleaner、i18n、theme 等）
- [x] `dist/chrome/background/`（index.js、toolbarIndicator.js）
- [x] `dist/chrome/popup/`（popup.html, popup.css, popup.js）
- [x] `dist/chrome/options/`（options.html, options.css, options.js）

#### Firefox 产物 (`dist/firefox/`)
- [x] `dist/firefox/manifest.json`（语法有效，遵循 Gecko MV3 Background Script 架构，包含 `browser_specific_settings.gecko.id`）
- [x] 各功能模块与 UI 文件与 Chromium 端产物对齐，无 Gecko 禁用的非兼容 API。

---

## 3. 应用商店上架物料检查 (Store Publish Assets)

在提交至各大扩展商店（Chrome Web Store / Firefox AMO / Edge Add-ons）时，必须校验 `dist/Publish/` 目录：

### 3.1 12 种主流语言物料矩阵
确保 `dist/Publish/` 下全部 12 个语言目录完整：
- `简体中文`、`繁体中文`、`英语`、`法语`、`德语`、`日语`、`韩语`、`西班牙语`、`葡萄牙语`、`俄语`、`印尼语`、`阿拉伯语`
- 每个语言目录下必须包含：
  - `description.md`：应用商店详细描述（包含功能亮点、隐私安全承诺、使用指南）
  - `Overview.md`：应用商店一句话摘要 / 概览
  - `keywords.md`：商店搜索关键词与标签
  - 功能演示截图（`popup.png`、`options-stats.png`、`options-rules.png`、`options-history.png`、`options-settings.png`）

### 3.2 推广图像与声明文件
- [x] `dist/Publish/promo-1400x560.png`（大横幅推广背景图，尺寸严格为 1400×560）
- [x] `dist/Publish/promo-440x280.png`（小横幅推广卡片图，尺寸严格为 440×280）
- [x] `dist/Publish/Permission.md`（权限申请合理性声明，详细阐述 `history`、`alarms`、`storage`、`tabs` 等权限的必要性）
- [x] `dist/Publish/Introduction.md`（项目背景与产品介绍）

---

## 4. 商店提交 ZIP 包打包规范 (Store Packaging)

提交给应用商店的 ZIP 包必须遵循以下标准打包方式，严禁多包一层父级目录：

### 4.1 Chrome Web Store 提交包
- **打包源目录**：`dist/chrome/`
- **结构要求**：打开 ZIP 包的根目录必须直接看到 `manifest.json`，不得嵌套 `chrome/` 文件夹。
- **排除规则**：严禁包含 `.git*`、`.DS_Store`、`Thumbs.db`、临时测试或 Markdown 文件。

### 4.2 Firefox Add-ons (AMO) 提交包
- **打包源目录**：`dist/firefox/`
- **输出格式**：`package.js` 同时生成 `history-sentry-firefox-v<version>.zip` 与 `history-sentry-firefox-v<version>.xpi`（两者二进制内容完全一致，根目录均直接暴露 `manifest.json`）。
- **AMO 源码要求**：若 AMO 审核要求提供源码，需提供未压缩源代码并附带纯原生构建说明（仅需安装 Node.js 执行 `node build.js` 即可复现完全相同的构建产物）。

---

## 5. CHANGELOG 归档与版本交付规范 (Release SOP)

正式发版时，必须完成版本日志归档与 Git 提交闭环：

### 5.1 CHANGELOG.md 归档
1. 检查 [CHANGELOG.md](../../CHANGELOG.md) 顶部的 `## [Unreleased]` 区块；
2. 将待发布变动整理并归档为新版本段落：
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD

   ### Added
   - 新增功能项...

   ### Fixed
   - 修复问题项...

   ### Improved
   - 性能与体验优化项...
   ```
3. 在 `CHANGELOG.md` 顶部重新建立空的 `## [Unreleased]` 段落以供后续开发记录。

### 5.2 Git 提交与 Tag 打标
必须使用标准约定式提交（Conventional Commits），严禁提交未追踪的临时脏文件：
```bash
# 1. 查看暂存状态
git status

# 2. 提交版本变更
git add package.json manifest.chrome.json manifest.firefox.json CHANGELOG.md
git commit -m "chore(release): bump version to X.Y.Z"

# 3. 创建发布 Tag
git tag -a "vX.Y.Z" -m "Release vX.Y.Z"
```

