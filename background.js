import './background/youtube.js'

const RELOAD_URL_PATTERNS = [
  '*://*.hotstar.com/*',
  '*://*.amazon.com/*',
  '*://*.primevideo.com/*',
  '*://*.amazon.co.uk/*',
  '*://*.amazon.de/*',
  '*://*.amazon.co.jp/*',
  'https://www.youtube.com/*'
]

chrome.runtime.onInstalled.addListener(() => {
  reloadTabs()
})

function reloadTabs() {
  for (const url of RELOAD_URL_PATTERNS) {
    chrome.tabs.query({ url }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.reload(tab.id)
      }
    })
  }
}
