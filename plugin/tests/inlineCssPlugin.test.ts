import { describe, test, expect, vi } from 'vitest';
import { inlineCssPlugin } from '../src/index.ts';

describe('inlineCssPlugin', () => {
  test('should correctly filter files with the ?inline suffix', () => {
    const plugin = inlineCssPlugin() as any;

    expect(plugin.load.filter.id.test('style.css?inline')).toBe(true);
    expect(plugin.load.filter.id.test('style.css')).toBe(false);
    expect(plugin.load.filter.id.test('main.js')).toBe(false);
  });

  test('should load CSS file and format its content into a single-line ESM module', async () => {
    const plugin = inlineCssPlugin() as any;
    const mockContext = {
      fs: {
        readFile: vi.fn().mockResolvedValue(Buffer.from('body {\n  color: red;\n  margin: 0;\n}')),
      },
    };

    const result = await plugin.load.handler.call(mockContext, '/src/assets/style.css?inline');
    expect(mockContext.fs.readFile).toHaveBeenCalledWith('/src/assets/style.css');

    expect(result).toBe('export default "body { color: red; margin: 0; }";');
  });
});
