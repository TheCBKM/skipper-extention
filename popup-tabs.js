document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'))
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(tab.dataset.tab).classList.add('active')
    if (tab.dataset.tab === 'youtube' && window.initYoutubePopup && !window.youtubePopupInitialized) {
      window.youtubePopupInitialized = true
      window.initYoutubePopup()
    }
  })
})
