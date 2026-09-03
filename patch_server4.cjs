const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /console\.error\("Image Generation API Error:", error\);\s+res\.status\(500\)\.json\(\{ error: "Image generation failed", details: String\(error\) \}\);/g;
const replacement = `console.error("Image Generation API Error:", error);
      const errMsg = String(error);
      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        res.status(429).json({ error: "Image generation requires a Paid Tier Gemini API key. Please upgrade your API key in AI Studio.", details: errMsg });
      } else {
        res.status(500).json({ error: "Image generation failed", details: errMsg });
      }`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
