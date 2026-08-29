const LEGACY_SSL_MODES = new Set(['require', 'prefer', 'verify-ca']);

/**
 * Normalizes PostgreSQL connection strings for pg v8+ / pg-connection-string v2.
 * Maps legacy sslmode values to verify-full to preserve current security behavior
 * and avoid Node deprecation warnings.
 */
export function getPgConnectionString(url?: string): string {
  const connectionString = url ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  try {
    const parsed = new URL(connectionString);
    const sslMode = parsed.searchParams.get('sslmode');

    if (sslMode && LEGACY_SSL_MODES.has(sslMode)) {
      parsed.searchParams.set('sslmode', 'verify-full');
    }

    return parsed.toString();
  } catch {
    return connectionString;
  }
}
