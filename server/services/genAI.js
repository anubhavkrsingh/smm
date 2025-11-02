// services/genAI.js
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEN_AI_API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Extracts multiple topics from a single prompt.
 * Supports formats like:
 * - "Generate post on these\n1 happy diwali\n2 happy new year\n3 chath puja"
 * - "- happy diwali\n- happy new year\n- chath puja"
 * Falls back to the entire prompt as a single topic if no list is detected.
 */
function extractTopics(input) {
  const lines = String(input || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Pull numbered or bulleted items
  const topics = lines
    .map(l => {
      let m = l.match(/^(\d+)[.)-]?\s+(.*)$/i); // "1 happy diwali" / "2) ..." / "3. ..."
      if (m && m[2]) return m[2].trim();
      m = l.match(/^[-*]\s+(.*)$/);            // "- happy diwali"
      if (m && m[1]) return m[1].trim();
      return null;
    })
    .filter(Boolean);

  if (topics.length) {
    // De-dup, trim, cap to 10 to avoid runaway token usage
    return Array.from(new Set(topics)).slice(0, 10);
  }

  // No list detected — try a soft split by commas/semicolons after "generate ... on/for/about ..."
  const soft = input.match(/(?:on|for|about)\s+(.+)/i)?.[1];
  if (soft) {
    const parts = soft.split(/[;,|]/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) return Array.from(new Set(parts)).slice(0, 10);
  }

  // Fallback: single topic (the whole prompt intent)
  return [input.trim()];
}

/**
 * Generates JSON-safe post for a given topic & platform.
 */
function buildPrompt(platform, topic, variantIndex) {
  return `You are creating a ${platform} post for the topic: "${topic}".
Return ONLY a JSON object with these exact fields:
- "text": a concise, engaging caption tailored to ${platform} (no emojis overload, 2-3 short lines max)
- "hashtags": a space-separated string of 5-10 relevant, trending hashtags (no '#facebook', no '#instagram')
- "mediaDescription": a vivid description for an image that fits the topic (no people’s faces unless implied by festival)

Rules:
- Do NOT wrap in backticks.
- Do NOT include extra keys.
- Variation number: ${variantIndex + 1}`;
}

/**
 * Normalizes Gemini response to raw JSON string.
 */
function extractJsonString(result) {
  // Keep compatibility with your existing .text usage
  let raw =
    result?.text ??
    result?.response?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') ??
    '';

  raw = String(raw).trim();
  // Strip code fences if any
  raw = raw.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  return raw;
}

/**
 * Generates three variations per topic. Flattens into a single array:
 * [{ topic, variant, text, hashtags, mediaUrl, mediaType, mediaDescription }, ...]
 */
const generateContent = async (prompt, platform) => {
  try {
    const topics = extractTopics(prompt);
    const cappedTopics = topics.slice(0, 10); // extra safety

    // Build all requests: 3 variants per topic
    const jobs = [];
    for (const topic of cappedTopics) {
      for (let v = 0; v < 2; v++) {
        const fullPrompt = buildPrompt(platform, topic, v);
        jobs.push({
          topic,
          variant: v + 1,
          promise: genAI.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7 + Math.random() * 0.2,
            },
          }),
        });
      }
    }

    // Run concurrently
    const results = await Promise.allSettled(jobs.map(j => j.promise));

    // Stitch back with topic/variant metadata
    const variations = results.map((res, idx) => {
      const meta = jobs[idx]; // contains topic & variant
      if (res.status !== 'fulfilled') {
        // Return a soft-failed placeholder so UI still renders
        return {
          topic: meta.topic,
          variant: meta.variant,
          text: `⚠️ Could not generate caption for "${meta.topic}" (variant ${meta.variant}).`,
          hashtags: '#generation #error',
          mediaDescription: `Placeholder for ${meta.topic}`,
          mediaType: 'image',
          mediaUrl: `https://via.placeholder.com/1024x1024.png?text=${encodeURIComponent(meta.topic.slice(0, 24))}`,
          _error: res.reason?.message || 'Unknown generation error',
        };
      }

      const jsonString = extractJsonString(res.value);
      let data;
      try {
        data = JSON.parse(jsonString);
      } catch (e) {
        // Fallback if model added stray text
        // Try to locate JSON block
        const m = jsonString.match(/\{[\s\S]*\}/);
        if (m) {
          data = JSON.parse(m[0]);
        } else {
          throw new Error('Failed to parse Gemini API response: ' + e.message);
        }
      }

      const text = String(data.text || '').trim();
      const hashtags = String(data.hashtags || '').trim();
      const mediaDescription = String(data.mediaDescription || meta.topic).trim();

      return {
        topic: meta.topic,
        variant: meta.variant,
        text,
        hashtags,
        mediaDescription,
        mediaType: 'image',
        // Keep your placeholder image approach; include topic for quick visual cue
        mediaUrl: `https://via.placeholder.com/1024x1024.png?text=${encodeURIComponent(
          `${meta.topic}`.slice(0, 30)
        )}`,
      };
    });

    return variations;
  } catch (error) {
    const errorMessage = error?.message || 'Unknown API error';
    throw new Error('Gemini API error: ' + errorMessage);
  }
};

module.exports = { generateContent };
