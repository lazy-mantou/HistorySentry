/**
 * @file i18n.test.js
 * @description 前端模板化国际化 (i18n) 核心驱动引擎单元测试用例
 * 包括 12 种主流语言字典键值对等性校验、动态参数插值、DOM 模板属性替换、RTL 适配与语言切换
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveLanguage,
  t,
  localizeCapsule,
  formatRelativeTime,
  formatBadgeCount,
  getCurrentLanguage,
  getConfiguredPreference,
  setLanguage,
  initI18n,
  applyI18nToDOM,
  SUPPORTED_LANGUAGES
} from '../src/core/i18n.js';
import zhCN from '../src/core/locales/zh-CN.js';
import zhTW from '../src/core/locales/zh-TW.js';
import en from '../src/core/locales/en.js';
import es from '../src/core/locales/es.js';
import ar from '../src/core/locales/ar.js';
import id from '../src/core/locales/id.js';
import pt from '../src/core/locales/pt.js';
import fr from '../src/core/locales/fr.js';
import ja from '../src/core/locales/ja.js';
import ru from '../src/core/locales/ru.js';
import de from '../src/core/locales/de.js';
import ko from '../src/core/locales/ko.js';

const ALL_LOCALES = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en': en,
  'es': es,
  'ar': ar,
  'id': id,
  'pt': pt,
  'fr': fr,
  'ja': ja,
  'ru': ru,
  'de': de,
  'ko': ko
};

/**
 * 递归收集对象的所有叶子节点键路径 (如 'popup.hideAndClean')
 */
function getAllLeafKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getAllLeafKeys(value, currentPath));
    } else {
      keys.push(currentPath);
    }
  }
  return keys;
}

describe('i18n - 全 12 种语言包完整性与对等性 (Locale Parity)', () => {
  const baseKeys = getAllLeafKeys(zhCN).sort();

  it('支持的 12 种语言常数定义应完整且符合规范', () => {
    assert.strictEqual(SUPPORTED_LANGUAGES.length, 12);
    Object.keys(ALL_LOCALES).forEach(lang => {
      assert.ok(SUPPORTED_LANGUAGES.includes(lang), `SUPPORTED_LANGUAGES 应包含 ${lang}`);
    });
  });

  for (const [lang, dict] of Object.entries(ALL_LOCALES)) {
    it(`[${lang}] 语言包的所有叶子键名数量应当与 zh-CN 基准 (${baseKeys.length}) 严格一致`, () => {
      const keys = getAllLeafKeys(dict).sort();
      assert.strictEqual(
        keys.length,
        baseKeys.length,
        `${lang} 语言包键总数 (${keys.length}) 与 zh-CN (${baseKeys.length}) 不一致`
      );
    });

    it(`[${lang}] 中的每一个翻译键必须完全存在且非空`, () => {
      const keys = getAllLeafKeys(dict);
      const missing = baseKeys.filter(k => !keys.includes(k));
      assert.deepStrictEqual(
        missing,
        [],
        `${lang} 语言包缺少以下翻译键: ${missing.join(', ')}`
      );
    });
  }
});

