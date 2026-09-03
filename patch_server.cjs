const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const oldImageGen = `      const response = await getAiClient().models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1",
        }
      });
      const base64Image = response.generatedImages[0].image.imageBytes;
      res.json({ imageUrl: \`data:image/jpeg;base64,\${base64Image}\` });`;

const newImageGen = `      const response = await getAiClient().models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });
      
      let base64Image = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
      
      if (base64Image) {
        res.json({ imageUrl: \`data:image/png;base64,\${base64Image}\` });
      } else {
        throw new Error("No image returned from model");
      }`;

content = content.replace(oldImageGen, newImageGen);

fs.writeFileSync(file, content);
console.log("Patched server.ts with correct image generation model");
