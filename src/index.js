'use strict';

const fs = require('fs');
const path = require('path');
const { loadGitignore } = require('./gitignore');
const { isBinary } = require('./binary');

/**
 * Analiza un repositorio y devuelve un objeto con:
 *   - structure: string con el arbol visual del proyecto (incluye binarios)
 *   - content:   array de { path, content } con el contenido de los ficheros de texto
 *
 * @param {Object}  [options]
 * @param {string}  [options.root]           Ruta raiz. Por defecto: cwd.
 * @param {string}  [options.output]         Ruta del JSON de salida.
 *                                           Si se omite, se escribe en la raiz.
 * @param {string[]}[options.ignore]         Patrones extra a ignorar.
 * @param {number}  [options.maxSize]        Tamano maximo por fichero en bytes.
 *                                           0 = sin limite.
 *
 * @returns {Promise<{
 *   root: string,
 *   output: string,
 *   fileCount: number,
 *   structure: string,
 *   content: Array<{path: string, content: string}>,
 *   data: {structure: string, content: Array<{path: string, content: string}>},
 * }>}
 */
async function analyzeRepo(options = {}) {
  const root = path.resolve(options.root || process.cwd());
  const extraIgnore = options.ignore || [];
  const maxSize = options.maxSize || 0;

  if (!fs.existsSync(root)) {
    throw new Error(`La ruta no existe: ${root}`);
  }
  if (!fs.statSync(root).isDirectory()) {
    throw new Error(`La ruta no es un directorio: ${root}`);
  }

  const output = options.output
    ? path.resolve(options.output)
    : path.join(root, 'repo-structure.json');

  const ig = loadGitignore(root, extraIgnore);

  // El propio JSON de salida no debe incluirse si esta dentro de la raiz
  const outputRel = path.relative(root, output).split(path.sep).join('/');
  if (outputRel && !outputRel.startsWith('..')) {
    ig.add(outputRel);
  }

  const content = [];
  const treeLines = walk(root, '', {
    root,
    ig,
    content,
    maxSize,
  });

  const rootName = path.basename(root);
  const structure = `${rootName}/\n${treeLines.join('\n')}`;

  const data = { structure, content };

  try {
    fs.writeFileSync(output, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    throw new Error(`No se pudo escribir el JSON en ${output}: ${err.message}`);
  }

  return {
    root,
    output,
    fileCount: content.length,
    structure,
    content,
    data,
  };
}

/**
 * Recorre el directorio recursivamente.
 * @private
 */
function walk(dir, prefix, ctx) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  entries = entries
    .filter((e) => {
      if (e.isSymbolicLink()) return false; // evitar bucles
      const rel = path
        .relative(ctx.root, path.join(dir, e.name))
        .split(path.sep)
        .join('/');
      const checkPath = e.isDirectory() ? rel + '/' : rel;
      return !ctx.ig.ignores(checkPath);
    })
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const lines = [];

  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ctx.root, fullPath).split(path.sep).join('/');

    const connector = isLast ? '`-- ' : '|-- ';
    lines.push(prefix + connector + entry.name + (entry.isDirectory() ? '/' : ''));

    if (entry.isDirectory()) {
      const childPrefix = prefix + (isLast ? '    ' : '|   ');
      lines.push(...walk(fullPath, childPrefix, ctx));
    } else {
      // Solo metemos en `content` los ficheros de texto legibles.
      // Los binarios aparecen en `structure` pero NO en `content`.
      if (!isBinary(fullPath)) {
        pushFile(fullPath, relPath, ctx);
      }
    }
  });

  return lines;
}

/**
 * Lee un fichero de texto y lo anade a ctx.content.
 * @private
 */
function pushFile(fullPath, relPath, ctx) {
  let stat;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    ctx.content.push({ path: relPath, content: '[unreadable]' });
    return;
  }

  if (ctx.maxSize && stat.size > ctx.maxSize) {
    ctx.content.push({
      path: relPath,
      content: `[file omitted: exceeds max size (${stat.size} bytes)]`,
    });
    return;
  }

  try {
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    ctx.content.push({ path: relPath, content: fileContent });
  } catch (e) {
    ctx.content.push({
      path: relPath,
      content: `[Error leyendo fichero: ${e.message}]`,
    });
  }
}

module.exports = { analyzeRepo };