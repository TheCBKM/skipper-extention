import lock from "./mutex.js";

//const host = "http://0.0.0.0:8080";
const host = "https://youtube-skip-ads-please-oregon.onrender.com";

function parseVideoId(url) {
  if (!url) return null;
  const urlObj = new URL(url);
  const urlParams = new URLSearchParams(urlObj.search);
  return urlParams.get("v");
}

async function invalidateLocalStorage() {
  const items = await chrome.storage.local.get(null);
  const keysToDelete = Object.entries(items)
    .filter(([key, value]) => {
      return (
        key.startsWith("yff-cached-video-ads") && value.expires < Date.now()
      );
    })
    .map(([key, _]) => key);
  await chrome.storage.local.remove(keysToDelete);
}

invalidateLocalStorage();

const fetchLock = lock();
async function fetchAds(videoId) {
  try {
    const cacheKey = `yff-cached-video-ads-v2-${videoId}`;
    const now = Date.now();
    const cachedData = await chrome.storage.local.get([cacheKey]);
    if (
      cachedData[cacheKey] &&
      cachedData[cacheKey].ads &&
      cachedData[cacheKey].userAds &&
      (cachedData[cacheKey].expires ?? 0) > now
    ) {
      return {
        ads: cachedData[cacheKey].ads,
        userAds: cachedData[cacheKey].userAds,
      };
    }

    console.log("Acquiring lock for videoId: ", videoId);
    const computedData = await fetchLock.acquire(videoId);
    // If the data was computed while we were waiting for the lock
    if (computedData) {
      console.log(
        "Data was computed while waiting for the lock: ",
        computedData
      );
      fetchLock.release(videoId, computedData);
      return computedData;
    }

    // If the data was not computed while we were waiting for the lock
    console.log("Lock acquired, fetching ads for videoId: ", videoId);
    const { words, timestamps, description } = await fetchCaptions(videoId);
    const response = await fetch(`${host}/adranges/auto-detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId,
        words,
        timestamps,
        description,
      }),
    });

    const data = await response.json();

    await chrome.storage.local.set({
      [cacheKey]: {
        ads: data.ads,
        userAds: data.userAds,
        expires: now + 1000 * 60 * 60 * 2,
        created: now,
      },
    });

    fetchLock.release(videoId, { ads: data.ads, userAds: data.userAds });
    return {
      ads: data.ads,
      userAds: data.userAds,
    };
  } catch (error) {
    console.log("Something went wrong while fetching ads ", error);
    fetchLock.release(videoId, { ads: [], userAds: [] });
    return {
      ads: [],
      userAds: [],
    };
  }
}

function notifyContentScriptAndPopup(tabId, videoId, popupCallback) {
  fetchAds(videoId)
    .then(async ({ ads, userAds }) => {
      try {
        await chrome.tabs.sendMessage(tabId, { ads, videoId });
      } catch (error) {
        console.log(
          "Something went wrong while notifying content script ",
          error
        );
      }
      if (popupCallback) {
        popupCallback({ videoId, ads, userAds });
      }
    })
    .catch((error) => {
      console.log(
        "Something went wrong while notifying content script and popup ",
        error
      );
    });
}

async function getCurrentTab() {
  let queryOptions = { active: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function requestData(request, sender, sendResponse) {
  getCurrentTab().then((tab) => {
    console.log("local tab", { tab });
  });
  console.log("requestData for tab", { tab: request.tab });
  const tab = request.tab;
  if (!tab) {
    console.log("tab is null");
    return;
  }
  if (!tab.url) {
    console.log("tab url is null");
    return;
  }
  if (!tab.url.includes("youtube.com/watch")) {
    console.log("tab url does not include 'youtube.com/watch'");
    return;
  }
  if (!tab.id) {
    console.log("tab id is null");
    return;
  }
  const videoId = parseVideoId(tab.url);
  if (!videoId) {
    console.log("videoId is null");
    return;
  }
  notifyContentScriptAndPopup(tab.id, videoId, sendResponse);
  return true;
}

chrome.runtime.onMessage.addListener(requestData);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  const videoId = parseVideoId(tab.url);
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com/watch") &&
    videoId
  ) {
    // NOTE: sometimes there are more than 1 fired events with "complete" status for the same url
    console.log("tab updated!", { tabId, changeInfo, tab });
    notifyContentScriptAndPopup(tabId, videoId);
  }
});

function tokenizeAndClean(sentence) {
  // Tokenize the sentence and remove non-letter characters
  const tokens = sentence
    .split(/[\s.,!?]+/)
    .map((token) => token.replace(/[^a-zA-Z]/g, ""));

  // Convert tokens to lowercase
  const cleanedTokens = tokens
    .filter((token) => token.length > 0)
    .map((token) => token.toLowerCase());

  return cleanedTokens;
}

function cleanTheDescription(description) {
  return description.replace(/\\n/g, ".");
}

function processSegment(segment, duration) {
  const splitSegment = [];
  segment.forEach((seg) => {
    const utf8s = tokenizeAndClean(seg.utf8);
    const tOffsetMs = seg.tOffsetMs ?? 0;
    const durationPerWord = duration / utf8s.length;
    utf8s.forEach((utf8, wordNo) => {
      splitSegment.push({
        utf8,
        tOffsetMs: tOffsetMs + Math.floor(durationPerWord * wordNo),
      });
    });
  });
  return splitSegment;
}

function changeQueryParameter(url, key, value) {
  const urlObj = new URL(url);
  const searchParams = new URLSearchParams(urlObj.search);
  searchParams.set(key, value);
  urlObj.search = searchParams.toString();
  return urlObj.toString();
}

async function fetchCaptions(videoId) {
  try {
    const fetchVideoResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    const data = await fetchVideoResponse.text();

    // Check if the video page contains captions
    if (!data.includes("captionTracks")) {
      throw new Error(`No captions found for video: ${videoId}`);
    }

    // Extract caption tracks JSON string from video page data
    const regex = /"captionTracks":(\[.*?\])/;
    const regexResult = regex.exec(data);

    if (!regexResult) {
      throw new Error(`Failed to extract captionTracks from video: ${videoId}`);
    }

    const [_, captionTracksJson] = regexResult;
    const captionTracks = JSON.parse(captionTracksJson);
    const captionsUrl = changeQueryParameter(
      `${captionTracks[0].baseUrl}&fmt=json3`,
      "lang",
      "en"
    );

    // fetch captions from captionsUrl
    const response = await fetch(captionsUrl);
    const responseJson = await response.json();
    const events = responseJson.events;
    const parseWordsAndTimestamps = events
      .map((event) =>
        processSegment(event.segs ?? [], event.dDurationMs ?? 0).map((seg) => [
          seg.utf8,
          (seg.tOffsetMs ?? 0) + (event.tStartMs ?? 0),
        ])
      )
      .flat();
    const words = parseWordsAndTimestamps.map((item) => item[0]);
    const timestamps = parseWordsAndTimestamps.map((item) => item[1]);

    //extract video description
    const pattern = /"shortDescription"\s*:\s*"((?:\\"|[^"])*)"/;
    const match = data.match(pattern);
    let description = "";
    if (match) {
      description = cleanTheDescription(match[1]);
      console.log("Description found: ", description);
    } else {
      console.log("Description not found.");
    }

    return { words, timestamps, description };
  } catch (error) {
    console.log("Failed to fetch captions and description", error);
    return { words: [], timestamps: [], description: "" };
  }
}
