const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetState = `  const [currentView, setCurrentView] = useState<View>("home");`;
const newState = `  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentView, setCurrentView] = useState<View>("home");`;

if (content.includes(targetState) && !content.includes('const [isOnline')) {
  content = content.replace(targetState, newState);
}

const targetEffect = `  useEffect(() => {
    // --- DB SYNC START ---`;
    
const newEffect = `  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // --- DB SYNC START ---`;

if (content.includes(targetEffect) && !content.includes('handleOnline')) {
  content = content.replace(targetEffect, newEffect);
}

fs.writeFileSync(file, content);
