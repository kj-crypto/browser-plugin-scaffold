import { type Plugin, type RolldownPlugin } from 'rolldown';
import { ChildProcess, exec, spawn } from 'child_process';
import path from 'path';
import { Logger } from './logger.ts';
import { ExcludePattern } from './exclude.ts';

const SLEEP_TIME = 1;
type Signal = 'SIGINT' | 'SIGTERM' | 'SIGKILL' | 'exit';

export type StaticDetectorOptions = {
  outDir: string;
  sources?: string[];
  excludes?: string[];
  isWatch?: boolean;
};

export function staticsDetector(options: StaticDetectorOptions): Plugin {
  let isWatch = options.isWatch || false;
  let outDir = options.outDir;
  const watchers = new Set<ChildProcess>();
  const logger = new Logger('[static-bundler]');
  const fullPath = path.join(import.meta.dirname!, 'copy_statics.sh');
  const excludeExtensions = new ExcludePattern(options.excludes || [], { logger });
  const buildCmd = `source ${fullPath} && set_exclude '"${excludeExtensions.getPattern()}"' && copy_statics`;
  const watchCmd = `source ${fullPath} && set_exclude '"${excludeExtensions.getPattern()}"' && watch_files`;
  const sources = options.sources?.length ? options.sources : ['public'];

  ['SIGINT', 'SIGTERM', 'exit'].forEach((signal) => {
    process.on(signal, () => {
      if (isWatch) killWatchers('SIGTERM');
      process.exit(0);
    });
  });

  const spawnWatcher = (source: string) => {
    const child = spawn(`bash -c '${watchCmd} ${source} ${outDir} ${SLEEP_TIME}'`, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      shell: true,
    });

    watchers.add(child);

    child.stdout?.on('data', (data) => {
      logger.info(data.toString());
    });

    child.stderr?.on('data', (data) => {
      logger.error(data.toString());
    });

    child.on('error', (error) => {
      logger.error(`Failed to start process: ${error}`);
    });
  };

  const killWatchers = (signal: Signal) => {
    if (watchers.size > 0) {
      for (const child of watchers) {
        if (child.pid) {
          try {
            process.kill(-child.pid, signal);
            logger.info(`Shutdown process ${child.pid}`);
          } catch (e) {
            logger.error(`Failed to kill process: ${e}`);
          }
        }
      }
      watchers.clear();
    }
  };

  return {
    name: 'statics-bundler',

    async buildStart() {
      if (!isWatch) {
        for (const source of sources) {
          exec(`bash -c '${buildCmd} ${source} ${outDir}'`, (error, stdout, stderr) => {
            if (error) {
              logger.error(`Error: ${error}`);
              return;
            }
            logger.info(stdout);
            logger.info(stderr);
          });
        }
      } else {
        killWatchers('SIGTERM');
        for (const source of sources) {
          spawnWatcher(source);
          logger.info(`Started watcher for '${source}'`);
        }
      }
    },
  };
}

export function inlineCssPlugin(): RolldownPlugin {
  return {
    name: 'inline-css',
    load: {
      filter: { id: /\.css\?inline$/ },
      async handler(id: string): Promise<string> {
        const actualId = id.replace(/\?inline$/, '');
        const data = await this.fs.readFile(actualId);
        const inlineCss = data.toString().replace(/\n/g, '').replace(/\s+/g, ' ').trim();
        return `export default ${JSON.stringify(inlineCss)};`;
      },
    },
  };
}
