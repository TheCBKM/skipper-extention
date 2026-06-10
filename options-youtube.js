const ccOptionToggle = document.querySelector('#ccOption')
const yOptionToggle = document.querySelector('#yOption')

async function getYoutubeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.url?.includes('youtube.com/watch')) {
    return tab
  }
  return null
}

function sendOptionsToContentScript(ccOption, yOption) {
  getYoutubeTab().then((tab) => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { isOption: true, ccOption, yOption })
    }
  })
}

window.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.local.get(['ccOption', 'yOption'])
  ccOptionToggle.checked = result.ccOption ?? true
  yOptionToggle.checked = result.yOption ?? true
})

ccOptionToggle.addEventListener('change', () => {
  chrome.storage.local.set({ ccOption: ccOptionToggle.checked })
  sendOptionsToContentScript(ccOptionToggle.checked, yOptionToggle.checked)
})

yOptionToggle.addEventListener('change', () => {
  chrome.storage.local.set({ yOption: yOptionToggle.checked })
  sendOptionsToContentScript(ccOptionToggle.checked, yOptionToggle.checked)
})
