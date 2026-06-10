import { API_HOST } from '../../core/constants.js';
import { MessageType } from '../../core/messaging.js';
import { attachFastForwardingText, removeFastForwardingText } from './dom-overlay.js';

const SKIP_BUTTON_SELECTORS = [
  '.ytp-ad-skip-button',
  '.ytp-ad-skip-button-modern',
  '.ytp-ad-survey',
  '.ytp-ad-skip-button-container',
];

const PROMO_PLAYBACK_RATE = 12;
const adReports = {};

let skipPlatformAds = true;
let skipCreatorPromos = true;
let adSkipInterval = null;
let currentAds = [];
let currentTimeUpdateHandler = null;

function skipYoutubeAdsOneIteration(force = false) {
  const playerContainer = document.querySelector('#movie_player');
  const isAd =
    playerContainer &&
    (playerContainer.classList.contains('ad-interrupting') ||
      playerContainer.classList.contains('ad-showing'));

  if (isAd && (skipPlatformAds || force)) {
    const player = document.querySelector('video');
    if (player && Number.isFinite(player.duration)) {
      player.currentTime = player.duration;
    }
  }

  if (skipPlatformAds || force) {
    for (const selector of SKIP_BUTTON_SELECTORS) {
      document.querySelector(selector)?.click();
    }
  }

  return isAd && (skipPlatformAds || force);
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.first - b.first);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].first <= last.second + 3) {
      last.second = Math.max(last.second, sorted[i].second);
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

async function submitAdReports() {
  for (const [videoId, reports] of Object.entries(adReports)) {
    const lastReported = reports[reports.length - 1]?.created ?? 0;
    if (lastReported + 3000 > Date.now()) continue;

    delete adReports[videoId];
    const mergedReports = mergeIntervals(reports);
    for (const report of mergedReports) {
      fetch(`${API_HOST}/adranges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: report.first,
          end: report.second,
          videoId,
        }),
      })
        .then((response) => {
          if (response.ok) {
            chrome.storage.local.set({
              [`yff-cached-video-last-write-${videoId}`]: Date.now(),
            });
          }
        })
        .catch(() => undefined);
    }
  }
}

function adIsPlaying(ads, currentTime) {
  return ads.some(
    (ad) => ad.first <= currentTime && currentTime < ad.second - 2
  );
}

function createTimeUpdateHandler(player, ads) {
  return () => {
    const currentTime = player.currentTime;
    if (skipCreatorPromos && adIsPlaying(ads, currentTime)) {
      player.playbackRate = PROMO_PLAYBACK_RATE;
      player.muted = true;
      attachFastForwardingText(player);
    } else if (player.playbackRate === PROMO_PLAYBACK_RATE) {
      player.playbackRate = 1;
      player.muted = false;
      removeFastForwardingText();
    }
  };
}

function applyPromoRanges(ads) {
  currentAds = ads ?? [];
  const player = document.querySelector('video');
  if (!player) return;

  if (currentTimeUpdateHandler) {
    player.removeEventListener('timeupdate', currentTimeUpdateHandler);
  }

  currentTimeUpdateHandler = createTimeUpdateHandler(player, currentAds);
  player.addEventListener('timeupdate', currentTimeUpdateHandler);
}

function startAdSkipLoop() {
  if (adSkipInterval) return;
  adSkipInterval = setInterval(() => skipYoutubeAdsOneIteration(false), 100);
}

function stopAdSkipLoop() {
  if (adSkipInterval) {
    clearInterval(adSkipInterval);
    adSkipInterval = null;
  }
}

function applySettings(settings) {
  skipPlatformAds = settings.platforms.youtube?.skipPlatformAds !== false;
  skipCreatorPromos = settings.platforms.youtube?.skipCreatorPromos !== false;

  if (skipPlatformAds) {
    startAdSkipLoop();
  } else {
    stopAdSkipLoop();
  }
}

export const youtubePlatform = {
  id: 'youtube',

  init(settings) {
    applySettings(settings);
  },

  destroy() {
    stopAdSkipLoop();
    removeFastForwardingText();
    const player = document.querySelector('video');
    if (player && currentTimeUpdateHandler) {
      player.removeEventListener('timeupdate', currentTimeUpdateHandler);
      if (player.playbackRate === PROMO_PLAYBACK_RATE) {
        player.playbackRate = 1;
        player.muted = false;
      }
    }
  },

  onSettingsUpdated(settings) {
    applySettings(settings);
  },

  onMessage(message) {
    if (message.type === MessageType.PROMO_RANGES) {
      applyPromoRanges(message.ads);
    }
  },

  getStatus() {
    const onWatchPage = location.pathname === '/watch';
    return {
      active: onWatchPage,
      detail: onWatchPage ? 'Monitoring playback' : 'Open a video to activate',
    };
  },
};

// Expose for manual promo reporting if re-enabled later
export { submitAdReports, skipYoutubeAdsOneIteration };