describe('i18n - resolveLanguage 语言解析算法', () => {
  afterEach(() => {
    delete globalThis.navigator;
    delete globalThis.chrome;
  });

  it('显式指定各支持的语言代码时应当直接返回', () => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      assert.strictEqual(resolveLanguage(lang), lang);
    });
    // ms 别名应归一化为 id
    assert.strictEqual(resolveLanguage('ms'), 'id');
  });

  it('当偏好设置为 auto 时，精确识别中文简体与繁体变体', () => {
    globalThis.navigator = { language: 'zh-CN' };
    assert.strictEqual(resolveLanguage('auto'), 'zh-CN');

    globalThis.navigator = { language: 'zh-SG' };
    assert.strictEqual(resolveLanguage('auto'), 'zh-CN');

    globalThis.navigator = { language: 'zh' };
    assert.strictEqual(resolveLanguage('auto'), 'zh-CN');

    globalThis.navigator = { language: 'zh-TW' };
    assert.strictEqual(resolveLanguage('auto'), 'zh-TW');

    globalThis.navigator = { language: 'zh-HK' };
    assert.strictEqual(resolveLanguage('auto'), 'zh-TW');

    globalThis.navigator = { language: 'zh-Hant' };
    assert.strictEqual(resolveLanguage('auto'), 'zh-TW');
  });

  it('当偏好设置为 auto 时，精准识别各主流语系', () => {
    globalThis.navigator = { language: 'ja-JP' };
    assert.strictEqual(resolveLanguage('auto'), 'ja');

    globalThis.navigator = { language: 'ko-KR' };
    assert.strictEqual(resolveLanguage('auto'), 'ko');

    globalThis.navigator = { language: 'es-ES' };
    assert.strictEqual(resolveLanguage('auto'), 'es');

    globalThis.navigator = { language: 'ar-SA' };
    assert.strictEqual(resolveLanguage('auto'), 'ar');

    globalThis.navigator = { language: 'id-ID' };
    assert.strictEqual(resolveLanguage('auto'), 'id');

    globalThis.navigator = { language: 'ms-MY' };
    assert.strictEqual(resolveLanguage('auto'), 'id');

    globalThis.navigator = { language: 'pt-BR' };
    assert.strictEqual(resolveLanguage('auto'), 'pt');

    globalThis.navigator = { language: 'fr-FR' };
    assert.strictEqual(resolveLanguage('auto'), 'fr');

    globalThis.navigator = { language: 'de-DE' };
    assert.strictEqual(resolveLanguage('auto'), 'de');

    globalThis.navigator = { language: 'ru-RU' };
    assert.strictEqual(resolveLanguage('auto'), 'ru');
  });

  it('当偏好设置为 auto 且浏览器为未覆盖的小众语言时，默认安全降级为 en', () => {
    globalThis.navigator = { language: 'en-US' };
    assert.strictEqual(resolveLanguage('auto'), 'en');

    globalThis.navigator = { language: 'fi' };
    assert.strictEqual(resolveLanguage('auto'), 'en');

    globalThis.navigator = { language: 'pl' };
    assert.strictEqual(resolveLanguage('auto'), 'en');
  });
});

describe('i18n - t() 文本翻译与动态参数插值', () => {
  beforeEach(() => {
    setLanguage('zh-CN');
  });

  it('能正确翻译一级与深层嵌套的字典键', () => {
    assert.strictEqual(t('app.name'), 'HistorySentry');
    assert.strictEqual(t('options.statActiveRules'), '启用规则');
  });

  it('支持模板参数动态插值 {paramName}', () => {
    const res = t('popup.matchesCount', { count: 18 });
    assert.strictEqual(res, '匹配到 18 条已有历史');

    const loaded = t('options.loadedSummary', { count: 1200 });
    assert.strictEqual(loaded, '已加载 1200 条历史记录');

    const silent = t('options.statSilentOn', { time: '25:00' });
    assert.strictEqual(silent, '开启中 (25:00)');
  });

  it('切换到各外语后应当返回对应的本地化翻译', () => {
    setLanguage('en');
    assert.strictEqual(t('options.statActiveRules'), 'Active Rules');
    assert.strictEqual(t('popup.matchesCount', { count: 5 }), 'Matches 5 existing records');

    setLanguage('ja');
    assert.strictEqual(t('options.statActiveRules'), '有効なルール');

    setLanguage('ko');
    assert.strictEqual(t('options.statActiveRules'), '활성 규칙');

    setLanguage('es');
    assert.strictEqual(t('options.statActiveRules'), 'Reglas activas');

    setLanguage('zh-TW');
    assert.strictEqual(t('options.statActiveRules'), '啟用規則');
  });

  it('支持显式指定 lang 参数，无需切换全局语言状态即可按指定语言输出', () => {
    // 全局当前语言为 zh-CN
    assert.strictEqual(t('toolbar.tooltipRecording', {}, 'en'), 'HistorySentry: Recording history (Click icon to protect)');
    assert.strictEqual(t('toolbar.tooltipRecording', {}, 'zh-CN'), 'HistorySentry: 正常记录历史 (点击图标可开启防护)');
    assert.strictEqual(t('toolbar.tooltipRecording', {}, 'ja'), 'HistorySentry: 履歴を記録中（アイコンをクリックして保護）');
    assert.strictEqual(t('toolbar.tooltipRecording', {}, 'ko'), 'HistorySentry: 방문 기록 저장 중 (아이콘을 클릭하여 보호)');
    
    // 测试带插值的规则提示
    const ruleLabelZh = t('toolbar.tooltipProtectedRuleLabel', { pattern: 'youtube.com' }, 'zh-CN');
    assert.strictEqual(t('toolbar.tooltipProtected', { ruleText: ruleLabelZh }, 'zh-CN'), 'HistorySentry: 当前页面处于防护中 (不记录历史 - 规则: youtube.com)');

    const ruleLabelEn = t('toolbar.tooltipProtectedRuleLabel', { pattern: 'youtube.com' }, 'en');
    assert.strictEqual(t('toolbar.tooltipProtected', { ruleText: ruleLabelEn }, 'en'), 'HistorySentry: Protected (History recording disabled - rule: youtube.com)');
  });

  it('不存在的键应当直接安全回退返回 key 本身', () => {
    assert.strictEqual(t('unknown.non_existent_key'), 'unknown.non_existent_key');
  });

  it('空入参应当返回空字符串', () => {
    assert.strictEqual(t(''), '');
    assert.strictEqual(t(null), '');
  });
});

