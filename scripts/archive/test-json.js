const test1 = `\`\`\`json
{
  "prod1": ["prod2", "prod3"]
}
\`\`\``;

const test2 = `{
  "prod1": ["prod2", "prod3"]
}
Some extra explanation text`;

function parse(text) {
  let cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch(e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if(match) return JSON.parse(match[0]);
    throw e;
  }
}
console.log(parse(test1));
console.log(parse(test2));
