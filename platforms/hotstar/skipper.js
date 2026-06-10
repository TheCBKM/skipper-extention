const AD_CONTAINER_SELECTOR = '#ad-video-container';

let observer = null;
let enabled = true;

function skipAdVideo(container) {
  if (!enabled) return;
  if (container.checkVisibility && !container.checkVisibility()) return;

  const video = container.querySelector('video');
  if (!video) return;

  const duration = video.duration;
  video.currentTime = Number.isNaN(duration) ? 0 : duration;
}

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    const container = document.querySelector(AD_CONTAINER_SELECTOR);
    if (container) skipAdVideo(container);
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  const existing = document.querySelector(AD_CONTAINER_SELECTOR);
  if (existing) skipAdVideo(existing);
}

function stopObserver() {
  observer?.disconnect();
  observer = null;
}

export const hotstarPlatform = {
  id: 'hotstar',

  init(settings) {
    enabled = settings.platforms.hotstar?.enabled !== false;
    if (enabled) startObserver();
  },

  destroy() {
    stopObserver();
  },

  onSettingsUpdated(settings) {
    enabled = settings.platforms.hotstar?.enabled !== false;
    if (enabled) {
      startObserver();
    } else {
      stopObserver();
    }
  },

  getStatus() {
    const container = document.querySelector(AD_CONTAINER_SELECTOR);
    return {
      active: enabled,
      detail: container ? 'Monitoring ad container' : 'Waiting for player',
    };
  },
};
