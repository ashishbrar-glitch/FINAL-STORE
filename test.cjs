const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The closing div of each view is usually followed by `    );` and then `  }`
// We want to insert `{globalOverlays}` before the closing `    </div>\n    );` for specific views.

const views = ["order", "cart", "library", "library-summary"];
views.forEach(view => {
    const searchStr = `if (currentView === "${view}") {`;
    const startIndex = code.indexOf(searchStr);
    if (startIndex !== -1) {
        // find the matching closing brace for this if statement?
        // it's easier to find the next `  }`
        let endIndex = code.indexOf('  }', startIndex);
        
        // Find the `    </div>` before `endIndex`
        let divIndex = code.lastIndexOf('    </div>', endIndex);
        if (divIndex !== -1 && divIndex > startIndex) {
            code = code.substring(0, divIndex) + '      {globalOverlays}\n' + code.substring(divIndex);
        }
    }
});

fs.writeFileSync('src/App.tsx', code);
