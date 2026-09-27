const fs = require('fs');

async function main() {
  const data = fs.readFileSync('recs.json', 'utf8');
  const doc = JSON.parse(data);
  const relations = doc.fields.relations.mapValue.fields;

  for (const [key, value] of Object.entries(relations)) {
    console.log(key);
    const related = value.arrayValue.values || [];
    for (const rel of related) {
      console.log(`→ ${rel.stringValue}`);
    }
    console.log();
  }
}

main();
