import { PLATFORMS } from '../core/platform-registry.js';
import { getPlatformSettings } from '../core/settings.js';

const t = (key) => chrome.i18n.getMessage(key) || key;

const PLATFORM_LABELS = {
  prime: () => t('platform_prime'),
  hotstar: () => t('platform_hotstar'),
  youtube: () => t('platform_youtube'),
};

const LOADER_SVG = `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M12 4a8 8 0 0 1 7.75 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M16 4h4v4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 20a8 8 0 0 1-7.75-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M8 20H4v-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function createSwitch(id, checked, disabled = false) {
  const label = document.createElement('label');
  label.className = 'switch';
  label.innerHTML = `
    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
    <span class="switch__slider"></span>
  `;
  return label;
}

function formatTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  if (hrs === 0) return `${mins}:${pad(secs)}`;
  return `${hrs}:${pad(mins)}:${pad(secs)}`;
}

function statusText(platformId, activePlatformId) {
  if (platformId === 'hotstar') {
    return activePlatformId === 'hotstar'
      ? t('status_active_tab')
      : t('status_hotstar_enabled');
  }
  if (activePlatformId === platformId) {
    return t('status_active_tab');
  }
  return t('status_not_on_site');
}

export function renderPlatformCards(container, settings, { activePlatformId = null, mode = 'popup' } = {}) {
  container.innerHTML = '';
  const cards = document.createElement('div');
  cards.className = 'skipper-cards';

  for (const platform of PLATFORMS) {
    const platformSettings = getPlatformSettings(settings, platform.id);
    const isActive = activePlatformId === platform.id;
    const card = document.createElement('article');
    card.className = `platform-card${isActive ? ' platform-card--active' : ''}`;
    card.dataset.platform = platform.id;

    const header = document.createElement('div');
    header.className = 'platform-card__header';

    const titleRow = document.createElement('div');
    titleRow.className = 'platform-card__title-row';
    titleRow.innerHTML = `
      <span class="platform-card__status-dot" aria-hidden="true"></span>
      <span class="platform-card__name">${PLATFORM_LABELS[platform.id]()}</span>
    `;

    header.appendChild(titleRow);

    if (platform.id === 'hotstar') {
      const badge = document.createElement('span');
      badge.className = 'platform-card__badge';
      badge.textContent = t('badge_always_on');
      header.appendChild(badge);
    } else if (platform.id === 'prime') {
      header.appendChild(createSwitch('toggle-prime', platformSettings.skipAds));
    }

    card.appendChild(header);

    const status = document.createElement('p');
    status.className = 'platform-card__status-text';
    status.textContent = statusText(platform.id, activePlatformId);
    card.appendChild(status);

    if (platform.id === 'youtube') {
      const body = document.createElement('div');
      body.className = 'platform-card__body';

      if (mode === 'options') {
        const desc = document.createElement('p');
        desc.className = 'platform-card__description';
        desc.textContent = t('desc_youtube');
        body.appendChild(desc);
      }

      const promoSection = document.createElement('div');
      promoSection.id = 'youtube-promos';
      if (mode === 'popup' && activePlatformId === 'youtube') {
        promoSection.innerHTML = '<div class="skipper-loader" id="promo-loader">' + LOADER_SVG + '</div>';
      } else if (mode === 'popup') {
        promoSection.innerHTML =
          `<p class="promo-list__empty">${t('promo_open_video')}</p>`;
      }
      body.appendChild(promoSection);

      const platformAdsRow = document.createElement('div');
      platformAdsRow.className = 'platform-card__sub-option';
      platformAdsRow.innerHTML = `<span>${t('toggle_platform_ads')}</span>`;
      platformAdsRow.appendChild(
        createSwitch('toggle-youtube-ads', platformSettings.skipPlatformAds)
      );
      body.appendChild(platformAdsRow);

      const creatorPromosRow = document.createElement('div');
      creatorPromosRow.className = 'platform-card__sub-option';
      creatorPromosRow.innerHTML = `<span>${t('toggle_creator_promos')}</span>`;
      creatorPromosRow.appendChild(
        createSwitch('toggle-youtube-promos', platformSettings.skipCreatorPromos)
      );
      body.appendChild(creatorPromosRow);

      card.appendChild(body);
    } else if (mode === 'options' && platform.id === 'prime') {
      const body = document.createElement('div');
      body.className = 'platform-card__body';
      const desc = document.createElement('p');
      desc.className = 'platform-card__description';
      desc.textContent = t('desc_prime');
      body.appendChild(desc);
      card.appendChild(body);
    } else if (mode === 'options' && platform.id === 'hotstar') {
      const body = document.createElement('div');
      body.className = 'platform-card__body';
      const desc = document.createElement('p');
      desc.className = 'platform-card__description';
      desc.textContent = t('desc_hotstar');
      body.appendChild(desc);
      card.appendChild(body);
    }

    cards.appendChild(card);
  }

  container.appendChild(cards);
}

export function showPromoLoader() {
  const section = document.getElementById('youtube-promos');
  if (!section) return;
  section.innerHTML = '<div class="skipper-loader" id="promo-loader">' + LOADER_SVG + '</div>';
}

export function renderPromoList(ads, { error = false } = {}) {
  const section = document.getElementById('youtube-promos');
  if (!section) return;

  if (error) {
    section.innerHTML =
      `<p class="promo-list__empty">${t('promo_error')}</p>`;
    return;
  }

  if (!ads || ads.length === 0) {
    section.innerHTML = `<p class="promo-list__empty">${t('promo_no_detected')}</p>`;
    return;
  }

  const list = document.createElement('ul');
  list.className = 'promo-list';
  for (const ad of ads) {
    const item = document.createElement('li');
    item.className = 'promo-list__item';
    item.textContent = `${formatTimestamp(ad.first)} – ${formatTimestamp(ad.second)}`;
    list.appendChild(item);
  }
  section.innerHTML = '';
  section.appendChild(list);
}

export { LOADER_SVG };
