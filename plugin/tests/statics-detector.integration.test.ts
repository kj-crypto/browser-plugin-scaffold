import {
  describe,
  test as baseTest,
  expect,
  vi,
  beforeAll,
  afterAll,
  onTestFinished,
} from 'vitest';
import { staticsDetector } from '../src/index.ts';
import fs from 'fs';
import path from 'path';
import os from 'os';

const mockInfo = vi.fn();
const mockError = vi.fn();
const bashScriptName = 'copy-statics';

vi.mock('../src/logger.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/logger.ts')>();
  return {
    ...actual,
    Logger: class extends actual.Logger {
      info(msg: string) {
        mockInfo(msg);
        return super.info(msg);
      }
      error(msg: string) {
        mockError(msg);
        return super.error(msg);
      }
    },
  };
});

type TempDirs = { srcDir: string; outDir: string };
type TestFile = { name: string; content: string };

const test = baseTest.extend<{ tempDirs: TempDirs }>({
  tempDirs: [
    async ({}, use) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vitest-run-'));
      const srcDir = path.join(root, 'public');
      const outDir = path.join(root, 'dist');

      fs.mkdirSync(srcDir, { recursive: true });
      fs.mkdirSync(outDir, { recursive: true });

      await use({ srcDir, outDir });

      fs.rmSync(root, { recursive: true, force: true });
    },
    { scope: 'file' },
  ],
});

describe('staticsDetector Integration Tests', () => {
  const copiableFile: TestFile = { name: 'robots.txt', content: 'User-agent: *' };
  const ignoredFile: TestFile = { name: 'script.ts', content: `console.log("I'm script");` };

  test(`should find the actual ${bashScriptName} script file relative to the plugin layout`, () => {
    const expectedScriptPath = path.join(import.meta.dirname, `../src/script/${bashScriptName}`);

    const fileExists = fs.existsSync(expectedScriptPath);
    expect(fileExists).toBe(true);
  });

  describe('Standard Build Pipeline Execution', { concurrent: false }, () => {
    let cachedLogs: string[][];

    beforeAll(() => {
      vi.clearAllMocks();
      vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    test('should successfully trigger the build start lifecycle and execute the shell script', async ({
      tempDirs,
    }) => {
      const { srcDir, outDir } = tempDirs;
      fs.writeFileSync(path.join(srcDir, copiableFile.name), copiableFile.content);
      fs.writeFileSync(path.join(srcDir, ignoredFile.name), ignoredFile.content);

      const plugin = staticsDetector({
        outDir,
        sources: [srcDir],
        isWatch: false,
      });

      if (typeof plugin.buildStart === 'function') {
        // Trigger the real plugin workflow hook
        await plugin.buildStart.call(plugin as any, {} as any);
      }

      // Give the asynchronous child_process.exec shell time to complete execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      // check and intercept mock calls before cleanup
      expect(mockError).not.toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalled();
      cachedLogs = mockInfo.mock.calls;
    });

    test('should log the process initialization details without producing errors', ({
      tempDirs,
    }) => {
      const { srcDir } = tempDirs;
      const copyLog = cachedLogs[0]?.[0];
      expect(/\[BASH\] Run with pattern '.*ts.*js.*'/.test(copyLog)).toBe(true);
      expect(copyLog.includes(`Updated ${path.join(srcDir, copiableFile.name)}`)).toBe(true);
    });

    test('should respect exclusion rules by separating copied assets from ignored ones', ({
      tempDirs,
    }) => {
      const { outDir } = tempDirs;

      expect(fs.existsSync(path.join(outDir, copiableFile.name))).toBe(true);
      expect(fs.existsSync(path.join(outDir, ignoredFile.name))).toBe(false);
    });

    test('should preserve the intact file content structure of the transferred asset', ({
      tempDirs,
    }) => {
      const { outDir } = tempDirs;

      const finalContent = fs.readFileSync(path.join(outDir, copiableFile.name), 'utf-8');
      expect(finalContent).toBe(copiableFile.content);
    });
  });

  describe('Watch Pipeline Execution', { concurrent: false }, () => {
    const onflyMutatingFile = {
      name: 'mutating-file.log',
      content: 'This is a file initial content',
    };
    let cachedLogs: string[][];
    const checkUpdatingLog = (srcDir: string) => {
      const copyLog = cachedLogs[0]?.[0];
      console.log('copyLog', copyLog);
      expect(copyLog.includes(`Updated ${path.join(srcDir, onflyMutatingFile.name)}`)).toBe(true);
    };

    test('should stream real stdout data from a spawned watcher script', async ({ tempDirs }) => {
      const { srcDir, outDir } = tempDirs;
      fs.writeFileSync(path.join(srcDir, copiableFile.name), copiableFile.content);
      fs.writeFileSync(path.join(srcDir, ignoredFile.name), ignoredFile.content);
      const plugin = staticsDetector({
        outDir,
        sources: [srcDir],
        isWatch: true,
      });

      if (typeof plugin.buildStart === 'function') {
        await plugin.buildStart.call(plugin as any, {} as any);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(mockError).not.toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalled();
      cachedLogs = mockInfo.mock.calls;
    });

    test('should log the process initialization details without producing errors', ({
      tempDirs,
    }) => {
      const { srcDir } = tempDirs;
      console.log('copyLog', cachedLogs);

      let logText = cachedLogs[0]?.[0] ?? '';
      expect(logText).toBe(`Started watcher for '${srcDir}'`);

      logText = cachedLogs[1]?.[0] ?? '';
      expect(/\[BASH\] Run with pattern '.*ts.*js.*'/.test(logText)).toBe(true);

      logText = cachedLogs[2]?.[0] ?? '';
      expect(logText.includes(`Updated ${path.join(srcDir, copiableFile.name)}`)).toBe(true);
    });

    test('should react to creating new files and re-execute the copy pipeline', async ({
      tempDirs,
    }) => {
      const { srcDir } = tempDirs;
      fs.writeFileSync(path.join(srcDir, onflyMutatingFile.name), onflyMutatingFile.content);
      await new Promise((resolve) => setTimeout(resolve, 1010));

      expect(mockError).not.toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalled();
      cachedLogs = mockInfo.mock.calls;
    });

    test('should log the file change detection details without producing errors', ({
      tempDirs,
    }) => {
      const { srcDir } = tempDirs;
      checkUpdatingLog(srcDir);
    });

    const appendingData: string = 'text appended to file';

    test('should react to file content changes and re-execute the copy pipeline', async ({
      tempDirs,
    }) => {
      const { srcDir } = tempDirs;
      fs.writeFileSync(path.join(srcDir, onflyMutatingFile.name), appendingData, { flag: 'a' });
      await new Promise((resolve) => setTimeout(resolve, 1010));

      expect(mockError).not.toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalled();
      cachedLogs = mockInfo.mock.calls;
    });

    test('should log the file content changes detection details without producing errors', ({
      tempDirs,
    }) => {
      const { srcDir } = tempDirs;
      checkUpdatingLog(srcDir);
    });

    test('should preserve the file content structure after file changes', ({ tempDirs }) => {
      const { outDir } = tempDirs;
      let finalContent = fs.readFileSync(path.join(outDir, copiableFile.name), 'utf-8');
      expect(finalContent).toBe(copiableFile.content);
      finalContent = fs.readFileSync(path.join(outDir, onflyMutatingFile.name), 'utf-8');
      expect(finalContent).toBe(onflyMutatingFile.content + appendingData);
    });
  });
});
