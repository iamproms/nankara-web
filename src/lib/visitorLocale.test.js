import { describe, expect, it } from 'vitest';

import { classifyVisitor } from './visitorLocale';

describe('classifyVisitor', () => {
  it('treats the Africa/Lagos timezone as domestic', () => {
    expect(classifyVisitor({ timeZone: 'Africa/Lagos', languages: ['en-US'] })).toBe(
      'domestic'
    );
  });

  it('treats Nigerian languages as domestic', () => {
    for (const lang of ['en-NG', 'yo', 'ha', 'ig', 'yo-NG']) {
      expect(classifyVisitor({ timeZone: 'America/New_York', languages: [lang] })).toBe(
        'domestic'
      );
    }
  });

  it('treats a foreign timezone + language as international', () => {
    expect(
      classifyVisitor({ timeZone: 'America/New_York', languages: ['en-US', 'en'] })
    ).toBe('international');
  });

  it('accepts a single language string', () => {
    expect(classifyVisitor({ timeZone: 'Europe/London', languages: 'en-GB' })).toBe(
      'international'
    );
    expect(classifyVisitor({ timeZone: 'Europe/London', languages: 'en-NG' })).toBe(
      'domestic'
    );
  });

  it('defaults to international when signals are missing', () => {
    expect(classifyVisitor()).toBe('international');
    expect(classifyVisitor({})).toBe('international');
    expect(classifyVisitor({ languages: [] })).toBe('international');
  });

  it('does not misclassify "en" or "en-GB" as Nigerian', () => {
    expect(classifyVisitor({ languages: ['en'] })).toBe('international');
    expect(classifyVisitor({ languages: ['en-GB'] })).toBe('international');
  });
});
