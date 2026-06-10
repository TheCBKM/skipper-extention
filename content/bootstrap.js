(function bootstrap() {
  const hostname = location.hostname;

  const PLATFORMS = [
    {
      id: 'hotstar',
      patterns: [/(^|\.)hotstar\.com$/i],
      module: 'platforms/hotstar/skipper.js',
    },
    {
      id: 'prime',
      patterns: [
        /(^|\.)primevideo\.com$/i,
        /(^|\.)amazon\.com$/i,
        /(^|\.)amazon\.co\.uk$/i,
        /(^|\.)amazon\.de$/i,
        /(^|\.)amazon\.co\.jp$/i,
      ],
      module: 'platforms/prime/skipper.js',
    },
    {
      id: 'youtube',
      patterns: [/(^|\.)youtube\.com$/i],
      module: 'platforms/youtube/skipper.js',
    },
  ];

  const platformMeta = PLATFORMS.find((p) =>
    p.patterns.some((pattern) => pattern.test(hostname))
  );

  if (!platformMeta) return;

  const SETTINGS_KEY = 'skipper-settings';
  const MessageType = {
    PROMO_RANGES: 'PROMO_RANGES',
    SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  };

  let activePlatform = null;
  let currentSettings = null;

  function mergeDefaults(partial) {
    const base = {
      version: 1,
      platforms: {
        hotstar: { enabled: true },
        prime: { skipAds: true },
        youtube: { skipPlatformAds: true, skipCreatorPromos: true },
      },
    };
    if (!partial?.platforms) return base;
    for (const [id, values] of Object.entries(partial.platforms)) {
      if (base.platforms[id] && values) {
        base.platforms[id] = { ...base.platforms[id], ...values };
      }
    }
    return base;
  }

  async function loadSettings() {
    const stored = await chrome.storage.sync.get(SETTINGS_KEY);
    return mergeDefaults(stored[SETTINGS_KEY]);
  }

  function handleMessage(message) {
    if (message.type === MessageType.SETTINGS_UPDATED && activePlatform) {
      currentSettings = message.settings;
      activePlatform.onSettingsUpdated?.(currentSettings);
      return;
    }

    activePlatform?.onMessage?.(message);

    // Backward compat for legacy message shapes during transition
    if (message.ads && message.videoId) {
      activePlatform?.onMessage?.({
        type: MessageType.PROMO_RANGES,
        ads: message.ads,
        videoId: message.videoId,
      });
    }
    if (message.isOption) {
      currentSettings = mergeDefaults(currentSettings);
      currentSettings.platforms.youtube.skipCreatorPromos = message.ccOption;
      currentSettings.platforms.youtube.skipPlatformAds = message.yOption;
      activePlatform?.onSettingsUpdated?.(currentSettings);
    }
  }

  async function start() {
    currentSettings = await loadSettings();
    const moduleUrl = chrome.runtime.getURL(platformMeta.module);

    try {
      const module = await import(moduleUrl);
      const exportName = `${platformMeta.id}Platform`;
      activePlatform = module[exportName];
      if (!activePlatform) {
        console.error('[Skipper] Platform export not found:', exportName);
        return;
      }

      activePlatform.init(currentSettings);

      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes[SETTINGS_KEY]?.newValue) {
          currentSettings = mergeDefaults(changes[SETTINGS_KEY].newValue);
          activePlatform.onSettingsUpdated?.(currentSettings);
        }
      });

      chrome.runtime.onMessage.addListener(handleMessage);
    } catch (error) {
      console.error('[Skipper] Failed to load platform module', error);
    }
  }

  if (platformMeta.id === 'hotstar' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
