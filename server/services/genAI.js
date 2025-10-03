const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEN_AI_API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Generates three unique content variations for a given platform and prompt.
 * Uses Promise.all to fetch content concurrently for better performance.
 * @param {string} prompt - The user's creative prompt.
 * @param {string} platform - The target social media platform (e.g., 'facebook').
 * @returns {Array<Object>} An array of three content variation objects.
 */
const generateContent = async (prompt, platform) => {
  try {
    // No need to pre-initialize model; pass model name in generateContent
    const generatePostRequest = (iteration) => {
      const fullPrompt = `Generate a unique ${platform} post based on this prompt: "${prompt}". Return a JSON object with fields: "text" (post caption), "hashtags" (trending hashtags as a string), "mediaDescription" (description for an image or video). Variation number: ${iteration + 1}`;

      return genAI.models.generateContent({
        model: MODEL_NAME, // Specify model here
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7 + Math.random() * 0.2,
        },
      });
    };

    // Generate 3 variations concurrently
    const results = await Promise.all([
      generatePostRequest(0),
      generatePostRequest(1),
      generatePostRequest(2),
    ]);

    // Process the results
    const variations = results.map((result) => {
      let jsonString = result.text.trim();
      jsonString = jsonString.replace(/```(json)?/g, '').trim();

      let postData;
      try {
        postData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Failed to parse JSON string:', jsonString);
        throw new Error('Failed to parse Gemini API response: ' + parseError.message);
      }

      return {
        text: postData.text,
        hashtags: postData.hashtags,
        mediaUrl: `https://via.placeholder.com/1024x1024.png?text=${encodeURIComponent(postData.mediaDescription.substring(0, 30))}`,
        mediaType: 'image',
        mediaDescription: postData.mediaDescription,
      };
    });

    return variations;
  } catch (error) {
    const errorMessage = error.message || 'Unknown API error';
    throw new Error('Gemini API error: ' + errorMessage);
  }
};

module.exports = { generateContent };