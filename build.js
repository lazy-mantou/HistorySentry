/**
 * @file build.js
 * @description 纯原生 Node.js 构建脚本 (零外部依赖)
 * 自动化打包分发 Chrome (MV3) 与 Firefox (MV3) 双内核产物至 dist/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const SRC_DIR = path.join(ROOT_DIR, 'src');
const ICONS_DIR = path.join(ROOT_DIR, 'icons');
const LOCALES_DIR = path.join(ROOT_DIR, '_locales');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const TARGETS = [
  {
    name: 'chrome',
    label: 'Chromium (Chrome / Edge / Brave)',
    manifestSrc: path.join(ROOT_DIR, 'manifest.chrome.json'),
    outputDir: path.join(DIST_DIR, 'chrome')
  },
  {
    name: 'firefox',
    label: 'Gecko (Mozilla Firefox)',
    manifestSrc: path.join(ROOT_DIR, 'manifest.firefox.json'),
    outputDir: path.join(DIST_DIR, 'firefox')
  }
];

/**
 * 递归复制目录
 * @param {string} src
 * @param {string} dest
 */
function copyDirRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 清空并创建输出目录
 * @param {string} dir
 */
function cleanAndEnsureDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * 计算目录下的文件总数与总大小
 * @param {string} dir
 * @returns {{ count: number, sizeBytes: number }}
 */
function getDirStats(dir) {
  let count = 0;
  let sizeBytes = 0;

  function traverse(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else {
        count++;
        sizeBytes += fs.statSync(fullPath).size;
      }
    }
  }

  traverse(dir);
  return { count, sizeBytes };
}

/**
 * 执行构建主流程
 */
function build() {
  console.log('====================================================');
  console.log('🛡️  HistorySentry Cross-Browser Extension Build Tool (Zero-Dependency)');
  console.log('====================================================\n');

  const startTime = Date.now();

  // 1. Ensure dist root exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // 2. Iterate over build targets
  for (const target of TARGETS) {
    console.log(`📦 Building ${target.label} artifacts...`);
    cleanAndEnsureDir(target.outputDir);

    // A. Validate and copy manifest
    if (!fs.existsSync(target.manifestSrc)) {
      throw new Error(`Manifest file not found: ${target.manifestSrc}`);
    }
    const manifestContent = fs.readFileSync(target.manifestSrc, 'utf-8');
    JSON.parse(manifestContent);
    fs.writeFileSync(path.join(target.outputDir, 'manifest.json'), manifestContent, 'utf-8');

    // B. Copy icons
    if (fs.existsSync(ICONS_DIR)) {
      copyDirRecursiveSync(ICONS_DIR, path.join(target.outputDir, 'icons'));
    }

    // C. Copy core modules (adapters, core, background, popup, options)
    const modulesToCopy = ['adapters', 'core', 'background', 'popup', 'options'];
    for (const mod of modulesToCopy) {
      const srcModDir = path.join(SRC_DIR, mod);
      const destModDir = path.join(target.outputDir, mod);
      if (fs.existsSync(srcModDir)) {
        copyDirRecursiveSync(srcModDir, destModDir);
      } else {
        console.warn(`[WARN] Module directory not found: ${srcModDir}`);
      }
    }

    // D. Copy _locales (manifest i18n dictionaries)
    if (fs.existsSync(LOCALES_DIR)) {
      copyDirRecursiveSync(LOCALES_DIR, path.join(target.outputDir, '_locales'));
    }

    const stats = getDirStats(target.outputDir);
    console.log(`   ✓ Successfully output to: dist/${target.name} (${stats.count} files, ${(stats.sizeBytes / 1024).toFixed(1)} KB)`);
  }

  const duration = Date.now() - startTime;
  console.log('\n====================================================');
  console.log(`🎉 Build completed successfully in ${duration}ms!`);
  console.log('📂 Artifacts ready:');
  console.log('   - Chrome:  dist/chrome/  (Load unpacked in chrome://extensions)');
  console.log('   - Firefox: dist/firefox/ (Load temporary add-on in about:debugging)');
  console.log('====================================================');
}

try {
  build();
} catch (err) {
  console.error('\n❌ Build failed:', err);
  process.exit(1);
}
