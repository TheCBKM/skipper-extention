export const PLATFORMS = [
  {
    id: 'prime',
    name: 'Prime Video',
    hostPatterns: [
      /(^|\.)primevideo\.com$/i,
      /(^|\.)amazon\.com$/i,
      /(^|\.)amazon\.co\.uk$/i,
      /(^|\.)amazon\.de$/i,
      /(^|\.)amazon\.co\.jp$/i,
    ],
    modulePath: 'platforms/prime/skipper.js',
    runAt: 'document_idle',
  },
  {
    id: 'hotstar',
    name: 'Hotstar',
    hostPatterns: [/(^|\.)hotstar\.com$/i],
    modulePath: 'platforms/hotstar/skipper.js',
    runAt: 'document_start',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    hostPatterns: [/(^|\.)youtube\.com$/i],
    modulePath: 'platforms/youtube/skipper.js',
    runAt: 'document_idle',
  },
];

export function detectPlatform(hostname = location.hostname) {
  return PLATFORMS.find((platform) =>
    platform.hostPatterns.some((pattern) => pattern.test(hostname))
  ) ?? null;
}

export function detectPlatformFromUrl(url) {
  try {
    return detectPlatform(new URL(url).hostname);
  } catch {
    return null;
  }
}

export function getPlatformMeta(id) {
  return PLATFORMS.find((platform) => platform.id === id) ?? null;
}
