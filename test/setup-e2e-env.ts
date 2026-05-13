/**
 * Secretos dummy solo para suites Jest e2e (no usar en producción).
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'jest-jwt-secret-16chars';
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'jest-access-token-16';
process.env.ACCESS_TOKEN_REFRESH_SECRET =
  process.env.ACCESS_TOKEN_REFRESH_SECRET || 'jest-refresh-token-16';
