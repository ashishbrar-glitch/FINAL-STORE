const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('WifiOff')) {
  content = content.replace('  Wifi,', '  Wifi,\n  WifiOff,');
  fs.writeFileSync(file, content);
}
