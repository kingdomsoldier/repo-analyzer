#!/usr/bin/env node
'use strict';

const { analyzeRepo } = require('../src');
const pkg = require('../package.json');

function printHelp() {
  console.log(`
repo-analyzer v${pkg.version}

Analiza un repositorio (respetando .gitignore) y exporta su estructura
y contenido como JSON, ideal para dar contexto a una IA.

Uso:
  repo-analyzer [opciones] [ruta-repo]

Argumentos:
  ruta-repo             Ruta raiz a analizar (por defecto: directorio actual)

Opciones:
  -o, --output <file>   Fichero JSON de salida
                        (por defecto: <raiz>/repo-structure.json)
  -i, --ignore <lista>  Patrones extra a ignorar, separados por coma
                        Ej: -i "*.md,*.test.js,dist/"
  -s, --max-size <kb>   Tamano maximo por fichero en KB (0 = sin limite)
  -q, --quiet           No imprimir el resumen final
  -h, --help            Mostrar esta ayuda
  -v, --version         Mostrar la version

Ejemplos:
  repo-analyzer
  repo-analyzer ./mi-proyecto
  repo-analyzer ./mi-proyecto -o ./estructura.json
  repo-analyzer -i "*.md,*.test.js" -s 500
  npx @kingdom_soldier/repo-analyzer ./mi-repo
`);
}

function parseArgs(argv) {
  const args = {
    root: null,
    output: null,
    ignore: [],
    maxSize: 0,
    quiet: false,
    help: false,
    version: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-h':
      case '--help':
        args.help = true;
        break;
      case '-v':
      case '--version':
        args.version = true;
        break;
      case '-o':
      case '--output':
        args.output = argv[++i];
        break;
      case '-i':
      case '--ignore': {
        const val = argv[++i];
        if (!val) {
          console.error('[ERROR] Falta el valor para --ignore');
          process.exit(1);
        }
        args.ignore.push(
          ...String(val)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        );
        break;
      }
      case '-s':
      case '--max-size': {
        const val = parseInt(argv[++i], 10);
        if (Number.isNaN(val)) {
          console.error('[ERROR] --max-size requiere un numero');
          process.exit(1);
        }
        args.maxSize = val * 1024;
        break;
      }
      case '-q':
      case '--quiet':
        args.quiet = true;
        break;
      default:
        if (a.startsWith('-')) {
          console.error(`[ERROR] Opcion desconocida: ${a}`);
          console.error('   Usa --help para ver las opciones disponibles.');
          process.exit(1);
        }
        positional.push(a);
    }
  }

  if (positional[0]) args.root = positional[0];
  if (positional[1] && !args.output) args.output = positional[1];

  return args;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }
  if (args.version) {
    console.log(pkg.version);
    return;
  }

  try {
    const result = await analyzeRepo({
      root: args.root,
      output: args.output,
      ignore: args.ignore,
      maxSize: args.maxSize,
    });

    if (!args.quiet) {
      console.log('[OK] Analisis completado');
      console.log(`   Raiz analizada : ${result.root}`);
      console.log(`   Ficheros       : ${result.fileCount}`);
      console.log(`   Salida         : ${result.output}`);
    }
  } catch (err) {
    console.error(`[ERROR] ${err.message}`);
    process.exit(1);
  }
})();