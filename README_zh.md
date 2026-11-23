# 🛡️ HistorySentry — 自动历史清理与无痕规则

<p align="center">
  <a href="README.md">English</a> •
  <b>简体中文</b> •
  <a href="https://github.com/lazy-mantou/HistorySentry">GitHub</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/manifest-MV3-brightgreen.svg?style=flat-square" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/browsers-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Brave-orange.svg?style=flat-square" alt="Cross-Browser" />
  <img src="https://img.shields.io/badge/dependencies-zero-purple.svg?style=flat-square" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/telemetry-100%25%20offline-success.svg?style=flat-square" alt="100% Offline" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License MIT" />
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/khhoebefmcagfhninjncpjaljdanllki">
    <img src="https://img.shields.io/badge/Chrome%20%E5%BA%94%E7%94%A8%E5%95%86%E5%BA%97-%E7%AB%8B%E5%8D%B3%E5%AE%89%E8%A3%85-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome 应用商店" />
  </a>
  <a href="https://microsoftedge.microsoft.com/addons/detail/mdanoeohlnfmbaonjhjkhfbidkfhebel">
    <img src="https://img.shields.io/badge/Edge%20%E5%A4%96%E6%8E%9B%E7%A8%8B%E5%BA%8F-%E7%AB%8B%E5%8D%B3%E5%AE%89%E8%A3%85-0078D7?style=flat-square&logo=microsoftedge&logoColor=white" alt="Edge 外接程序" />
  </a>
  <a href="https://addons.mozilla.org/zh-CN/firefox/addon/historyguard/">
    <img src="https://img.shields.io/badge/Firefox%20%E9%99%84%E5%8A%A0%E7%BB%84%E4%BB%B6-%E7%AB%8B%E5%8D%B3%E5%AE%89%E8%A3%85-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white" alt="Firefox 附加组件" />
  </a>
</p>

> **HistorySentry** 是一款专为重视隐私安全与浏览效率的用户打造的纯原生、跨浏览器（Chrome / Edge / Brave / Firefox）历史记录即时防护扩展。采用**统一抽象适配器层（Adapter Pattern）**实现双内核 API 无缝解耦，支持基于 URL 智能逐级拆解的零输入快速加规、毫秒级实时隐私抹除与 30 分钟临时无痕模式。

---

## ✨ 核心特性

- **双内核等价体验 (Chrome & Firefox Parity)**：
  - **Chromium**：Chrome / Edge / Brave（Manifest V3，基于 `background.service_worker` 与 `chrome.*` API）。
  - **Firefox**：Gecko 内核（Manifest V3，基于 `background.scripts` 与原生 `browser.*` Promise API）。
  - 核心业务与 UI 层绝不直接耦合浏览器全局对象，通过 `IBrowserAdapter` 统一调度抹平底层差异。
- **URL 智能层级拆解算法 (`urlParser.js`)**：
  - **域名维度**：自动拆解当前完整域名、二级子域通配（`*.sub.domain.com`）与根域名通配（`*.domain.com`），内置数十种常见多级公用后缀（如 `.com.cn`, `.co.uk`, `.edu.cn`）智能识别。
  - **路径维度**：自动拆解精确页面 URL、当前目录通配（`domain.com/a/b/*`）、逐级上级目录通配（`domain.com/a/*`）及全站路径通配（`domain.com/*`）。
- **高精度规则匹配引擎 (`ruleMatcher.js`)**：
  - 严格匹配域名及其合法子域，严防 `mygoogle.com` 等前缀子串误杀。
  - 支持通配符路径正则编译、全局关键词跨域拦截与实时历史库匹配反查。
- **毫秒级后台自动防护与临时无痕模式 (`background/index.js`)**：
  - 监听 `onVisited`、`webNavigation` 与 SPA 路由多通道事件，页面访问瞬间物理抹除命中规则的历史记录。
  - **30 分钟临时无痕模式**：一键开启，在此期间一切新浏览均物理不留痕，结合 `alarms` 定时器到期自动恢复。
  - **Places 锁与并发流控**：针对 Firefox Places SQLite 单写锁与 Chromium 并发差异，提供自适应异步分片批量清理与微让步流控，避免浏览器卡顿。
  - **工具栏动态状态指示器**：根据当前网页防护命中状态与临时无痕模式，实时变色切换工具栏图标（翡翠绿保护 / 科技蓝常规）与 Tooltip。
- **12 种主流语言多语言矩阵 (`i18n.js`)**：
  - 完整支持英语、简体中文、繁体中文、西班牙语、阿拉伯语 (RTL)、葡萄牙语、印尼语、法语、俄语、德语、日语、韩语。
- **自适应深浅主题 (`theme.js`)**：
  - 支持跟随系统、永久暗色与永久浅色模式，响应式无缝切换。
- **现代极简响应式 UI 设计**：
  - **Popup 弹窗**：紧凑自适应排版（356px 宽度），支持实时历史匹配条数计算与“防护并清理”/“仅删历史”双操作。
  - **Options 控制台**：左侧 Tab 垂直导航，涵盖多维历史检索与深度清理、规则完整增删改查、90天 SVG 拦截趋势图表、JSON 备份导入导出与高级偏好设置。

---

## 🏗️ 目录结构与架构设计

