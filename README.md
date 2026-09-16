# @kingdom_soldier/repo-analyzer

[![npm version](https://img.shields.io/npm/v/@kingdom_soldier/repo-analyzer.svg)](https://www.npmjs.com/package/@kingdom_soldier/repo-analyzer)
[![npm downloads](https://img.shields.io/npm/dm/@kingdom_soldier/repo-analyzer.svg)](https://www.npmjs.com/package/@kingdom_soldier/repo-analyzer)
[![license](https://img.shields.io/npm/l/@kingdom_soldier/repo-analyzer.svg)](https://github.com/kingdomsoldier/repo-analyzer/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@kingdom_soldier/repo-analyzer.svg)](https://nodejs.org)
[![GitHub stars](https://img.shields.io/github/stars/kingdomsoldier/repo-analyzer.svg?style=social)](https://github.com/kingdomsoldier/repo-analyzer/stargazers)

Analiza un repositorio respetando `.gitignore` y exporta su estructura y
contenido como JSON. Ideal para dar contexto a una IA sobre un proyecto.

## Instalacion

```bash
npm install -g @kingdom_soldier/repo-analyzer
npx @kingdom_soldier/repo-analyzer
```

## Uso como CLI

Una vez instalado globalmente, el comando es `repo-analyzer`:

```bash
repo-analyzer
repo-analyzer ./mi-proyecto
repo-analyzer ./mi-proyecto -o ./estructura.json
repo-analyzer -i "*.md,*.test.js,dist/"
repo-analyzer -s 500
```

Con `npx` sin instalar:

```bash
npx @kingdom_soldier/repo-analyzer ./mi-proyecto
```

### Opciones

| Opcion | Descripcion |
| --- | --- |
| `-o, --output <file>` | Fichero JSON de salida |
| `-i, --ignore <lista>` | Patrones extra separados por coma |
| `-s, --max-size <kb>` | Tamano maximo por fichero (0 = sin limite) |
| `-q, --quiet` | No imprimir resumen |
| `-h, --help` | Ayuda |
| `-v, --version` | Version |

## Uso como libreria

```js
const { analyzeRepo } = require('@kingdom_soldier/repo-analyzer');

const result = await analyzeRepo({
  root: './mi-proyecto',
  output: './estructura.json',
  ignore: ['*.test.js'],
  maxSize: 500 * 1024,
});

console.log(result.fileCount);
console.log(result.structure);
console.log(result.content);
```

## Formato de salida

```json
{
  "structure": "mi-proyecto/\n|-- src/\n|   `-- index.js\n|-- public/\n|   `-- logo.png\n`-- package.json",
  "content": [
    { "path": "src/index.js", "content": "console.log('hola');\n" },
    { "path": "package.json", "content": "{ \"name\": \"mi-proyecto\" }\n" }
  ]
}
```

- **`structure`**: string con el arbol visual completo del proyecto,
  incluyendo imagenes y binarios (siempre que no esten en `.gitignore`).
- **`content`**: array de `{ path, content }` con el contenido de los
  ficheros de texto. Los binarios **no** aparecen aqui.
- Se respeta el `.gitignore` de la raiz.
- Se ignoran por defecto: `.git/`, `node_modules/`, `.DS_Store`, `Thumbs.db`.

## Licencia

MIT