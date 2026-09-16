'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { analyzeRepo } = require('../src');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-analyzer-'));

  fs.mkdirSync(path.join(tmp, 'src'));
  fs.mkdirSync(path.join(tmp, 'public'));
  fs.writeFileSync(path.join(tmp, 'src', 'index.js'), 'console.log("hi");\n');
  fs.writeFileSync(path.join(tmp, '.gitignore'), 'ignored.txt\n');
  fs.writeFileSync(path.join(tmp, 'ignored.txt'), 'nope\n');
  fs.writeFileSync(path.join(tmp, 'README.md'), '# Test\n');
  fs.writeFileSync(
    path.join(tmp, 'public', 'logo.png'),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00])
  );

  const result = await analyzeRepo({
    root: tmp,
    output: path.join(tmp, 'out.json'),
    ignore: [],
  });

  assert.strictEqual(typeof result.data, 'object', 'data debe ser un objeto');
  assert.ok(!Array.isArray(result.data), 'data NO debe ser un array');
  assert.strictEqual(typeof result.data.structure, 'string', 'structure debe ser string');
  assert.ok(Array.isArray(result.data.content), 'content debe ser un array');

  assert.ok(result.data.structure.includes('public/'), 'structure incluye public/');
  assert.ok(result.data.structure.includes('logo.png'), 'structure incluye logo.png');
  assert.ok(result.data.structure.includes('src/'), 'structure incluye src/');

  const paths = result.data.content.map((f) => f.path).sort();
assert.deepStrictEqual(
  paths,
  ['.gitignore', 'README.md', 'src/index.js'],
  'content debe tener los ficheros de texto (incluido .gitignore)'
);

  assert.ok(!result.data.structure.includes('ignored.txt'));
  assert.ok(!paths.includes('ignored.txt'));

  assert.ok(fs.existsSync(path.join(tmp, 'out.json')), 'el JSON debe existir');

  const onDisk = JSON.parse(fs.readFileSync(path.join(tmp, 'out.json'), 'utf8'));
  assert.ok(typeof onDisk.structure === 'string');
  assert.ok(Array.isArray(onDisk.content));

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('[OK] Todos los tests pasan');
})().catch((err) => {
  console.error('[ERROR] Test fallido:', err);
  process.exit(1);
});