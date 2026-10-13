/**
 * Logger class for logging messages to the console
 */

export interface ILogger {
  info(msg: string): void;
  error(msg: string): void;
}

export class DefaultLogger implements ILogger {
  info(msg: string) {
    console.log(msg);
  }
  error(msg: string) {
    console.error(msg);
  }
}

export class Logger implements ILogger {
  private prefix: string;
  constructor(prefix: string = '[static-bundler]') {
    this.prefix = prefix;
  }
  private processMessage(msg: string, prefix: string, textColor: Color) {
    msg = msg.trim();
    if (msg.includes('\n'))
      return msg
        .split('\n')
        .map((line) => `${prefix} ${textColor}${line}${Color.reset}`)
        .join('\n');
    return `${prefix} ${textColor}${msg}${Color.reset}`;
  }

  private logNonEmptyString(msg: string, prefix: string, textColor: Color) {
    if (msg !== '') console.log(this.processMessage(msg, prefix, textColor));
  }

  info(msg: string) {
    this.logNonEmptyString(msg, `${Color.blueBold}${this.prefix}${Color.reset}`, Color.blue);
  }

  error(msg: string) {
    this.logNonEmptyString(msg, `${Color.redBold}${this.prefix}${Color.reset}`, Color.red);
  }
}

const Color = {
  red: '\x1b[31m',
  blue: '\x1b[36m',
  redBold: '\x1b[31;1m',
  blueBold: '\x1b[36;1m',
  reset: '\x1b[0m',
} as const;

type Color = (typeof Color)[keyof typeof Color];
