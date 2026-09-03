const fs = require('fs');
const file = 'src/components/admin/AdminProductModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add submitMode state and error state
const stateTarget = `const [isGeneratingImage, setIsGeneratingImage] = useState(false);`;
const stateReplacement = `const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [submitMode, setSubmitMode] = useState<'original' | 'generated' | 'existing'>('existing');
  const [errorMsg, setErrorMsg] = useState("");`;
content = content.replace(stateTarget, stateReplacement);

// 2. Fix handleSubmit
const submitTarget = `const handleSubmit = async (mode: 'original' | 'generated' | 'existing') => {
    if (!name || !price || !category) {
      alert("Please fill in all required fields (Name, Price, Category)");
      return;
    }
    
    setLoading(true);
    setUploadStatus("Starting upload...");`;

const submitReplacement = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (price === '' || price === null || price === undefined) {
      setErrorMsg("Please enter a valid price");
      return;
    }
    
    setLoading(true);
    setUploadStatus("Starting upload...");
    const mode = submitMode;`;
content = content.replace(submitTarget, submitReplacement);

// 3. Update form tag
const formTarget = `<form className="space-y-6">`;
const formReplacement = `<form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {errorMsg}
              </div>
            )}`;
content = content.replace(formTarget, formReplacement);

// 4. Update buttons
content = content.replace(
  `<button type="button" onClick={() => handleSubmit('original')}`,
  `<button type="submit" onClick={() => setSubmitMode('original')}`
);
content = content.replace(
  `<button type="button" onClick={() => handleSubmit('generated')}`,
  `<button type="submit" onClick={() => setSubmitMode('generated')}`
);
content = content.replace(
  `<button type="button" onClick={() => handleSubmit('existing')}`,
  `<button type="submit" onClick={() => setSubmitMode('existing')}`
);

fs.writeFileSync(file, content);
console.log("Patched validation and submit!");
