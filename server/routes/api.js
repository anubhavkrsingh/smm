// routes/api.js
const express = require('express');
const router = express.Router();

const { generateContent } = require('../services/genAI'); // already in your code
const { saveScheduledPost , saveImmediatePost} = require('../services/scheduler'); // ⬅️ add this import

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
    if (!content || (!content.text && !content.mediaUrl)) {
      return res.status(400).json({ error: 'Content with text or mediaUrl is required.' });
    }

    // Build caption and normalize
    const caption = [content.text, content.hashtags].filter(Boolean).join('\n\n');

    let scheduledAt = null;
    if (scheduleTime) {
      const dt = new Date(scheduleTime); // accepts `YYYY-MM-DDTHH:mm` from <input type="datetime-local">
      if (isNaN(dt.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduleTime.' });
      }
      scheduledAt = dt;
    }

    const payload = {
      imageUrl: content.mediaUrl || null,
      caption: caption || null,
      facebookAccessToken: accessToken,
      pageId,
      status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      scheduledAt,
    };

    const saved = await saveScheduledPost(payload);

    // Return a trimmed response (avoid echoing token)
    return res.json({
      id: saved.id,
      pageId: saved.pageId,
      status: saved.status,
      scheduledAt: saved.scheduledAt,
      createdAt: saved.createdAt,
      imageUrl: saved.imageUrl,
      caption: saved.caption,
    });
  } catch (err) {
    console.error('schedule-post error:', err);
    return res.status(500).json({ error: 'Failed to save scheduled post: ' + err.message });
  }
});

router.post('/post-to-facebook', async (req, res) => {
  const now = new Date(); // current server time for scheduledAt
  try {
    const { accessToken, pageId, content } = req.body;

    if (!accessToken || !pageId) {
      return res.status(400).json({ error: 'Page access token and Page ID are required.' });
    }
    if (!content || (!content.text && !content.mediaUrl)) {
      return res.status(400).json({ error: 'Content with text or mediaUrl is required.' });
    }

    const caption = [content.text, content.hashtags].filter(Boolean).join('\n\n');

    const saved = await saveImmediatePost({
      imageUrl: content.mediaUrl || null,
      caption: caption || null,
      facebookAccessToken: accessToken,
      pageId,
      scheduledAt: now,
      status: 'POSTED',
    });

    return res.json({
      message: 'Saved to SQL as POSTED (save-only).',
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
    console.error('post-to-facebook save-only error:', err);
    return res.status(500).json({ error: 'Failed to save immediate post: ' + err.message });
  }
});

module.exports = router;
