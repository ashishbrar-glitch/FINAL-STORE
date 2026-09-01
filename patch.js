const fs = require('fs');

function patchFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /if \(!\(err\?.code === 'resource-exhausted'[\s\S]*?catch \(e\) { console\.error\(e\); }\n\s*}/g,
    `console.error('Fetch error:', err);
      try {
        const snapshot = await getDocsFromCache(q);
        process(snapshot); // Wait, this needs to be specific. Let's not use regex for this.
      } catch(e) {}`
  );
}
