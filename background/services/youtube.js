import lock from './mutex.js';
import {
  API_HOST,
  YOUTUBE_CACHE_PREFIX,
  YOUTUBE_CACHE_TTL_MS,
} from '../../core/constants.js';
import { MessageType, sendTabMessage } from '../../core/messaging.js';
import { createLogger } from '../../core/logger.js';

const log = createLogger('youtube-service');
const fetchLock = lock();

function parseVideoId(url) {
  if (!url) return null;
  try {
    const urlParams = new URL(url).searchParams;
    return urlParams.get('v');
  } catch {
    return null;
  }
}

async function invalidateLocalStorage() {
  const items = await chrome.storage.local.get(null);
  const keysToDelete = Object.entries(items)
    .filter(
      ([key, value]) =>
        key.startsWith('yff-cached-video-ads') && value?.expires < Date.now()
    )
    .map(([key]) => key);
  if (keysToDelete.length) {
    await chrome.storage.local.remove(keysToDelete);
  }
}

invalidateLocalStorage();

function tokenizeAndClean(sentence) {
  return sentence
    .split(/[\s.,!?]+/)
    .map((token) => token.replace(/[^a-zA-Z]/g, ''))
    .filter((token) => token.length > 0)
    .map((token) => token.toLowerCase());
}

function cleanTheDescription(description) {
  return description.replace(/\\n/g, '.');
}

function processSegment(segment, duration) {
  const splitSegment = [];
  for (const seg of segment) {
    const utf8s = tokenizeAndClean(seg.utf8);
    const tOffsetMs = seg.tOffsetMs ?? 0;
    const durationPerWord = duration / utf8s.length;
    utf8s.forEach((utf8, wordNo) => {
      splitSegment.push({
        utf8,
        tOffsetMs: tOffsetMs + Math.floor(durationPerWord * wordNo),
      });
    });
  }
  return splitSegment;
}

function changeQueryParameter(url, key, value) {
  const urlObj = new URL(url);
  urlObj.searchParams.set(key, value);
  return urlObj.toString();
}

async function fetchCaptions(videoId) {
  try {
    const fetchVideoResponse = await fetch(
      `https://www.youtube.com/watch?v=${videoId}`
    );
    const data = await fetchVideoResponse.text();

    if (!data.includes('captionTracks')) {
      throw new Error(`No captions found for video: ${videoId}`);
    }

    const regex = /"captionTracks":(\[.*?\])/;
    const regexResult = regex.exec(data);
    if (!regexResult) {
      throw new Error(`Failed to extract captionTracks from video: ${videoId}`);
    }

    const captionTracks = JSON.parse(regexResult[1]);
    const captionsUrl = changeQueryParameter(
      `${captionTracks[0].baseUrl}&fmt=json3`,
      'lang',
      'en'
    );

    const response = await fetch(captionsUrl);
    const responseJson = await response.json();
    const events = responseJson.events ?? [];
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

    const pattern = /"shortDescription"\s*:\s*"((?:\\"|[^"])*)"/;
    const match = data.match(pattern);
    const description = match ? cleanTheDescription(match[1]) : '';

    return { words, timestamps, description };
  } catch (error) {
    log.warn('Failed to fetch captions', error);
    return { words: [], timestamps: [], description: '' };
  }
}

async function fetchAds(videoId) {
  try {
    const cacheKey = `${YOUTUBE_CACHE_PREFIX}${videoId}`;
    const now = Date.now();
    const cachedData = await chrome.storage.local.get([cacheKey]);

    if (
      cachedData[cacheKey]?.ads &&
      cachedData[cacheKey]?.userAds &&
      (cachedData[cacheKey].expires ?? 0) > now
    ) {
      return {
        ads: cachedData[cacheKey].ads,
        userAds: cachedData[cacheKey].userAds,
      };
    }

    const computedData = await fetchLock.acquire(videoId);
    if (computedData) {
      fetchLock.release(videoId, computedData);
      return computedData;
    }

    const { words, timestamps, description } = await fetchCaptions(videoId);
    const response = await fetch(`${API_HOST}/adranges/auto-detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, words, timestamps, description }),
    });

    const data = await response.json();
    const result = { ads: data.ads ?? [], userAds: data.userAds ?? [] };

    await chrome.storage.local.set({
      [cacheKey]: {
        ...result,
        expires: now + YOUTUBE_CACHE_TTL_MS,
        created: now,
      },
    });

    fetchLock.release(videoId, result);
    return result;
  } catch (error) {
    log.error('Failed to fetch ads', error);
    fetchLock.release(videoId, { ads: [], userAds: [] });
    return { ads: [], userAds: [] };
  }
}

function notifyContentScript(tabId, videoId, popupCallback) {
  fetchAds(videoId)
    .then(async ({ ads, userAds }) => {
      await sendTabMessage(tabId, {
        type: MessageType.PROMO_RANGES,
        ads,
        videoId,
      });
      popupCallback?.({ videoId, ads, userAds });
    })
    .catch((error) => {
      log.error('Failed to notify content script', error);
      popupCallback?.({ videoId, ads: [], userAds: [], error: true });
    });
}

export function handleGetYoutubePromos(request, sendResponse) {
  const tab = request.tab;
  if (!tab?.url?.includes('youtube.com/watch') || !tab.id) {
    sendResponse({ ads: [], userAds: [] });
    return false;
  }

  const videoId = parseVideoId(tab.url);
  if (!videoId) {
    sendResponse({ ads: [], userAds: [], error: true });
    return false;
  }

  notifyContentScript(tab.id, videoId, sendResponse);
  return true;
}

export function initYoutubeTabWatcher() {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const videoId = parseVideoId(tab.url);
    if (
      changeInfo.status === 'complete' &&
      tab.url?.includes('youtube.com/watch') &&
      videoId
    ) {
      notifyContentScript(tabId, videoId);
    }
  });
}

export { parseVideoId, fetchAds };
