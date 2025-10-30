// services/facebook.js
const axios = require('axios');

const GRAPH_VERSION = 'v21.0'; // keep in one place
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

/**
 * Posts a TEXT-ONLY update to the Page feed.
 * @returns { id, permalink_url }
 */
async function postTextNow({ pageId, accessToken, message }) {
  const url = `${BASE}/${encodeURIComponent(pageId)}/feed`;
  const { data } = await axios.post(url, null, {
    params: { message, access_token: accessToken },
  });
  // Fetch permalink
  const permalink = await getPermalink({ postId: data.id, accessToken });
  return { id: data.id, permalink_url: permalink };
}

/**
 * Posts an IMAGE (with optional caption). If you want it as a feed post, use /photos with 'published=true'.
 * @returns { id, permalink_url }
 */
async function postPhotoNow({ pageId, accessToken, imageUrl, caption }) {
  const url = `${BASE}/${encodeURIComponent(pageId)}/photos`;
  const { data } = await axios.post(url, null, {
    params: {
      url: imageUrl,
      caption: caption || '',
      published: true,           // post immediately
      access_token: accessToken,
    },
  });
  const permalink = await getPermalink({ postId: data.post_id || data.id, accessToken });
  return { id: data.post_id || data.id, permalink_url: permalink };
}

/**
 * Schedules a TEXT-ONLY post.
 * @param {Date} scheduledAt - JS Date (must be >= 10 minutes from now for FB scheduling)
 * @returns { id } scheduled post id
 */
async function scheduleText({ pageId, accessToken, message, scheduledAt }) {
  const url = `${BASE}/${encodeURIComponent(pageId)}/feed`;
  const scheduled_publish_time = Math.floor(new Date(scheduledAt).getTime() / 1000);
  const { data } = await axios.post(url, null, {
    params: {
      message,
      published: false,
      scheduled_publish_time,
      access_token: accessToken,
    },
  });
  return { id: data.id };
}

/**
 * Schedules an IMAGE post.
 * @returns { id } scheduled post id
 */
async function schedulePhoto({ pageId, accessToken, imageUrl, caption, scheduledAt }) {
  const url = `${BASE}/${encodeURIComponent(pageId)}/photos`;
  const scheduled_publish_time = Math.floor(new Date(scheduledAt).getTime() / 1000);
  const { data } = await axios.post(url, null, {
    params: {
      url: imageUrl,
      caption: caption || '',
      published: false,
      scheduled_publish_time,
      access_token: accessToken,
    },
  });
  // Photos API returns the photo id; for scheduled posts it’s fine—FB will create the post at time
  return { id: data.id };
}

/**
 * Fetch permalink for a post id (e.g. "12345_67890").
 */
async function getPermalink({ postId, accessToken }) {
  const url = `${BASE}/${encodeURIComponent(postId)}`;
  const { data } = await axios.get(url, {
    params: { fields: 'permalink_url', access_token: accessToken },
  });
  return data.permalink_url || null;
}

/**
 * Helper that decides TEXT vs PHOTO for "post now".
 */
async function postNowSmart({ pageId, accessToken, message, imageUrl }) {
  if (imageUrl) {
    return postPhotoNow({ pageId, accessToken, imageUrl, caption: message });
  }
  return postTextNow({ pageId, accessToken, message });
}

/**
 * Helper that decides TEXT vs PHOTO for "schedule".
 */
async function scheduleSmart({ pageId, accessToken, message, imageUrl, scheduledAt }) {
  if (imageUrl) {
    return schedulePhoto({ pageId, accessToken, imageUrl, caption: message, scheduledAt });
  }
  return scheduleText({ pageId, accessToken, message, scheduledAt });
}

module.exports = {
  postTextNow,
  postPhotoNow,
  postNowSmart,
  scheduleText,
  schedulePhoto,
  scheduleSmart,
  getPermalink,
};
