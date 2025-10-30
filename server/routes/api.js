// routes/api.js
const express = require('express');
const router = express.Router();

const { generateContent } = require('../services/genAI'); // already in your code
const { saveScheduledPost , saveImmediatePost} = require('../services/scheduler'); // ⬅️ add this import
const { postNowSmart, scheduleSmart } = require('../services/facebook'); // to post with image use this 
//const { postTextNow, scheduleText } = require('../services/facebook');


router.post('/generate-content', async (req, res) => {
  const { prompt, platform } = req.body;
  if (!prompt || !platform) {
    return res.status(400).json({ error: 'Prompt and platform are required' });
  }
  try {
    const content = await generateContent(prompt, platform);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate content: ' + error.message });
  }
});

/**
 * Save a scheduled post to SQL (no FB publish here).
 * body: { accessToken, pageId, content, scheduleTime }
 * content: { text, hashtags, mediaUrl?, mediaType?, mediaDescription? }
 */
router.post('/schedule-post', async (req, res) => {
  try {
    const { accessToken, pageId, content, scheduleTime } = req.body;

    // Basic validation
    if (!accessToken || !pageId) {
      return res.status(400).json({ error: 'Page access token and Page ID are required.' });
    }
    if (!content || (!content.text )) { //&& !content.mediaUrl
      return res.status(400).json({ error: 'Content with text or mediaUrl is required.' });
    }
    if (!scheduleTime) {
      return res.status(400).json({ error: 'scheduleTime is required for scheduling.' });
    }

    // ---- robust parsing for "YYYY-MM-DDTHH:mm", "YYYY-MM-DD HH:mm", or epoch millis ----
    let normalized = scheduleTime;
    if (typeof normalized === 'string') {
      normalized = normalized.trim();
      if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(normalized)) {
        normalized = normalized.replace(' ', 'T'); // support "YYYY-MM-DD HH:mm"
      }
    } else if (typeof normalized === 'number') {
      // allow epoch ms as number
      normalized = Number(normalized);
    }

    const dt = new Date(normalized);
    if (isNaN(dt.getTime())) {
      return res.status(400).json({ error: `Invalid scheduleTime: "${scheduleTime}". Use "YYYY-MM-DDTHH:mm" or epoch milliseconds.` });
    }

    // Facebook requires ~10 minutes lead time
    const leadMs = dt.getTime() - Date.now();
    if (leadMs < 10 * 60 * 1000) {
      return res.status(400).json({ error: 'scheduleTime must be at least 10 minutes in the future for Facebook scheduling.' });
    }

    // Build caption and normalize
    const caption = [content.text, content.hashtags].filter(Boolean).join('\n\n');

    const fbResp = await scheduleSmart({
      pageId,
      accessToken,
      message: caption || '',
     // imageUrl: content.mediaUrl || null,
      scheduledAt: dt,
    });

    const saved = await saveScheduledPost({
      imageUrl:  null, //content.mediaUrl || null,
      caption: caption || null,
      facebookAccessToken: accessToken,
      pageId,
      status: 'SCHEDULED',
      scheduledAt: dt,
      fbPostId: fbResp.id || null,
    });

    return res.json({
      message: 'Scheduled on Facebook and saved to SQL.',
      facebook: { id: fbResp.id },
      dbRecord: {
        id: saved.id,
        status: saved.status,
        scheduledAt: saved.scheduledAt,
        createdAt: saved.createdAt,
        imageUrl: saved.imageUrl,
        caption: saved.caption,
        pageId: saved.pageId,
      },
    });

  } catch (err) {
    console.error('schedule-post error:', err?.response?.data || err.message);
    // Try to save as FAILED if we can
    try {
      const { accessToken, pageId, content, scheduleTime } = req.body || {};
      if (accessToken && pageId && content) {
        await saveScheduledPost({
          imageUrl: null , //content.mediaUrl || null,
          caption: [content.text, content.hashtags].filter(Boolean).join('\n\n') || null,
          facebookAccessToken: accessToken,
          pageId,
          status: 'FAILED',
          scheduledAt: scheduleTime ? new Date(scheduleTime) : null,
          errorReason: err?.response?.data?.error?.message || err.message,
        });
      }
    } catch (_) {}
    return res.status(500).json({ error: 'Failed to schedule post: ' + (err?.response?.data?.error?.message || err.message) });
  }
});

router.post('/post-to-facebook', async (req, res) => {
  const now = new Date(); // current server time for scheduledAt
  try {
    const { accessToken, pageId, content } = req.body;

    if (!accessToken || !pageId) {
      return res.status(400).json({ error: 'Page access token and Page ID are required.' });
    }
    if (!content || (!content.text  )) { //&& !content.mediaUrl
      return res.status(400).json({ error: 'Content with text or mediaUrl is required.' });
    }

    const caption = [content.text, content.hashtags].filter(Boolean).join('\n\n');

    const fbResp = await postNowSmart({
      pageId,
      accessToken,
      message: caption || '',
    //  imageUrl: null,
    });

    const saved = await saveImmediatePost({
      imageUrl: null,
      caption: caption || null,
      facebookAccessToken: accessToken,
      pageId,
      scheduledAt: now,
      status: 'POSTED',
    });

    return res.json({
      message: 'Posted to Facebook and Saved to SQL .',
      dbRecord: {
        id: saved.id,
        status: saved.status,
        scheduledAt: saved.scheduledAt,
        createdAt: saved.createdAt,
        imageUrl: saved.imageUrl,
        caption: saved.caption,
        pageId: saved.pageId,
      },
    });
  }  catch (err) {
    console.error('post-to-facebook error:', err?.response?.data || err.message);
    // Try to save as FAILED if we can
    try {
      const { accessToken, pageId, content } = req.body || {};
      if (accessToken && pageId && content) {
        await saveImmediatePost({
          imageUrl: content.mediaUrl || null,
          caption: [content.text, content.hashtags].filter(Boolean).join('\n\n') || null,
          facebookAccessToken: accessToken,
          pageId,
          status: 'FAILED',
          errorReason: err?.response?.data?.error?.message || err.message,
        });
      }
    } catch (_) {}
    return res.status(500).json({ error: 'Failed to post to Facebook: ' + (err?.response?.data?.error?.message || err.message) });
  }
});

module.exports = router;
