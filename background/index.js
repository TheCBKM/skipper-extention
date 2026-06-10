import { RELOAD_URL_PATTERNS } from '../core/constants.js';
import { MessageType, sendTabMessage } from '../core/messaging.js';
import { detectPlatformFromUrl } from '../core/platform-registry.js';
import { getSettings } from '../core/settings.js';
import { createLogger } from '../core/logger.js';
import { handleGetYoutubePromos, initYoutubeTabWatcher } from './services/youtube.js';
import { getContextTab } from './tab-context.js';

const log = createLogger('background');

function reloadTabs() {
  for (const url of RELOAD_URL_PATTERNS) {
    chrome.tabs.query({ url }, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) chrome.tabs.reload(tab.id);
      }
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  reloadTabs();
});

initYoutubeTabWatcher();

async function handleGetContextTab(sendResponse) {
  const tab = await getContextTab();
  sendResponse({ tab });
}

async function handleGetTabStatus(request, sendResponse) {
  const tab = request.tab ?? (await getContextTab());
  const url = request.url ?? tab?.url ?? '';
  const platform = detectPlatformFromUrl(url);
  const settings = await getSettings();

  sendResponse({
    tab,
    activePlatformId: platform?.id ?? null,
    settings,
  });
}

async function handleSettingsBroadcast(settings) {
  const tabs = await chrome.tabs.query({ url: RELOAD_URL_PATTERNS });
  for (const tab of tabs) {
    if (!tab.id) continue;
    await sendTabMessage(tab.id, {
      type: MessageType.SETTINGS_UPDATED,
      settings,
    });
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes['skipper-settings']?.newValue) {
    handleSettingsBroadcast(changes['skipper-settings'].newValue);
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.type) {
    case MessageType.GET_CONTEXT_TAB:
      handleGetContextTab(sendResponse);
      return true;

    case MessageType.GET_TAB_STATUS:
      handleGetTabStatus(request, sendResponse);
      return true;

    case MessageType.GET_YOUTUBE_PROMOS:
      return handleGetYoutubePromos(request, sendResponse);

    default:
      log.debug('Unhandled message', request);
      return false;
  }
});
