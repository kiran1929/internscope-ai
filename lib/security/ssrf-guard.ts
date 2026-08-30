import { isIP } from 'net';

/**
 * SSRF Guard Utility
 * Blocks private IP ranges, loopback addresses, metadata services, and invalid protocols (CVE-003).
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '169.254.169.254', // AWS/GCP/Azure link-local metadata
  'metadata.google.internal',
  'instance-data',
]);

/**
 * Checks if an IPv4 address is within private, loopback, or link-local ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  // 127.0.0.0/8 (Loopback)
  if (parts[0] === 127) return true;
  // 10.0.0.0/8 (Private)
  if (parts[0] === 10) return true;
  // 172.16.0.0/12 (Private)
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud Metadata)
  if (parts[0] === 169 && parts[1] === 254) return true;
  // 0.0.0.0/8
  if (parts[0] === 0) return true;

  return false;
}

/**
 * Validates whether an outbound URL is safe to request server-side.
 */
export function validateOutboundUrl(rawUrl: string): { isValid: boolean; parsedUrl?: URL; error?: string } {
  try {
    let normalized = rawUrl.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }

    const parsed = new URL(normalized);

    // Only allow HTTP and HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Only HTTP and HTTPS protocols are allowed.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return { isValid: false, error: 'Access to internal hostnames is prohibited.' };
    }

    // Check IP address restrictions
    const ipType = isIP(hostname);
    if (ipType === 4 && isPrivateIPv4(hostname)) {
      return { isValid: false, error: 'Access to private or local IP ranges is prohibited.' };
    }
    if (ipType === 6) {
      // Block all direct IPv6 access or link-local/loopback
      if (hostname === '::1' || hostname.startsWith('fe80:') || hostname.startsWith('fc00:') || hostname.startsWith('fd00:')) {
        return { isValid: false, error: 'Access to local IPv6 ranges is prohibited.' };
      }
    }

    return { isValid: true, parsedUrl: parsed };
  } catch {
    return { isValid: false, error: 'Malformed URL provided.' };
  }
}

/**
 * Sanitizes GitHub usernames to only permit standard GitHub alphanumeric formats.
 */
export function sanitizeGitHubUsername(username: string): string | null {
  const trimmed = username.trim().replace(/^@/, '');
  // GitHub username rule: 1-39 characters, alphanumeric and single hyphens, cannot start or end with hyphen
  const githubRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  if (!githubRegex.test(trimmed)) {
    return null;
  }
  return trimmed;
}
