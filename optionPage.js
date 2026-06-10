const skipAdsToggle = document.querySelector('#skipAds')

skipAdsToggle.addEventListener('change', async () => {
    const options = await loadOptionsOrSetDefaults()
    options.skipAds = skipAdsToggle.checked
    chrome.storage.sync.set({ options })
})

window.addEventListener('DOMContentLoaded', async () => {
    const options = await loadOptionsOrSetDefaults()
    skipAdsToggle.checked = options.skipAds
})

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.options?.newValue) {
        skipAdsToggle.checked = changes.options.newValue.skipAds
    }
})
