const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /        <\/footer>\n      <\/main>\n\n      \{showInstallModal && \(/,
  '        </footer>\n      </main>\n      {floatingCartFab}\n\n      {showInstallModal && ('
);
fs.writeFileSync('src/App.tsx', code);
