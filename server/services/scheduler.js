// services/scheduler.js
const db = require('../models'); // make sure FbPost is exported from models/index.js

// Save scheduled post (used by /schedule-post)
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

// Save immediate (“post now”) entry (used by /post-to-facebook save-only)
async function saveImmediatePost({
  imageUrl = null,
  caption = null,
  facebookAccessToken,
  pageId,
  scheduledAt, // must be a Date
  status = 'POSTED',
}) {
  if (!facebookAccessToken) throw new Error('facebookAccessToken is required');
  if (!pageId) throw new Error('pageId is required');
  if (!(scheduledAt instanceof Date) || isNaN(scheduledAt.getTime())) {
    throw new Error('valid scheduledAt Date is required for immediate posts');
  }

  const allowed = ['POSTED', 'FAILED'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status "${status}" for immediate posts. Allowed: ${allowed.join(', ')}`);
  }

  const record = await db.FbPost.create({
    imageUrl: imageUrl || null,
    caption: caption ? String(caption).trim() : null,
    facebookAccessToken: String(facebookAccessToken).trim(),
    pageId: String(pageId).trim(),
    status,
    scheduledAt,
  });

  return record;
}

module.exports = {
  saveScheduledPost,
  saveImmediatePost, // <-- make sure this is exported
};
