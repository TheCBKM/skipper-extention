import { detectPlatformFromUrl } from '../core/platform-registry.js';
import { getSettings, updatePlatformSettings, subscribe } from '../core/settings.js';
import { MessageType, sendMessageAsync } from '../core/messaging.js';
import { renderPlatformCards, renderPromoList, showPromoLoader } from './platform-cards.js';

const root = document.getElementById('platform-cards-root');

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
      tabId: tab.id,
      url: tab.url,
    });
    return {
      activePlatformId: response?.activePlatformId ?? detectPlatformFromUrl(tab.url)?.id ?? null,
      tab,
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

function bindToggles(settings) {
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

document.getElementById('open-options').addEventListener('click', (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});

subscribe((newSettings) => {
  document.getElementById('toggle-prime') &&
    (document.getElementById('toggle-prime').checked =
      newSettings.platforms.prime.skipAds);
  document.getElementById('toggle-youtube-ads') &&
    (document.getElementById('toggle-youtube-ads').checked =
      newSettings.platforms.youtube.skipPlatformAds);
  document.getElementById('toggle-youtube-promos') &&
    (document.getElementById('toggle-youtube-promos').checked =
      newSettings.platforms.youtube.skipCreatorPromos);
});

document.querySelector('[data-i18n="settings_link"]').textContent =
  chrome.i18n.getMessage('settings_link') || 'Settings';

render();