describe('i18n - localizeCapsule 候选规则胶囊多语言映射', () => {
  it('在中文语言环境下保持中文标签和说明', () => {
    setLanguage('zh-CN');
    const candidate = {
      rule: 'google.com',
      label: '当前完整域名',
      description: '仅匹配该完整域名 (google.com)'
    };
    const localized = localizeCapsule(candidate);
    assert.strictEqual(localized.label, '当前完整域名');
    assert.strictEqual(localized.description, '仅匹配该完整域名 (google.com)');
  });

  it('在英文语言环境下自动转换为英文标签和说明', () => {
    setLanguage('en');
    const domainCandidate = {
      rule: 'google.com',
      label: '当前完整域名',
      description: '仅匹配该完整域名 (google.com)'
    };
    const locDomain = localizeCapsule(domainCandidate);
    assert.strictEqual(locDomain.label, 'Full Domain');
    assert.strictEqual(locDomain.description, 'Match exact domain (google.com)');

    const pathCandidate = {
      rule: 'example.com/docs/*',
      label: '当前目录通配',
      description: '匹配当前所在目录及下级所有页面'
    };
    const locPath = localizeCapsule(pathCandidate);
    assert.strictEqual(locPath.label, 'Directory Wildcard');
    assert.strictEqual(locPath.description, 'Match current directory and subpages');
  });

  it('在繁体中文语言环境下自动转换为繁体标签和说明', () => {
    setLanguage('zh-TW');
    const domainCandidate = {
      rule: 'google.com',
      label: '当前完整域名',
      description: '仅匹配该完整域名 (google.com)'
    };
    const locDomain = localizeCapsule(domainCandidate);
    assert.strictEqual(locDomain.label, '目前完整網域');
    assert.strictEqual(locDomain.description, '僅匹配該完整網域 (google.com)');
  });

  it('在日文语言环境下自动转换为日文标签和说明', () => {
    setLanguage('ja');
    const domainCandidate = {
      rule: 'google.com',
      label: '当前完整域名',
      description: '仅匹配该完整域名 (google.com)'
    };
    const locDomain = localizeCapsule(domainCandidate);
    assert.strictEqual(locDomain.label, '完全ドメイン');
    assert.strictEqual(locDomain.description, '完全なドメイン (google.com) のみに一致');
  });
});

