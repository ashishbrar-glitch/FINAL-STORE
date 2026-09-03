const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      </div>
      {rightElement || (
        currentView !== "cart" && (`;
        
const newStr = `      </div>
      <div className="flex items-center gap-2">
        {!isOnline && (
          <div className="flex items-center gap-1 bg-red-500/20 text-red-100 px-2 py-1 rounded-full text-[10px] font-medium border border-red-500/30 whitespace-nowrap" title="Offline - Showing cached data">
            <WifiOff className="w-3 h-3" />
            <span className="hidden sm:inline">Offline</span>
          </div>
        )}
        {rightElement || (
          currentView !== "cart" && (`;
          
if (content.includes(targetStr) && !content.includes('WifiOff className')) {
  content = content.replace(targetStr, newStr);
  
  // also need to close the added div at the end of the header
  const endTarget = `          </div>
        )
      )}
    </header>`;
  
  const endNew = `          </div>
        )
      )}
      </div>
    </header>`;
    
  content = content.replace(endTarget, endNew);
  fs.writeFileSync(file, content);
  console.log("Patched successfully");
} else {
  console.log("Could not find target string");
}