```text
HistGuard/
├── manifest.chrome.json       # Chromium MV3 扩展清单 (Service Worker 架构)
├── manifest.firefox.json      # Firefox MV3 扩展清单 (Background Script 架构)
├── package.json               # 项目元数据与原生 scripts 脚本
├── build.js                   # 纯原生 Node.js 双端构建脚本
├── CHANGELOG.md               # 严谨详尽的版本更新日志
├── icons/                     # 16/32/48/128/512 全规格科技蓝/翡翠绿状态图标
├── src/
│   ├── adapters/              # 【适配器层】统一抹平 chrome.* 与 browser.* 差异
│   │   ├── IBrowserAdapter.js # 抽象接口基类规范
│   │   ├── ChromiumAdapter.js # Chromium 专用实现 (Promise 化封装)
│   │   ├── FirefoxAdapter.js  # Firefox 专用实现
│   │   └── index.js           # 运行环境自动嗅探与单例导出
│   ├── core/                  # 【核心业务层】纯逻辑与算法 (与 DOM/浏览器解耦)
│   │   ├── urlParser.js       # URL 域名逐级解析、TLD 公用后缀识别
│   │   ├── ruleMatcher.js     # 正则编译、边界防误杀、通配符与关键词计算
│   │   ├── storage.js         # 规则增删改查、原子合并落盘、90天滚动裁剪
│   │   ├── historyCleaner.js  # 异步流控分片批量清理、并发节流
│   │   ├── i18n.js            # 国际化引擎与动态切换
│   │   ├── theme.js           # 主题解析引擎 (Auto/Dark/Light)
│   │   └── locales/           # 12 种主流语言多语言字典矩阵
│   ├── background/            # 【后台守护进程】
│   │   ├── index.js           # onVisited/onUpdated 多通道实时拦截与 Alarms 唤醒
│   │   └── toolbarIndicator.js# 科技蓝/翡翠绿工具栏图标与状态指示渲染
│   ├── popup/                 # 【Popup 极简弹窗】(356px 宽度，一键静默/快捷加规)
│   └── options/               # 【Options 控制台】(Tab 导航/历史检索/SVG 趋势图/设置)
├── tests/                     # 【原生单元测试套件】(基于 node:test + node:assert/strict)
└── dist/                      # 【构建产物】
    ├── chrome/                # Chromium 已解压扩展分发目录
    └── firefox/               # Firefox 临时附加组件分发目录
```

---

## 🚀 构建与安装使用

### 🛒 从浏览器插件市场安装
- [![Chrome 应用商店](https://img.shields.io/badge/Chrome%20%E5%BA%94%E7%94%A8%E5%95%86%E5%BA%97-%E7%AB%8B%E5%8D%B3%E5%AE%89%E8%A3%85-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/khhoebefmcagfhninjncpjaljdanllki) — [Chrome 应用商店](https://chromewebstore.google.com/detail/khhoebefmcagfhninjncpjaljdanllki)
- [![Edge 外接程序](https://img.shields.io/badge/Edge%20%E5%A4%96%E6%8E%9B%E7%A8%8B%E5%BA%8F-%E7%AB%8B%E5%8D%B3%E5%AE%89%E8%A3%85-0078D7?style=flat-square&logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/mdanoeohlnfmbaonjhjkhfbidkfhebel) — [Microsoft Edge 外接程序](https://microsoftedge.microsoft.com/addons/detail/mdanoeohlnfmbaonjhjkhfbidkfhebel)
- [![Firefox 附加组件](https://img.shields.io/badge/Firefox%20%E9%99%84%E5%8A%A0%E7%BB%84%E4%BB%B6-%E7%AB%8B%E5%8D%B3%E5%AE%89%E8%A3%85-FF7139?style=flat-square&logo=firefoxbrowser&logoColor=white)](https://addons.mozilla.org/zh-CN/firefox/addon/historyguard/) — [Firefox 附加组件 (AMO)](https://addons.mozilla.org/zh-CN/firefox/addon/historyguard/)

### 1. 运行构建
本项目坚持**零第三方外部依赖**，使用纯原生 Node.js 构建，**无需** `npm install` 任何库：
```bash
node build.js
# 或使用 npm
npm run build
```
构建产物将分别生成至 `dist/chrome` 和 `dist/firefox`。

### 2. 在 Chromium 浏览器中安装 (Chrome / Edge / Brave)
1. 打开浏览器并访问 `chrome://extensions/`（Edge 为 `edge://extensions/`）；
2. 开启右上角的 **“开发者模式” (Developer mode)**；
3. 点击 **“加载已解压的扩展程序” (Load unpacked)**；
4. 选择本项目根目录下的 `dist/chrome` 文件夹即可。

### 3. 在 Firefox 中安装
1. 打开 Firefox 浏览器，访问 `about:debugging#/runtime/this-firefox`；
2. 点击 **“临时载入附加组件...” (Load Temporary Add-on...)**；
3. 浏览并选中 `dist/firefox/manifest.json` 文件即可。

### 4. 运行原生单元测试
```bash
npm test
# 或直接通过 node
node --test tests/*.test.js
```

---

## 🔒 隐私与安全性保障 (Privacy Guarantee)

1. **100% 本地离线运行**：零遥测、零数据上报。所有规则计算、历史清除与指标统计严格运行在用户本地浏览器沙箱内，绝不向任何外部服务器发送网络请求。
2. **纯原生代码 (Zero-Dependency)**：零引入 Webpack/Vite、Tailwind、Lodash、Axios 等第三方混淆库或外部 CDN，代码透明可审计。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
