import esbuild from 'esbuild';
import { builtinModules } from 'node:module';
const production = process.argv.includes('production');
const context = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'cjs',
  target: 'es2021',
  external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*', ...builtinModules],
  outfile: 'main.js',
  minify: production,
  sourcemap: production ? false : 'inline',
  treeShaking: true,
});
if (production) {
  await context.rebuild();
  await context.dispose();
} else await context.watch();
