const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove isGeneratingImage state
content = content.replace(/const \[isGeneratingImage, setIsGeneratingImage\] = useState\(false\);\n/, '');

// Remove handleGenerateImage
const handleGenRegex = /const handleGenerateImage = async \(\) => \{[\s\S]*?finally \{\s*setIsGeneratingImage\(false\);\s*\}\s*\};\n/g;
content = content.replace(handleGenRegex, '');

// Remove the button
const buttonRegex = /<button\s+type="button"\s+onClick=\{handleGenerateImage\}[\s\S]*?<\/button>\s*/g;
content = content.replace(buttonRegex, '');

fs.writeFileSync(file, content);
console.log("Patched AdminProductModal.tsx");
