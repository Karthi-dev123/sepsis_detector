import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'

export default function FileUpload({ onAnalyze, loading, error, hasResult }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) setSelectedFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  function handleSubmit() {
    if (selectedFile) onAnalyze(selectedFile)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-4 h-4 text-teal-500" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Patient Data Upload
        </h2>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${dragging
            ? 'border-teal-400 bg-teal-50'
            : selectedFile
              ? 'border-teal-300 bg-teal-50'
              : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <div className="bg-teal-100 rounded-lg p-2">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB — Ready to analyze
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-slate-100 rounded-full p-3 w-fit mx-auto mb-3">
              <Upload className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Drop a patient CSV file here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 bg-red-50
                        border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Analyze Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || loading}
        className={`
          w-full mt-4 py-2.5 rounded-lg text-sm font-semibold
          transition-all duration-200 flex items-center justify-center gap-2
          ${!selectedFile || loading
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-teal-500 hover:bg-teal-600 text-white shadow-sm hover:shadow-md'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing vitals...
          </>
        ) : (
          'Analyze Patient'
        )}
      </button>
    </div>
  )
}