describe('i18n - formatRelativeTime 相对时间格式化', () => {
  it('不足 60 秒应当显示刚刚', () => {
    setLanguage('zh-CN');
    assert.strictEqual(formatRelativeTime(Date.now() - 10000), '刚刚');

    setLanguage('en');
    assert.strictEqual(formatRelativeTime(Date.now() - 10000), 'Just now');

    setLanguage('ja');
    assert.strictEqual(formatRelativeTime(Date.now() - 10000), 'たった今');
  });

  it('1 小时内应当显示 X 分钟前', () => {
    setLanguage('zh-CN');
    assert.strictEqual(formatRelativeTime(Date.now() - 15 * 60 * 1000), '15 分钟前');

    setLanguage('en');
    assert.strictEqual(formatRelativeTime(Date.now() - 15 * 60 * 1000), '15m ago');

    setLanguage('ko');
    assert.strictEqual(formatRelativeTime(Date.now() - 15 * 60 * 1000), '15분 전');
  });

  it('24 小时内应当显示 X 小时前', () => {
    setLanguage('zh-CN');
    assert.strictEqual(formatRelativeTime(Date.now() - 3 * 3600 * 1000), '3 小时前');

    setLanguage('en');
    assert.strictEqual(formatRelativeTime(Date.now() - 3 * 3600 * 1000), '3h ago');
  });

  it('超过 1 天应当格式化为 YYYY-MM-DD HH:mm', () => {
    const fixedTime = new Date('2026-05-01T14:30:00').getTime();
    const formatted = formatRelativeTime(fixedTime);
    assert.strictEqual(formatted, '2026-05-01 14:30');
  });
});

describe('i18n - formatBadgeCount 徽标气泡数字格式化', () => {
  it('小于等于 999 的正常数值应当显示原始数值字符串', () => {
    assert.strictEqual(formatBadgeCount(0), '0');
    assert.strictEqual(formatBadgeCount(1), '1');
    assert.strictEqual(formatBadgeCount(42), '42');
    assert.strictEqual(formatBadgeCount(999), '999');
  });

  it('大于 999 的数值应当显示为 999+', () => {
    assert.strictEqual(formatBadgeCount(1000), '999+');
    assert.strictEqual(formatBadgeCount(1001), '999+');
    assert.strictEqual(formatBadgeCount(50000), '999+');
    assert.strictEqual(formatBadgeCount(999999), '999+');
  });

  it('支持字符串数字入参并正确判断边界', () => {
    assert.strictEqual(formatBadgeCount('999'), '999');
    assert.strictEqual(formatBadgeCount('1000'), '999+');
    assert.strictEqual(formatBadgeCount('12345'), '999+');
  });

  it('非正常或负数等非法入参应当安全兜底为 0', () => {
    assert.strictEqual(formatBadgeCount(-1), '0');
    assert.strictEqual(formatBadgeCount(-999), '0');
    assert.strictEqual(formatBadgeCount(NaN), '0');
    assert.strictEqual(formatBadgeCount(null), '0');
    assert.strictEqual(formatBadgeCount(undefined), '0');
    assert.strictEqual(formatBadgeCount('invalid'), '0');
  });
});

