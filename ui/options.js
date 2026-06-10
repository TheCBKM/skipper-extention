import { getSettings, updatePlatformSettings, subscribe } from '../core/settings.js';
import { renderPlatformCards } from './platform-cards.js';

const root = document.getElementById('platform-cards-root');

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
  renderPlatformCards(root, settings, { activePlatformId: null, mode: 'options' });
  bindToggles();
}

document.getElementById('options-title').textContent =
  chrome.i18n.getMessage('options_title') || 'Skipper Settings';

subscribe(render);
render();
