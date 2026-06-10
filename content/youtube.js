// const host = "http://0.0.0.0:8080";
const host = "https://youtube-skip-ads-please-oregon.onrender.com";

Element.prototype.remove = function () {
  this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
  for (var i = this.length - 1; i >= 0; i--) {
    if (this[i] && this[i].parentElement) {
      this[i].parentElement.removeChild(this[i]);
    }
  }
};

const adReports = {};
let ccOption = true;
let yOption = true;

chrome.storage.local.get(["ccOption", "yOption"]).then((result) => {
  ccOption = result.ccOption ?? true;
  yOption = result.yOption ?? true;
});

function skipYoutubeAdsOneIteration(ignoreYOption) {
  const playerContainer = document.querySelector("#movie_player");
  const isAd =
    playerContainer &&
    (playerContainer.classList.contains("ad-interrupting") ||
      playerContainer.classList.contains("ad-showing"));

  if (isAd && (yOption || ignoreYOption)) {
    const player = document.querySelector("video");
    const duration = player.duration;
    if (isFinite(duration)) {
      player.currentTime = duration;
    }
  }

  if (yOption || ignoreYOption) {
    document.querySelector(".ytp-ad-skip-button")?.click();
    document.querySelector(".ytp-ad-skip-button-modern")?.click();
    document.querySelector(".ytp-ad-survey")?.click();
    document.querySelector(".ytp-ad-skip-button-container")?.click();
  }

  return isAd && (yOption || ignoreYOption);
}

function mergeIntervals(intervals) {
  if (intervals.length === 0) {
    return [];
  }
  intervals.sort((a, b) => a.first - b.first);
  const mergedIntervals = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = mergedIntervals[mergedIntervals.length - 1];
    if (intervals[i].first <= last.second + 3) {
      last.second = Math.max(last.second, intervals[i].second);
    } else {
      mergedIntervals.push(intervals[i]);
    }
  }
  return mergedIntervals;
}

async function submitAdReports() {
  Object.entries(adReports).forEach(([videoId, reports]) => {
    const lastReported = reports[reports.length - 1].created;
    if (lastReported + 3_000 > Date.now()) {
      return;
    }
    delete adReports[videoId];
    const mergedReports = mergeIntervals(reports);
    console.log({ mergedReports });
    mergedReports.forEach((report) => {
      fetch(`${host}/adranges`, {
        method: "POST",
        body: JSON.stringify({
          start: report.first,
          end: report.second,
          videoId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            console.log("Ranges submitted successfully!");
            chrome.storage.local
              .set({
                [`yff-cached-video-last-write-${videoId}`]: Date.now(),
              })
              .then(() => {
                console.log("Cached last write time.");
              })
              .catch((error) => {
                console.log("Error caching last write time ", error);
              });
          } else {
            console.log("Ranges submission failed.", { response });
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
  });
}

async function runLoopOfTasks() {
  setInterval(() => skipYoutubeAdsOneIteration(false), 100);
}

let curVideoId = undefined;

function injectButton(videoId) {
  if (curVideoId === videoId) {
    return;
  }

  if (!!curVideoId) {
    const skipAdButton = document.getElementById("skip-ad-custom-button");
    if (!!skipAdButton) {
      skipAdButton.remove();
    }
  }

  curVideoId = videoId;

  // Create a style element and set its content
  const styleElement = document.createElement("style");
  styleElement.innerHTML = `
    #skip-ad-custom-button {
      width: auto;
    }
  `;

  // Append the style element to the document head
  document.head.appendChild(styleElement);

  // Create your custom button
  const skipAdButton = document.createElement("button");
  skipAdButton.id = "skip-ad-custom-button";
  skipAdButton.innerText = "Skip promo";

  // Find the "next video" button
  const nextButton = document.querySelector(".ytp-next-button");

  // Youtube's style for button
  skipAdButton.classList.add("ytp-play-button");
  skipAdButton.classList.add("ytp-button");

  // Insert your custom button next to the "next video" button
  nextButton.parentNode.insertBefore(skipAdButton, nextButton.nextSibling);

  // Handle button click event
  skipAdButton.addEventListener("click", function () {
    if (skipYoutubeAdsOneIteration(true)) {
      return;
    }
    const player = document.querySelector("video");
    const data = {
      first: Math.floor(player.currentTime),
      second: Math.floor(player.currentTime + 5),
      videoId: curVideoId,
    };
    player.currentTime += 5;
    if (!adReports[curVideoId]) {
      adReports[curVideoId] = [];
    }
    adReports[curVideoId].push({
      ...data,
      created: Date.now(),
    });
    setTimeout(() => {
      submitAdReports();
    }, 3_001);
  });
}

function getFastForwardingText() {
  const randomNumber = Math.floor(Math.random() * 10);
  if (randomNumber === 0) {
    return "buymeacoffee.com/soleh";
  } else {
    return "Fast forwarding the promo...";
  }
}

function attachFastForwardingText(videoPlayer) {
  if (document.getElementById("overlay-div")) {
    return;
  }

  if (videoPlayer) {
    // Get the position and size of the video player
    const videoRect = videoPlayer.getBoundingClientRect();

    // Calculate the center of the video player
    const centerX = videoRect.left + videoRect.width / 2;
    const centerY = videoRect.top + videoRect.height / 2;

    // Create a div element for the overlay
    const overlayDiv = document.createElement("div");
    overlayDiv.id = "overlay-div";
    overlayDiv.style.position = "absolute";
    overlayDiv.style.top = centerY + "px";
    overlayDiv.style.left = centerX + "px";
    overlayDiv.style.transform = "translate(-50%, -50%)";
    overlayDiv.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    overlayDiv.style.display = "flex";
    overlayDiv.style.justifyContent = "center";
    overlayDiv.style.alignItems = "center";
    overlayDiv.style.zIndex = "9999";

    // Create a paragraph element with the text
    const textElement = document.createElement("p");
    textElement.textContent = getFastForwardingText();
    textElement.style.fontSize = "28px";
    textElement.style.fontWeight = "bold";

    // Append the text element to the overlay div
    overlayDiv.appendChild(textElement);

    // Append the overlay div to the body
    document.body.appendChild(overlayDiv);
  }
}

function removeFastForwardingText() {
  const overlayDiv = document.getElementById("overlay-div");
  if (overlayDiv) {
    overlayDiv.remove();
  }
}

function adIsPlaying(ads, currentTime) {
  for (let i = 0; i < ads.length; i++) {
    if (ads[i].first <= currentTime && currentTime < ads[i].second - 2) {
      return true;
    }
  }
  return false;
}

function playerTimeUpdate(player, ads) {
  return () => {
    var currentTime = player.currentTime;
    if (ccOption && adIsPlaying(ads, currentTime)) {
      player.playbackRate = 12.0;
      player.muted = true;
      attachFastForwardingText(player);
    } else if (player.playbackRate === 12.0) {
      player.playbackRate = 1.0;
      player.muted = false;
      removeFastForwardingText();
    }
  };
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.isOption) {
    ccOption = request.ccOption;
    yOption = request.yOption;
    return;
  }
  const player = document.querySelector("video");
  player.ontimeupdate = playerTimeUpdate(player, request.ads);
  // injectButton(request.videoId);
});

runLoopOfTasks();
