import { describe, test, expect } from 'vitest';
import { ExcludePattern } from '../src/exclude.ts';

describe('ExcludePattern syntax compilation', () => {
  const assertPattern = (excludePattern: ExcludePattern, expectedTarget: string) => {
    const src = excludePattern.getPattern();
    expect(src).toBe(expectedTarget);
  };

  test('should compile default pattern correctly', () => {
    const target = String.raw`'.*\.\(ts\|js\)$'`;
    const excludePattern = new ExcludePattern();
    assertPattern(excludePattern, target);
  });

  test('should compile custom formats with html, json and extensions', () => {
    const target = String.raw`'.*\(\.html\|\.json\|ts\)$'`;
    const excludePattern = new ExcludePattern(['.html', '*.json', 'ts']);
    assertPattern(excludePattern, target);
  });

  test('should trim spaces and compile complex file paths correctly', () => {
    const target = String.raw`'.*\(ts\|scripts/styles\.css\)$'`;
    const excludePattern = new ExcludePattern([' ts', 'scripts/styles.css']);
    assertPattern(excludePattern, target);
  });
});
