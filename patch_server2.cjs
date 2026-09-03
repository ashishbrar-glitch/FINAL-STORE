const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /const response = await getAiClient\(\)\.models\.generateImages\(\{[\s\S]*?res\.json\(\{ imageUrl: \`data:image\/jpeg;base64,\$\{base64Image\}\` \}\);/g;

const newImageGen = `const response = await getAiClient().models.generateContent({
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

content = content.replace(regex, newImageGen);

fs.writeFileSync(file, content);
console.log("Patched server.ts with regex");
