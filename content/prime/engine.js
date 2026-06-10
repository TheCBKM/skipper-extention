const MAX_TRIES_MONITOR_SKIP = 10
const AD_FAST_FORWARD_RATE = 8
let isMonitorActive = null
let options
let frontAdActive = false
let videoSkipped = false

async function initContent() {
    options = await loadOptionsOrSetDefaults()
    startHelper(options)
}

initContent()

chrome.storage.onChanged.addListener(
    (changes, areaName) => {
        if (areaName === 'sync' && changes.options?.newValue) {
            options = changes.options.newValue
            startHelper(options)
        }
    }
)

function startMonitoringForSelectors(selectors, numTries) {
    numTries++
    const monitor = new MutationObserver(() => {
        let selector = selectors.join(', ')
        let elems = document.querySelectorAll(selector)
        for (const elem of elems) {
            const newClass = elem.getAttribute("class")
            let videoNode = document.querySelector('#dv-web-player video')
            if (options.skipAds && newClass.includes('adSkipButton') && newClass.includes('skippable')) {
                const adSkipButtons = document.getElementsByClassName('adSkipButton skippable')
                if(adSkipButtons.length > 0) {
                    setTimeout(() => {
                        adSkipButtons[0].click()
                    },500)
                }
            }
            if (options.skipAds && newClass.includes('fu4rd6c') && !elem.classList.contains('done')) {
                setTimeout(() => {
                    if (elem && !elem.classList.contains('done')) {
                        elem.click()
                        elem.classList.add('done')
                    }
                },500)
            }
            if (options.skipAds && newClass.includes('atvwebplayersdk-ad-timer-remaining-time')) {
                let videos = document.querySelectorAll('video:not([class*="tst"])')
                videos.forEach(video => {
                    if (video.paused) return
                    if (video.dataset.skipperActive !== "true") {
                        video.dataset.prevMuted = video.muted
                        video.dataset.prevRate = video.playbackRate
                        video.dataset.skipperActive = "true"
                    }
                    video.muted = true
                    video.playbackRate = AD_FAST_FORWARD_RATE
                })
            }
            if (options.skipAds && newClass.includes('fu4rd6c') && newClass.includes('f1cw2swo') && !newClass.includes('atvwebplayersdk-nexttitle-button') && !newClass.includes('preventNextClick')) {
                setTimeout(() => {
                    if (!newClass.includes('atvwebplayersdk-nexttitle-button') && !newClass.includes('preventNextClick')) {
                        elem.classList.add('preventNextClick')
                        elem.click()
                        elem.classList.add('done')
                    }
                },500)
            }
            if (newClass.includes('atvwebplayersdk-adtimeindicator') && videoNode != null && options.skipAds) {
                let lastAdTime = -1
                let adText = document.querySelector(".atvwebplayersdk-adtimeindicator-text")
                let adDuration = parseInt(adText.textContent.match(/^\d+|\d+\b|\d+(?=\w)/g)[0])
                let currTime = videoNode.currentTime
                let afterAd = currTime + adDuration
                if (Math.abs(currTime - lastAdTime) > 1) {
                    videoNode.currentTime = afterAd
                    lastAdTime = afterAd
                } else {
                    videoNode.currentTime = afterAd
                    setTimeout(() => {
                        videoNode.currentTime = afterAd - adDuration
                        lastAdTime = -1
                    }, 100)
                }
            }
        }
    })

    let reactEntry = document.querySelector('body')
    if (!selectors.length) {
        return
    } else if (reactEntry) {
        if (!isMonitorActive) {
            monitor.observe(reactEntry, {
                attributes: true,
                attributeFilter: ['.atvwebplayersdk-adtimeindicator-text'],
                childList: true,
                subtree: true,
                attributeOldValue: false
            })
            isMonitorActive = true
        }
    } else {
        if (numTries > MAX_TRIES_MONITOR_SKIP) { return }
        setTimeout(() => {
            startMonitoringForSelectors(selectors, numTries)
        }, 100 * numTries)
    }
}

function startHelper(options) {
    let selectors = []
    if (options.skipAds) { enableskipAds(selectors) }
    startMonitoringForSelectors(selectors, 0)
}

function enableskipAds(selectors) {
    selectors.push('.atvwebplayersdk-adtimeindicator-text')
    selectors.push('.atvwebplayersdk-ad-timer-remaining-time')
    selectors.push('.atvwebplayersdk-ad-resume-message') // new
    selectors.push('.atvwebplayersdk-ad-timer-text')
    selectors.push('.adSkipButton')
    selectors.push('.fu4rd6c')
    selectors.push('.f1cw2swo')
    selectors.push('.skippable')
    selectors.push('.atvwebplayersdk-skipelement-button')
    selectors.push('.atvwebplayersdk-nextupcard-button')
}

function restoreVideo(video) {
    video.muted = video.dataset.prevMuted === "true"
    video.playbackRate = parseFloat(video.dataset.prevRate) || 1
    delete video.dataset.skipperActive
    delete video.dataset.prevMuted
    delete video.dataset.prevRate
}

setInterval(() => {
    if (options && options.skipAds && document.querySelector('.atvwebplayersdk-ad-timer-remaining-time')) {
        return
    }
    let videos = document.querySelectorAll('video:not([class*="tst"])')
    videos.forEach(video => {
        if (video.dataset.skipperActive === "true") {
            restoreVideo(video)
        } else if (video.playbackRate === AD_FAST_FORWARD_RATE) {
            video.playbackRate = 1
        }
    })
}, 500)