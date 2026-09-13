const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      });`;

const replacement = `      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });
      } catch (firstErr: any) {
        console.warn("Translation retry with gemini-2.5-pro...");
        response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });
      }`;

if(code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('server.ts', code);
    console.log("Added retry to translation.");
} else {
    console.log("Target not found.");
}
