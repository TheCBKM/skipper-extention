const host = 'https://youtube-skip-ads-please-oregon.onrender.com'
let loading = false

Element.prototype.remove = function () {
  this.parentElement.removeChild(this)
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
  for (var i = this.length - 1; i >= 0; i--) {
    if (this[i] && this[i].parentElement) {
      this[i].parentElement.removeChild(this[i])
    }
  }
}

function displayLoading() {
  if (loading) {
    return
  }
  loading = true
  setTimeout(() => {
    if (loading) {
      var ulElement = document.getElementById('intervals')
      const loader = document.createElement('div')
      loader.id = 'loadingSpinner'
      loader.className = 'loader'
      ulElement.appendChild(loader)
    }
  }, 500)
}

async function fetchAds(videoId, lastWriteDate) {
  const tab = await getCurrentTab()
  if (videoId && lastWriteDate) {
    await chrome.storage.local.set({
      [`yff-cached-video-last-write-${videoId}`]: lastWriteDate
    })
  }
  if (!tab) {
    console.log('tab is null')
    return
  }
  displayLoading()
  await chrome.runtime.sendMessage({ tab }, setData)
}

function convertSecondsToTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600) / 60)
  const secondsRemainder = seconds - hours * 3600 - minutes * 60
  const seconds0Prefix = secondsRemainder < 10 ? '0' : ''
  if (hours === 0) {
    return `${minutes}:${seconds0Prefix}${secondsRemainder}`
  }
  const minutes0Prefix = minutes < 10 ? '0' : ''
  return `${hours}:${minutes0Prefix}${minutes}:${seconds0Prefix}${secondsRemainder}`
}

function insertAds(ads) {
  var ulElement = document.getElementById('intervals')

  while (ulElement.firstChild) {
    ulElement.removeChild(ulElement.firstChild)
  }

  if (ads.length === 0) {
    const noAdsElement = document.createElement('p')
    noAdsElement.innerHTML = 'No promos detected in this video'
    ulElement.appendChild(noAdsElement)
    return
  }

  for (var i = 0; i < ads.length; i++) {
    var liElement = document.createElement('li')
    liElement.innerHTML = `${convertSecondsToTimestamp(
      ads[i]['first']
    )} - ${convertSecondsToTimestamp(ads[i]['second'])}`
    liElement.className = 'interval'
    ulElement.appendChild(liElement)
  }
}

let videoId = null
let ads = null

function setData(data) {
  loading = false
  document.getElementById('loadingSpinner')?.remove()
  if (!data) {
    return
  }
  if (data.videoId != null) {
    videoId = data.videoId
  }
  if (data.ads != null) {
    ads = data.ads
    insertAds(ads)
  }
}

async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
    return tab
  }
  return null
}

function sendOptionsToContentScript() {
  getCurrentTab().then((tab) => {
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        isOption: true,
        ccOption,
        yOption
      })
    }
  })
}

let ccOption = true
let yOption = true

function initYoutubePopup() {
  chrome.storage.local.get(['ccOption', 'yOption']).then((result) => {
    ccOption = result.ccOption ?? true
    yOption = result.yOption ?? true
    document.getElementById('ccOption').checked = ccOption
    document.getElementById('yOption').checked = yOption
  })

  document.getElementById('ccOption').addEventListener('change', function (event) {
    ccOption = event.target.checked
    chrome.storage.local.set({ ccOption })
    sendOptionsToContentScript()
  })

  document.getElementById('yOption').addEventListener('change', function (event) {
    yOption = event.target.checked
    chrome.storage.local.set({ yOption })
    sendOptionsToContentScript()
  })

  fetchAds()
}

window.initYoutubePopup = initYoutubePopup
