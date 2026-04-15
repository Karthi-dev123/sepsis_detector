import { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function FileUpload({ onFileAnalyzed, isLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  // Validate file type
  function isValidFileType(file) {
    const validTypes = ['text/csv', 'text/plain'];
    const validExtensions = ['csv', 'psv'];
    const extension = file.name.split('.').pop().toLowerCase();
    return validTypes.includes(file.type) || validExtensions.includes(extension);
  }

  // Handle file selection
  function handleFileSelect(file) {
    setError('');
    if (!file) return;

    if (!isValidFileType(file)) {
      setError('Please upload a .csv or .psv file only.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  // Handle drag and drop
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  // Handle analyze click
  function handleAnalyze() {
    if (selectedFile && onFileAnalyzed) {
      onFileAnalyzed(selectedFile);
    }
  }

  // Handle file input change
  function handleFileInputChange(e) {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-teal-400 uppercase tracking-widest text-xs font-semibold mb-6">Patient Data Upload</h2>

      {!selectedFile && !isLoading ? (
        // Drag and drop zone
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-teal-500/40 hover:border-teal-400 rounded-xl p-12 text-center cursor-pointer transition bg-slate-700/20 hover:bg-slate-700/40"
        >
          <input
            type="file"
            id="file-input"
            accept=".csv,.psv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <label htmlFor="file-input" className="flex flex-col items-center gap-4 cursor-pointer">
            <Upload className="w-20 h-20 text-teal-400" strokeWidth={1.5} />
            <div>
              <p className="text-slate-100 font-medium text-lg">Drop patient vitals file here (.csv or .psv)</p>
              <p className="text-slate-400 text-sm mt-2">or click to select from device</p>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('file-input').click();
              }}
              className="mt-4 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition text-sm"
            >
              Choose File
            </button>
          </label>
        </div>
      ) : isLoading ? (
        // Loading state
        <div className="flex flex-col items-center justify-center py-16 bg-slate-700/20 rounded-xl border border-slate-700">
          <div className="animate-spin mb-4">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-teal-500 rounded-full"></div>
          </div>
          <p className="text-slate-200 font-medium">Analyzing vitals...</p>
          <p className="text-slate-500 text-xs mt-2">Running XGBoost model & SHAP analysis</p>
        </div>
      ) : (
        // File selected state
        <div className="bg-slate-700/20 rounded-xl p-8 border border-teal-500/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Upload className="w-8 h-8 text-teal-400" strokeWidth={2} />
              <p className="text-slate-100 font-medium break-all">{selectedFile.name}</p>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setError('');
              }}
              className="text-slate-400 hover:text-slate-100 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={handleAnalyze}
            className="w-full bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold py-3 rounded-lg transition active:scale-95"
          >
            Analyze Patient Data
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-700/50 rounded-lg p-4 flex items-start gap-3 backdrop-blur-sm">
          <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></div>
          <p className="text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
