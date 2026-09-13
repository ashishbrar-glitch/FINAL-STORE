const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /        \{adminModals\}\n        \{globalOverlays\}\n      <\/div>\n    \);\n  \}/,
  '        {adminModals}\n        {globalOverlays}\n        {floatingCartFab}\n      </div>\n    );\n  }'
);

code = code.replace(
  /        <\/footer>\n      <\/main>\n      \{showInstallModal && \(/,
  '        </footer>\n      </main>\n      {floatingCartFab}\n      {showInstallModal && ('
);

fs.writeFileSync('src/App.tsx', code);
