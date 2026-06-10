let lastActiveTabId = null;

async function rememberTab(tabId) {
  if (typeof tabId !== 'number') return;
  lastActiveTabId = tabId;
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  rememberTab(tabId);
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  rememberTab(tab?.id);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
      if (tab?.id === tabId) {
        rememberTab(tabId);
      }
    });
  }
});

chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
  rememberTab(tab?.id);
});

export async function getContextTab() {
  if (lastActiveTabId != null) {
    try {
      return await chrome.tabs.get(lastActiveTabId);
    } catch {
      lastActiveTabId = null;
    }
  }

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab ?? null;
}
