const fs = require('fs');
let code = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));

code.storage = {
  rules: "storage.rules"
};

fs.writeFileSync('firebase.json', JSON.stringify(code, null, 2));
