import { build } from 'esbuild';
import { chmod } from 'node:fs/promises';

await build({
  entryPoints: ['src/cli/main.ts'],
  outfile: 'dist/money-manager.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  banner: {
    js:
      '#!/usr/bin/env node\n' +
      "import { createRequire } from 'node:module';\n" +
      'const require = createRequire(import.meta.url);',
  },
  sourcemap: false,
  minify: true,
});
await chmod('dist/money-manager.mjs', 0o755);
