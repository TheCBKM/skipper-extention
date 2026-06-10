async function loadOptionsOrSetDefaults() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('options', async(item) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError)
            }
            options = item?.options
            if (!options) {
                options = {
                    "skipAds": true,
                    "ffAds": true
                }
                chrome.storage.sync.set({
                    'options': options
                })
            }
            resolve(options)
        })
    })
}