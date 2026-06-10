const SELECTORS = {
  adTimeIndicatorText: '.atvwebplayersdk-adtimeindicator-text',
  adTimerRemaining: '.atvwebplayersdk-ad-timer-remaining-time',
  adResumeMessage: '.atvwebplayersdk-ad-resume-message',
  adTimerText: '.atvwebplayersdk-ad-timer-text',
  adSkipButton: '.adSkipButton',
  skipElement: '.fu4rd6c',
  skipVariant: '.f1cw2swo',
  skippable: '.skippable',
  skipSdkButton: '.atvwebplayersdk-skipelement-button',
  nextUpButton: '.atvwebplayersdk-nextupcard-button',
  playerVideo: '#dv-web-player video',
  adTimeIndicator: '.atvwebplayersdk-adtimeindicator',
};

const MAX_TRIES_MONITOR_SKIP = 10;
const AD_FAST_FORWARD_RATE = 8;

let observer = null;
let isMonitorActive = false;
let restoreInterval = null;
let skipAds = true;

function restoreVideo(video) {
  video.muted = video.dataset.prevMuted === 'true';
  video.playbackRate = parseFloat(video.dataset.prevRate) || 1;
  delete video.dataset.skipperActive;
  delete video.dataset.prevMuted;
  delete video.dataset.prevRate;
}

function getMonitorSelectors() {
  if (!skipAds) return [];
  return [
    SELECTORS.adTimeIndicatorText,
    SELECTORS.adTimerRemaining,
    SELECTORS.adResumeMessage,
    SELECTORS.adTimerText,
    SELECTORS.adSkipButton,
    SELECTORS.skipElement,
    SELECTORS.skipVariant,
    SELECTORS.skippable,
    SELECTORS.skipSdkButton,
    SELECTORS.nextUpButton,
  ];
}

function handleMutation(elem) {
  const newClass = elem.getAttribute('class') ?? '';
  const videoNode = document.querySelector(SELECTORS.playerVideo);

  if (
    skipAds &&
    newClass.includes('adSkipButton') &&
    newClass.includes('skippable')
  ) {
    const adSkipButtons = document.getElementsByClassName('adSkipButton skippable');
    if (adSkipButtons.length > 0) {
      setTimeout(() => adSkipButtons[0].click(), 500);
    }
  }

  if (skipAds && newClass.includes('fu4rd6c') && !elem.classList.contains('done')) {
    setTimeout(() => {
      if (elem && !elem.classList.contains('done')) {
        elem.click();
        elem.classList.add('done');
      }
    }, 500);
  }

  if (skipAds && newClass.includes('atvwebplayersdk-ad-timer-remaining-time')) {
    document.querySelectorAll('video:not([class*="tst"])').forEach((video) => {
      if (video.paused) return;
      if (video.dataset.skipperActive !== 'true') {
        video.dataset.prevMuted = String(video.muted);
        video.dataset.prevRate = String(video.playbackRate);
        video.dataset.skipperActive = 'true';
      }
      video.muted = true;
      video.playbackRate = AD_FAST_FORWARD_RATE;
    });
  }

  if (
    skipAds &&
    newClass.includes('fu4rd6c') &&
    newClass.includes('f1cw2swo') &&
    !newClass.includes('atvwebplayersdk-nexttitle-button') &&
    !newClass.includes('preventNextClick')
  ) {
    setTimeout(() => {
      if (
        !newClass.includes('atvwebplayersdk-nexttitle-button') &&
        !newClass.includes('preventNextClick')
      ) {
        elem.classList.add('preventNextClick');
        elem.click();
        elem.classList.add('done');
      }
    }, 500);
  }

  if (
    newClass.includes('atvwebplayersdk-adtimeindicator') &&
    videoNode &&
    skipAds
  ) {
    const adText = document.querySelector(SELECTORS.adTimeIndicatorText);
    if (!adText) return;

    const match = adText.textContent.match(/^\d+|\d+\b|\d+(?=\w)/g);
    if (!match) return;

    const adDuration = parseInt(match[0], 10);
    const currTime = videoNode.currentTime;
    const afterAd = currTime + adDuration;
    videoNode.currentTime = afterAd;
  }
}

function startMonitoringForSelectors(selectors, numTries = 0) {
  numTries += 1;

  if (!selectors.length) return;

  const reactEntry = document.querySelector('body');
  if (reactEntry) {
    if (!isMonitorActive) {
      observer = new MutationObserver(() => {
        const joined = selectors.join(', ');
        document.querySelectorAll(joined).forEach(handleMutation);
      });

      observer.observe(reactEntry, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeOldValue: false,
      });
      isMonitorActive = true;
    }
  } else if (numTries <= MAX_TRIES_MONITOR_SKIP) {
    setTimeout(() => startMonitoringForSelectors(selectors, numTries), 100 * numTries);
  }
}

function startRestoreInterval() {
  if (restoreInterval) return;
  restoreInterval = setInterval(() => {
    if (skipAds && document.querySelector(SELECTORS.adTimerRemaining)) {
      return;
    }
    document.querySelectorAll('video:not([class*="tst"])').forEach((video) => {
      if (video.dataset.skipperActive === 'true') {
        restoreVideo(video);
      } else if (video.playbackRate === AD_FAST_FORWARD_RATE) {
        video.playbackRate = 1;
      }
    });
  }, 500);
}

function stopMonitoring() {
  observer?.disconnect();
  observer = null;
  isMonitorActive = false;
}

function stopRestoreInterval() {
  if (restoreInterval) {
    clearInterval(restoreInterval);
    restoreInterval = null;
  }
}

export const primePlatform = {
  id: 'prime',

  init(settings) {
    skipAds = settings.platforms.prime?.skipAds !== false;
    startMonitoringForSelectors(getMonitorSelectors());
    startRestoreInterval();
  },

  destroy() {
    stopMonitoring();
    stopRestoreInterval();
    document.querySelectorAll('video:not([class*="tst"])').forEach((video) => {
      if (video.dataset.skipperActive === 'true') {
        restoreVideo(video);
      }
    });
  },

  onSettingsUpdated(settings) {
    skipAds = settings.platforms.prime?.skipAds !== false;
    stopMonitoring();
    startMonitoringForSelectors(getMonitorSelectors());
  },

  getStatus() {
    const player = document.querySelector(SELECTORS.playerVideo);
    return {
      active: skipAds,
      detail: player ? 'Monitoring player' : 'Waiting for player',
    };
  },
};
