// services/scheduler.js
const db = require('../models'); //make sure FbPost is exported from models/index.js

/**
 * Persist a scheduled post.
 * @param {Object} payload
 * @param {string|null} payload.imageUrl
 * @param {string|null} payload.caption
 * @param {string} payload.facebookAccessToken
 * @param {string} payload.pageId
 * @param {'DRAFT'|'SCHEDULED'|'POSTED'|'FAILED'} payload.status
 * @param {Date|null} payload.scheduledAt
 */
async function saveScheduledPost({
  imageUrl = null,
  caption = null,
  facebookAccessToken,
  pageId,
  status = 'SCHEDULED',
  scheduledAt = null,
}) {
  if (!facebookAccessToken) throw new Error('facebookAccessToken is required');
  if (!pageId) throw new Error('pageId is required');

  const allowed = ['DRAFT', 'SCHEDULED', 'POSTED', 'FAILED'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status "${status}". Allowed: ${allowed.join(', ')}`);
  }

  // Optional light trims
  const record = await db.FbPost.create({
    imageUrl: imageUrl || null,
    caption: caption ? String(caption).trim() : null,
    facebookAccessToken: String(facebookAccessToken).trim(),
    pageId: String(pageId).trim(),
    status,
    scheduledAt: scheduledAt || null,
  });

  return record;
}

module.exports = {
  saveScheduledPost,
};
