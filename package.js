/**
 * @file package.js
 * @description 纯原生 Node.js ZIP 打包脚本 (零外部依赖)
 * 将 dist/chrome 与 dist/firefox 产物打包为符合各大应用商店规范的 ZIP 归档包
 * 产物自动输出至 dist/releases/
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const RELEASES_DIR = path.join(DIST_DIR, 'releases');

// 忽略的文件列表与正则
const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini']);
const IGNORED_EXTS = new Set(['.tmp', '.bak']);

/**
 * 读取并校验版本号一致性
 * @returns {string} 统一版本号
 */
function validateVersionSync() {
  const pkgPath = path.join(ROOT_DIR, 'package.json');
  const chromePath = path.join(ROOT_DIR, 'manifest.chrome.json');
  const firefoxPath = path.join(ROOT_DIR, 'manifest.firefox.json');

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const chrome = JSON.parse(fs.readFileSync(chromePath, 'utf8'));
  const firefox = JSON.parse(fs.readFileSync(firefoxPath, 'utf8'));

  const pkgVer = pkg.version;
  const chromeVer = chrome.version;
  const firefoxVer = firefox.version;

  if (pkgVer !== chromeVer || pkgVer !== firefoxVer) {
    throw new Error(
      `[Version Mismatch Error] 版本号不一致，禁止打包发版:\n` +
      `  package.json:         ${pkgVer}\n` +
      `  manifest.chrome.json:  ${chromeVer}\n` +
      `  manifest.firefox.json: ${firefoxVer}\n` +
      `请先同步三处版本号后再执行打包。`
    );
  }

  return pkgVer;
}

/**
 * 递归收集目录下所有文件（相对路径使用正斜杠）
 * @param {string} dir
 * @param {string} baseRel
 * @returns {Array<{ full: string, rel: string }>}
 */
