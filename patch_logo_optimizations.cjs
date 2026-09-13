const fs = require('fs');

// 1. Patch index.html
let indexHtml = fs.readFileSync('index.html', 'utf-8');
const headEnd = '</head>';
const headReplacement = '    <link rel="preload" as="image" href="/logo.png" fetchpriority="high" />\n  </head>';
if (!indexHtml.includes('preload" as="image" href="/logo.png"')) {
    indexHtml = indexHtml.replace(headEnd, headReplacement);
    fs.writeFileSync('index.html', indexHtml);
}

// 2. Patch src/App.tsx
let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace header logo
const headerLogoOld = '<img src="/logo.png" alt="BCN Store Logo" className="h-8 sm:h-9 object-contain" />';
const headerLogoNew = '<img src="/logo.png" alt="BCN Store Logo" className="h-8 sm:h-9 object-contain" fetchPriority="high" loading="eager" />';
appTsx = appTsx.replace(headerLogoOld, headerLogoNew);

// Replace footer logo (can be lazy, but eager doesn't hurt much, we'll just add loading lazy as best practice since it's at the bottom)
const footerLogoOld = '<img src="/logo.png" alt="BCN Store Logo" className="h-14 w-auto mb-2 object-contain drop-shadow-sm" />';
const footerLogoNew = '<img src="/logo.png" alt="BCN Store Logo" className="h-14 w-auto mb-2 object-contain drop-shadow-sm" loading="lazy" />';
appTsx = appTsx.replace(footerLogoOld, footerLogoNew);

// Replace splash screen logo
const splashLogoOld = '<img src="/logo.png" alt="BCN Store Logo" className="h-24 w-auto object-contain" />';
const splashLogoNew = '<img src="/logo.png" alt="BCN Store Logo" className="h-24 w-auto object-contain" fetchPriority="high" loading="eager" />';
appTsx = appTsx.replace(splashLogoOld, splashLogoNew);

fs.writeFileSync('src/App.tsx', appTsx);
