import { detectPlatformFromUrl } from '../core/platform-registry.js';
import { getSettings, updatePlatformSettings, subscribe } from '../core/settings.js';
import { MessageType, sendMessageAsync } from '../core/messaging.js';
import { renderPlatformCards, renderPromoList, showPromoLoader } from './platform-cards.js';

const root = document.getElementById('platform-cards-root');

async function getActiveTab() {
  try {
    const { tab } = await sendMessageAsync({ type: MessageType.GET_CONTEXT_TAB });
    if (tab) return tab;
  } catch {
    // Fall through to tabs.query below.
  }

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab ?? null;
}

async function loadTabStatus() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return { activePlatformId: null, tab: null };
  }

  try {
    const response = await sendMessageAsync({
      type: MessageType.GET_TAB_STATUS,
      tab,
      url: tab.url,
    });
    return {
      activePlatformId:
        response?.activePlatformId ?? detectPlatformFromUrl(tab.url)?.id ?? null,
      tab: response?.tab ?? tab,
    };
  } catch {
    return {
      activePlatformId: detectPlatformFromUrl(tab.url)?.id ?? null,
      tab,
    };
  }
}

async function fetchYoutubePromos(tab) {
  if (!tab?.url?.includes('youtube.com/watch')) return;

  showPromoLoader();
  try {
    const data = await sendMessageAsync({
      type: MessageType.GET_YOUTUBE_PROMOS,
      tab,
    });
    if (data?.error) {
      renderPromoList([], { error: true });
      return;
    }
    renderPromoList(data?.ads ?? []);
  } catch {
    renderPromoList([], { error: true });
  }
}

function bindToggles() {
  const primeToggle = document.getElementById('toggle-prime');
  primeToggle?.addEventListener('change', async (event) => {
    await updatePlatformSettings('prime', { skipAds: event.target.checked });
  });

  const youtubeAdsToggle = document.getElementById('toggle-youtube-ads');
  youtubeAdsToggle?.addEventListener('change', async (event) => {
    await updatePlatformSettings('youtube', { skipPlatformAds: event.target.checked });
  });

  const youtubePromosToggle = document.getElementById('toggle-youtube-promos');
  youtubePromosToggle?.addEventListener('change', async (event) => {
    await updatePlatformSettings('youtube', { skipCreatorPromos: event.target.checked });
  });
}

async function render() {
  const settings = await getSettings();
  const { activePlatformId, tab } = await loadTabStatus();

  renderPlatformCards(root, settings, { activePlatformId, mode: 'popup' });
  bindToggles(settings);

  if (activePlatformId === 'youtube') {
    await fetchYoutubePromos(tab);
  }
}

document.getElementById('open-options')?.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

subscribe((newSettings) => {
  const primeToggle = document.getElementById('toggle-prime');
  if (primeToggle) primeToggle.checked = newSettings.platforms.prime.skipAds;

  const youtubeAdsToggle = document.getElementById('toggle-youtube-ads');
  if (youtubeAdsToggle) {
    youtubeAdsToggle.checked = newSettings.platforms.youtube.skipPlatformAds;
  }

  const youtubePromosToggle = document.getElementById('toggle-youtube-promos');
  if (youtubePromosToggle) {
    youtubePromosToggle.checked = newSettings.platforms.youtube.skipCreatorPromos;
  }
});

const settingsLink = document.querySelector('[data-i18n="settings_link"]');
if (settingsLink) {
  settingsLink.textContent = chrome.i18n.getMessage('settings_link') || 'Settings';
}

render().catch((error) => {
  console.error('[Skipper:popup] Failed to render', error);
  if (root) {
    root.innerHTML =
      '<p class="promo-list__empty">Unable to load Skipper. Try reloading the extension.</p>';
  }
});
