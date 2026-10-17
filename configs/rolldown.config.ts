import { defineConfig, type RolldownOptions, type OutputOptions } from 'rolldown';
import { staticsDetector, inlineCssPlugin } from 'statics-detector-rolldown-plugin';

export default defineConfig((_): RolldownOptions[] => {
  const isWatch = process.argv.includes('--watch');
  const outputOptions = {
    sourcemap: isWatch ? 'inline' : false,
    minify: isWatch ? 'dce-only' : true,
  };

  return [
    {
      plugins: [
        staticsDetector({
          outDir: 'dist',
          sources: ['public', 'src'],
          excludes: ['*.ts', '*.js', '*.swp'],
          isWatch,
        }),
      ],
      input: 'src/background/background.ts',
      output: {
        file: 'dist/background.js',
        format: 'iife',
        ...outputOptions,
      } as OutputOptions,
    },
    {
      plugins: [inlineCssPlugin()],
      input: 'src/script/injection-script.ts',
      output: {
        file: 'dist/injection-script.js',
        format: 'iife',
        ...outputOptions,
      } as OutputOptions,
    },
    {
      input: 'src/menu/menu.ts',
      output: {
        file: 'dist/menu/menu.js',
        format: 'esm',
        ...outputOptions,
      } as OutputOptions,
    },
  ];
});
