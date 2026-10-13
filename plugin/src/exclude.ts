import { DefaultLogger, type ILogger } from './logger.ts';

/**
 * Create exclude-pattern for `find -regex <exclude-pattern>`
 *
 * @example
 * ```ts
 * const excludePattern = new ExcludePattern([".html", "*.json", "ts"]);
 * console.log(excludePattern.getPattern()); // '.*\.\(html\|json\|ts\)$'
 * console.log(new ExcludePattern().getPattern()); // '.*\.\(ts\|js\)$'
 * ```
 */
export class ExcludePattern {
  private pattern: string;
  private readonly defaultPattern = String.raw`'.*\.\(ts\|js\)$'`;
  private logger: ILogger;
  constructor(patterns?: string[], options?: ExcludePatternOptions) {
    this.logger = options?.logger || new DefaultLogger();
    this.pattern = this.prepareForFind(patterns);
  }

  private prepareForFind(patterns?: string[]): string {
    if (!patterns || patterns.length === 0) {
      return this.defaultPattern;
    }
    let result = String.raw`'.*\(`;
    for (const pattern of patterns) {
      const findItems = /\*?([a-zA-Z0-9_\-/]*\.?[a-zA-Z0-9_\-/]+)$/.exec(pattern)?.[1];
      if (findItems) {
        result += findItems.replace('.', String.raw`\.`) + String.raw`\|`;
      } else {
        this.logger.error(`Cannot handle pattern: ${pattern}`);
      }
    }
    result = result.slice(0, -2) + String.raw`\)$'`;
    return result;
  }

  getPattern(): string {
    return this.pattern;
  }
}

type ExcludePatternOptions = {
  logger?: ILogger;
};
