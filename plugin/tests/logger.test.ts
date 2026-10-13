import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../src/logger.ts';

const stripAnsi = (str: string) => str.replace(/[\u001b\x1b]\[[0-9;]*m/gs, '');

const defaultPrefix = '[static-bundler]';

describe('Logger functionality', () => {
  let logSpy: any;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('should log standard message with default prefix', () => {
    const logger = new Logger();
    logger.info('Info logging');
    logger.error('Error logging');

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(stripAnsi(logSpy.mock.calls[0]?.[0])).toBe(`${defaultPrefix} Info logging`);
    expect(stripAnsi(logSpy.mock.calls[1]?.[0])).toBe(`${defaultPrefix} Error logging`);
  });

  test('should automatically prepend custom prefix to logs', () => {
    const logger = new Logger('[custom prefix]');
    logger.info('Info logging');
    logger.error('Error logging');

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(stripAnsi(logSpy.mock.calls[0]?.[0])).toBe('[custom prefix] Info logging');
    expect(stripAnsi(logSpy.mock.calls[1]?.[0])).toBe('[custom prefix] Error logging');
  });

  test('should preserve multiline message formatting and indentations', () => {
    const logger = new Logger('[custom prefix]');
    const multiLines = `Multiline msg\n  middle line\n  footer\n  `;

    logger.info(multiLines);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(stripAnsi(logSpy.mock.calls[0]?.[0])).toBe(
      '[custom prefix] Multiline msg\n[custom prefix] middle line\n[custom prefix] footer',
    );
  });

  test('should handle empty messages securely without throwing errors', () => {
    const logger = new Logger();

    expect(() => logger.error('')).not.toThrow();
  });
});
