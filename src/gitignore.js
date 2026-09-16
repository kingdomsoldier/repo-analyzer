'use strict';

const fs = require('fs');
const path = require('path');
const ignore = require('ignore');

const DEFAULT_IGNORES = ['.git/', 'node_modules/', '.DS_Store', 'Thumbs.db'];

/**
 * Crea una instancia de `ignore` cargando el .gitignore de la raiz
 * mas los patrones por defecto y los extra indicados por el usuario.
 *
 * @param {string} root
 * @param {string[]} extra
 * @returns {import('ignore').Ignore}
 */
function loadGitignore(root, extra = []) {
  const ig = ignore();
  ig.add(DEFAULT_IGNORES);

  const gi = path.join(root, '.gitignore');
  if (fs.existsSync(gi)) {
    ig.add(fs.readFileSync(gi, 'utf8'));
  }

  if (extra.length) {
    ig.add(extra);
  }

  return ig;
}

module.exports = { loadGitignore, DEFAULT_IGNORES };