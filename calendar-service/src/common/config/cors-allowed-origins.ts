/**
 * Browser origins allowed for credentialed requests (REST + Socket.IO).
 * Keep in sync: `main.ts` enableCors and `ActivitiesGateway` WebSocket cors.
 */
export function getCorsAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (raw) {
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }
  return [
    'http://localhost:3000',
    'http://localhost:4173',
    'http://localhost:8080',
  ];
}
