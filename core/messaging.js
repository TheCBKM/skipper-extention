export const MessageType = {
  GET_CONTEXT_TAB: 'GET_CONTEXT_TAB',
  GET_TAB_STATUS: 'GET_TAB_STATUS',
  GET_YOUTUBE_PROMOS: 'GET_YOUTUBE_PROMOS',
  PROMO_RANGES: 'PROMO_RANGES',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
};

export function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

export function sendMessageAsync(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response);
    });
  });
}

export function sendTabMessage(tabId, message) {
  return chrome.tabs.sendMessage(tabId, message).catch(() => undefined);
}