function collectFiles(dir, baseRel = '') {
  const result = [];
  if (!fs.existsSync(dir)) return result;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_FILES.has(entry.name)) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (IGNORED_EXTS.has(ext)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = baseRel ? `${baseRel}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      result.push(...collectFiles(fullPath, relPath));
    } else {
      result.push({ full: fullPath, rel: relPath.replace(/\\/g, '/') });
    }
  }
  return result;
}

/**
 * 纯原生生成符合标准 PKZIP 2.0 规范的 ZIP 归档包 (UTF-8 编码, Deflate 压缩)
 * @param {string} sourceDir 需要打包的源目录（例如 dist/chrome）
 * @param {string} outputZipPath 输出的目标 ZIP 文件路径
 * @returns {{ fileCount: number, originalBytes: number, zippedBytes: number }}
 */
function createZipArchive(sourceDir, outputZipPath) {
  const files = collectFiles(sourceDir);
  if (files.length === 0) {
    throw new Error(`源目录为空或不存在: ${sourceDir}`);
  }

  // 必须确保 manifest.json 位于根目录
  const hasManifest = files.some(f => f.rel === 'manifest.json');
  if (!hasManifest) {
    throw new Error(`打包源目录缺少根级 manifest.json: ${sourceDir}`);
  }

  const localHeadersAndData = [];
  const centralDirectoryHeaders = [];
  let currentOffset = 0;
  let totalOriginalBytes = 0;

  const now = new Date();
  const year = Math.max(1980, now.getFullYear());
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const file of files) {
    const rawData = fs.readFileSync(file.full);
    const uncompressedSize = rawData.length;
    totalOriginalBytes += uncompressedSize;

    const crc = zlib.crc32(rawData);
    // 使用最大压缩率
    const compressedData = zlib.deflateRawSync(rawData, { level: 9 });
    const compressedSize = compressedData.length;

    const filenameBuffer = Buffer.from(file.rel, 'utf8');

    // 1. Local File Header (30 字节 + 文件名 + 压缩数据)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);       // 签名
    localHeader.writeUInt16LE(20, 4);               // 提取所需版本 (2.0)
    localHeader.writeUInt16LE(0x0800, 6);           // 标志位：Bit 11 设置为 UTF-8 文件名
    localHeader.writeUInt16LE(8, 8);                // 压缩算法：8 (Deflate)
    localHeader.writeUInt16LE(dosTime, 10);         // 修改时间
    localHeader.writeUInt16LE(dosDate, 12);         // 修改日期
    localHeader.writeUInt32LE(crc, 14);             // CRC32
    localHeader.writeUInt32LE(compressedSize, 18);   // 压缩后大小
    localHeader.writeUInt32LE(uncompressedSize, 22); // 原始大小
    localHeader.writeUInt16LE(filenameBuffer.length, 26); // 文件名长度
    localHeader.writeUInt16LE(0, 28);               // 扩展字段长度

    const localChunk = Buffer.concat([localHeader, filenameBuffer, compressedData]);
    localHeadersAndData.push(localChunk);

    // 2. Central Directory Header (46 字节 + 文件名)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);     // 签名
    centralHeader.writeUInt16LE(20, 4);             // 制作版本
    centralHeader.writeUInt16LE(20, 6);             // 所需版本
    centralHeader.writeUInt16LE(0x0800, 8);         // UTF-8
    centralHeader.writeUInt16LE(8, 10);             // Deflate
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(filenameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);             // 扩展长度
    centralHeader.writeUInt16LE(0, 32);             // 注释长度
    centralHeader.writeUInt16LE(0, 34);             // 磁盘编号
    centralHeader.writeUInt16LE(0, 36);             // 内部文件属性
    centralHeader.writeUInt32LE(0, 38);             // 外部文件属性
    centralHeader.writeUInt32LE(currentOffset, 42); // 本地头相对偏移

    centralDirectoryHeaders.push(Buffer.concat([centralHeader, filenameBuffer]));
    currentOffset += localChunk.length;
  }

  const centralDirectoryBuffer = Buffer.concat(centralDirectoryHeaders);
  const centralDirectorySize = centralDirectoryBuffer.length;
  const centralDirectoryOffset = currentOffset;

  // 3. End of Central Directory Record (22 字节)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);                // 签名
  eocd.writeUInt16LE(0, 4);                         // 当前磁盘号
  eocd.writeUInt16LE(0, 6);                         // 目录开始磁盘号
  eocd.writeUInt16LE(files.length, 8);              // 本磁盘目录记录数
  eocd.writeUInt16LE(files.length, 10);             // 目录总记录数
  eocd.writeUInt32LE(centralDirectorySize, 12);     // 核心目录大小
  eocd.writeUInt32LE(centralDirectoryOffset, 16);   // 核心目录起始偏移
  eocd.writeUInt16LE(0, 20);                        // 注释长度

  const finalZipBuffer = Buffer.concat([
    ...localHeadersAndData,
    centralDirectoryBuffer,
    eocd
  ]);

  const outputDir = path.dirname(outputZipPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputZipPath, finalZipBuffer);

  return {
    fileCount: files.length,
    originalBytes: totalOriginalBytes,
    zippedBytes: finalZipBuffer.length
  };
}

/**
 * 主打包入口
 */
async function main() {
  console.log('====================================================');
  console.log('📦 History Guard Extension Store Packager (Zero-Dependency)');
  console.log('====================================================\n');

  // 1. 验证版本号一致性
  const version = validateVersionSync();
  console.log(`🔍 Verified consistent version: v${version}`);

  // 2. 始终基于最新源码执行构建，防止打包到过期的 dist 产物
  const chromeDist = path.join(DIST_DIR, 'chrome');
  const firefoxDist = path.join(DIST_DIR, 'firefox');
  console.log('🔨 Running build.js to ensure fresh artifacts...');
  const { execSync } = await import('child_process');
  execSync('node build.js', { stdio: 'inherit', cwd: ROOT_DIR });

  // 3. 准备输出目录 dist/releases/
  if (!fs.existsSync(RELEASES_DIR)) {
    fs.mkdirSync(RELEASES_DIR, { recursive: true });
  }

  const targets = [
    {
      platform: 'Chrome / Edge (Chromium ZIP)',
      srcDir: chromeDist,
      outputFile: path.join(RELEASES_DIR, `history-guard-chrome-v${version}.zip`),
      filename: `history-guard-chrome-v${version}.zip`
    },
    {
      platform: 'Firefox (Gecko ZIP & XPI)',
      srcDir: firefoxDist,
      outputFile: path.join(RELEASES_DIR, `history-guard-firefox-v${version}.zip`),
      filename: `history-guard-firefox-v${version}.zip`,
      mirrorXpiFile: path.join(RELEASES_DIR, `history-guard-firefox-v${version}.xpi`),
      mirrorXpiFilename: `history-guard-firefox-v${version}.xpi`
    }
  ];

  for (const target of targets) {
    console.log(`\n🗜️  Packaging ${target.platform}...`);
    const stats = createZipArchive(target.srcDir, target.outputFile);
    const savedPercent = ((1 - stats.zippedBytes / stats.originalBytes) * 100).toFixed(1);

    console.log(`   ✓ File:    dist/releases/${target.filename}`);
    if (target.mirrorXpiFile) {
      fs.copyFileSync(target.outputFile, target.mirrorXpiFile);
      console.log(`   ✓ File:    dist/releases/${target.mirrorXpiFilename}`);
    }
    console.log(`   ✓ Entries: ${stats.fileCount} files`);
    console.log(`   ✓ Size:    ${(stats.zippedBytes / 1024).toFixed(1)} KB (Raw: ${(stats.originalBytes / 1024).toFixed(1)} KB, -${savedPercent}%)`);
  }

  console.log('\n====================================================');
  console.log('🎉 Release packages (ZIP & XPI) created successfully!');
  console.log(`📂 Releases directory: dist/releases/`);
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('\n❌ Packaging failed:', err.message || err);
  process.exit(1);
});

