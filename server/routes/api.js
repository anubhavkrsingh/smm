const express = require('express');
const router = express.Router();
const { generateContent } = require('../services/genAI');

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

// Include other routes (post-to-facebook, schedule-post) as needed
module.exports = router;