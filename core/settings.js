import { STORAGE_KEY } from './constants.js';

export const DEFAULT_SETTINGS = {
  version: 1,
  platforms: {
    hotstar: { enabled: true },
    prime: { skipAds: true },
    youtube: { skipPlatformAds: true, skipCreatorPromos: true },
  },
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function mergeSettings(partial) {
  const base = cloneDefaults();
  if (!partial) return base;

  if (partial.platforms) {
    for (const [id, values] of Object.entries(partial.platforms)) {
      if (base.platforms[id] && values) {
        base.platforms[id] = { ...base.platforms[id], ...values };
      }
    }
  }

  return base;
}

async function readLegacySettings() {
  const [syncData, localData] = await Promise.all([
    chrome.storage.sync.get(['options']),
    chrome.storage.local.get(['ccOption', 'yOption']),
  ]);

  const legacy = cloneDefaults();
  let migrated = false;

  if (syncData.options) {
    if (typeof syncData.options.skipAds === 'boolean') {
      legacy.platforms.prime.skipAds = syncData.options.skipAds;
      migrated = true;
    }
  }

  if (typeof localData.ccOption === 'boolean') {
    legacy.platforms.youtube.skipCreatorPromos = localData.ccOption;
    migrated = true;
  }

  if (typeof localData.yOption === 'boolean') {
    legacy.platforms.youtube.skipPlatformAds = localData.yOption;
    migrated = true;
  }

  return migrated ? legacy : null;
}

async function migrateIfNeeded() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  if (stored[STORAGE_KEY]?.version === 1) {
    return mergeSettings(stored[STORAGE_KEY]);
  }

  const legacy = await readLegacySettings();
  const settings = legacy ?? cloneDefaults();
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
  return settings;
}

export async function getSettings() {
  return migrateIfNeeded();
}

export async function setSettings(settings) {
  const next = mergeSettings(settings);
  await chrome.storage.sync.set({ [STORAGE_KEY]: next });
  return next;
}

export async function updatePlatformSettings(platformId, patch) {
  const current = await getSettings();
  current.platforms[platformId] = {
    ...current.platforms[platformId],
    ...patch,
  };
  return setSettings(current);
}

export function subscribe(callback) {
  const listener = (changes, areaName) => {
    if (areaName !== 'sync' || !changes[STORAGE_KEY]?.newValue) return;
    callback(mergeSettings(changes[STORAGE_KEY].newValue));
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export function getPlatformSettings(settings, platformId) {
  return settings.platforms[platformId] ?? {};
}
