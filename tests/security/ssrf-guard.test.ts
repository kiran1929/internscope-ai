import { describe, it, expect } from 'vitest';
import { validateOutboundUrl, sanitizeGitHubUsername } from '@/lib/security/ssrf-guard';

describe('ssrf guard', () => {
  it('blocks localhost URLs', () => {
    const result = validateOutboundUrl('http://localhost:3000');
    expect(result.isValid).toBe(false);
  });

  it('blocks metadata IP', () => {
    const result = validateOutboundUrl('http://169.254.169.254/latest/meta-data');
    expect(result.isValid).toBe(false);
  });

  it('allows public https URLs', () => {
    const result = validateOutboundUrl('https://example.com/portfolio');
    expect(result.isValid).toBe(true);
  });

  it('sanitizes github usernames', () => {
    expect(sanitizeGitHubUsername('@valid-user')).toBe('valid-user');
    expect(sanitizeGitHubUsername('../../etc/passwd')).toBeNull();
  });
});
