const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\/\/ recommendations subscription removed\s*\};\s*\}, \[\]\);/s;
const replacement = `    return () => {
      unsubCats();
      unsubProds();
      unsubLearnings();
    };
  }, []);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
