const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const headerTarget = `  const renderHeader = (
    title: string,
    onBack?: () => void,
    rightElement?: React.ReactNode,
  ) => (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 h-[51px] bg-[#0e783a] shadow-sm">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {title === "BCN Store" ? (
          <div className="bg-white rounded-xl px-2 py-1 shadow-sm">
            <img src="/logo.png" alt="BCN Store Logo" className="h-10 object-contain" />
          </div>
        ) : (
          <>
            {!onBack && (
              <div className="flex items-center justify-center w-10 h-10 bg-white text-[#0e783a] rounded-full font-bold text-xl">
                B
              </div>
            )}
            <div>`;

const headerReplacement = `  const renderHeader = (
    title: string,
    onBack?: () => void,
    rightElement?: React.ReactNode,
    headerColor: string = "bg-[#0e783a]",
    iconTextColor: string = "text-[#0e783a]"
  ) => (
    <header className={\`sticky top-0 z-10 flex items-center justify-between px-4 h-[51px] \${headerColor} shadow-sm\`}>
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
        )}
        {title === "BCN Store" ? (
          <div className="bg-white rounded-xl px-2 py-1 shadow-sm">
            <img src="/logo.png" alt="BCN Store Logo" className="h-10 object-contain" />
          </div>
        ) : (
          <>
            {!onBack && (
              <div className={\`flex items-center justify-center w-10 h-10 bg-white \${iconTextColor} rounded-full font-bold text-xl\`}>
                B
              </div>
            )}
            <div>`;

if (code.includes(headerTarget)) {
  code = code.replace(headerTarget, headerReplacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched Header");
} else {
  console.log("Could not find header target string.");
}