describe('i18n - applyI18nToDOM (DOM 模板属性绑定与 RTL 适配)', () => {
  class MockElement {
    constructor(attrs = {}) {
      this.attributes = { ...attrs };
      this.textContent = '';
    }
    getAttribute(name) {
      return this.attributes[name] || null;
    }
    setAttribute(name, val) {
      this.attributes[name] = String(val);
    }
  }

  it('应当能正确解析 data-i18n* 系列属性并更新元素内容', () => {
    setLanguage('zh-CN');

    const textEl = new MockElement({ 'data-i18n': 'popup.hideAndClean' });
    const paramEl = new MockElement({
      'data-i18n': 'popup.pauseDurationItem',
      'data-i18n-params': JSON.stringify({ duration: '15m' })
    });
    const inputEl = new MockElement({ 'data-i18n-placeholder': 'options.searchPlaceholder' });
    const btnEl = new MockElement({
      'data-i18n-title': 'popup.optionsTooltip',
      'data-i18n-aria-label': 'options.navRulesTitle'
    });

    const mockRoot = {
      querySelectorAll: (selector) => {
        if (selector === '[data-i18n]') return [textEl, paramEl];
        if (selector === '[data-i18n-placeholder]') return [inputEl];
        if (selector === '[data-i18n-title]') return [btnEl];
        if (selector === '[data-i18n-aria-label]') return [btnEl];
        return [];
      }
    };

    // 应用中文
    applyI18nToDOM(mockRoot);
    assert.strictEqual(textEl.textContent, '防护并清理');
    assert.strictEqual(paramEl.textContent, '临时关闭 15m');
    assert.strictEqual(inputEl.getAttribute('placeholder'), '搜索域名、URL 路径片段或页面标题...');
    assert.strictEqual(btnEl.getAttribute('title'), '打开管理控制台');
    assert.strictEqual(btnEl.getAttribute('aria-label'), '防护规则管理');

    // 切换为英文并更新
    setLanguage('en');
    applyI18nToDOM(mockRoot);
    assert.strictEqual(textEl.textContent, 'Protect & Clean');
    assert.strictEqual(paramEl.textContent, 'Pause for 15m');
    assert.strictEqual(inputEl.getAttribute('placeholder'), 'Search domain, URL path, or page title...');
    assert.strictEqual(btnEl.getAttribute('title'), 'Open Dashboard');
    assert.strictEqual(btnEl.getAttribute('aria-label'), 'Protection Rules');
  });

  it('阿拉伯语应当正确设置 RTL 页面方向属性', () => {
    const mockDoc = {
      documentElement: { lang: 'en', dir: 'ltr' },
      querySelectorAll: () => []
    };
    globalThis.document = mockDoc;

    setLanguage('ar', mockDoc);
    assert.strictEqual(mockDoc.documentElement.dir, 'rtl');
    assert.strictEqual(mockDoc.documentElement.lang, 'ar');

    setLanguage('zh-CN', mockDoc);
    assert.strictEqual(mockDoc.documentElement.dir, 'ltr');
    assert.strictEqual(mockDoc.documentElement.lang, 'zh-CN');

    delete globalThis.document;
  });
});

describe('manifest.json 国际化规范与资源完整性校验', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const rootDir = path.resolve(__dirname, '..');
  const localesDir = path.join(rootDir, '_locales');

  it('manifest.chrome.json 与 manifest.firefox.json 必须合法且配置 default_locale 与 __MSG_ 占位符', () => {
    const chromeManifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.chrome.json'), 'utf8'));
    const firefoxManifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.firefox.json'), 'utf8'));

    for (const manifest of [chromeManifest, firefoxManifest]) {
      assert.strictEqual(manifest.default_locale, 'zh_CN');
      assert.strictEqual(manifest.name, '__MSG_appName__');
      assert.strictEqual(manifest.short_name, '__MSG_appShortName__');
      assert.strictEqual(manifest.description, '__MSG_appDesc__');
      assert.strictEqual(manifest.action.default_title, '__MSG_actionTitle__');
    }
  });

  it('_locales 必须包含完整的多语言 messages.json 且各字典键结构对齐', () => {
    const expectedLocales = ['zh_CN', 'zh_TW', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt_BR', 'pt_PT', 'id', 'ar'];
    const requiredKeys = ['appName', 'appShortName', 'appDesc', 'actionTitle'];

    for (const locale of expectedLocales) {
      const filePath = path.join(localesDir, locale, 'messages.json');
      assert.ok(fs.existsSync(filePath), `_locales/${locale}/messages.json 应存在`);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      for (const key of requiredKeys) {
        assert.ok(content[key], `${locale} 中必须存在 ${key} 键`);
        assert.ok(typeof content[key].message === 'string' && content[key].message.length > 0, `${locale}.${key}.message 必须为非空字符串`);
        assert.ok(typeof content[key].description === 'string' && content[key].description.length > 0, `${locale}.${key}.description 必须为非空字符串`);
      }
    }
  });
});

