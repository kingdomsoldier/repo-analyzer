'use strict';

const fs = require('fs');
const path = require('path');

const BINARY_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.gz', '.tar', '.rar', '.7z', '.bz2', '.xz',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.a',
  '.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.flac', '.ogg', '.webm',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.class', '.jar', '.pyc', '.pyo', '.wasm',
  '.lock',
]);

function isBinary(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXT.has(ext)) return true;

  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(1024);
    const n = fs.readSync(fd, buf, 0, 1024, 0);
    fs.closeSync(fd);
    for (let i = 0; i < n; i++) {
      if (buf[i] === 0) return true;
    }
  } catch {
    return true;
  }
  return false;
}

module.exports = { isBinary, BINARY_EXT };