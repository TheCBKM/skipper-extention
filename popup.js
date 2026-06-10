const adsTrigger = document.querySelector('#ContinueWatching')
// const ffAdsTrigger = document.querySelector('#ffAds')

let options

window.addEventListener('DOMContentLoaded', async() => {
    options = await loadOptionsOrSetDefaults()
    setCheckbox(options)
})

adsTrigger.addEventListener('change', () => {
    setOptions()
})

// ffAdsTrigger.addEventListener('change', () => {
//     setOptions()
// })

function setOptions() {
    options.skipAds = adsTrigger.checked
    // options.ffAds = ffAdsTrigger.checked
    saveOptions(options)
}

function setCheckbox(options) {
    adsTrigger.checked = options.skipAds
    // ffAdsTrigger.checked = options.ffAds
}

function saveOptions(options) {
    chrome.storage.sync.set({
        'options': options
    })
}