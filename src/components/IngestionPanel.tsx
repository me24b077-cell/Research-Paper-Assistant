import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { UploadCloud, FileText, ArrowLeft, Sparkles, AlertTriangle, BookOpen } from "lucide-react";

interface IngestionPanelProps {
  onIngest: (payload: { pdfData?: string; paperText?: string; customInstructions?: string }) => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
}

const ACADEMIC_STEPS = [
  "Structuring digital document stream...",
  "Running token alignment benchmarks...",
  "Extracting author lists and citation venues...",
  "Isolating core problem statement...",
  "Distilling novel methodology and parameters...",
  "Aggregating key results & mathematical evidence...",
  "Critically inferring unstated limitations & loopholes...",
  "Validating semantic indices, proposing tags...",
  "Packaging structured PKM summary metadata..."
];

export default function IngestionPanel({ onIngest, onCancel, isProcessing }: IngestionPanelProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paperText, setPaperText] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  // loading state text cycler
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev < ACADEMIC_STEPS.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Handle drag events
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setErrorState(null);
      } else {
        setErrorState("Currently only PDF (.pdf) documents are natively parsed.");
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setErrorState(null);
      } else {
        setErrorState("Please select a valid academic PDF document.");
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Convert File to Base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result?.toString() || "";
        // Strip data prefix: data:application/pdf;base64,
        const base64Index = encoded.indexOf(";base64,");
        if (base64Index !== -1) {
          encoded = encoded.substring(base64Index + 8);
        }
        resolve(encoded);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async () => {
    setErrorState(null);
    if (activeTab === "file" && !selectedFile) {
      setErrorState("Please upload a PDF file to begin.");
      return;
    }
    if (activeTab === "text" && !paperText.trim()) {
      setErrorState("Please paste the research paper text or abstract.");
      return;
    }

    try {
      if (activeTab === "file" && selectedFile) {
        const pdfBase64 = await convertFileToBase64(selectedFile);
        await onIngest({
          pdfData: pdfBase64,
          customInstructions: customInstructions.trim() || undefined,
        });
      } else {
        await onIngest({
          paperText: paperText.trim(),
          customInstructions: customInstructions.trim() || undefined,
        });
      }
    } catch (e: any) {
      setErrorState(e.message || "Failed to parse document. Please check your network and try again.");
    }
  };

  if (isProcessing) {
    return (
      <div id="loading-panel" className="flex flex-col items-center justify-center p-8 text-center h-full max-w-xl mx-auto">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
          <Sparkles className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h3 className="text-sm font-semibold tracking-wide uppercase font-mono text-slate-200 mb-1">
          Smart Triage Processing
        </h3>
        <p className="text-xs text-indigo-300 font-mono transition-all duration-300 min-h-[30px]">
          {ACADEMIC_STEPS[loadingStepIndex]}
        </p>
        <div className="w-48 bg-white/10 h-1 rounded-full overflow-hidden mt-4">
          <div
            className="bg-indigo-500 h-full transition-all duration-500 shadow-md shadow-indigo-500/20"
            style={{ width: `${((loadingStepIndex + 1) / ACADEMIC_STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-6 max-w-sm leading-relaxed">
          A full-stack call to Gemini Generative AI is being processed on the server-side proxy to parse complex paper structure, extract figures, and analyze limitations.
        </p>
      </div>
    );
  }

  return (
    <div id="ingestion-form" className="flex flex-col h-full overflow-y-auto max-w-2xl mx-auto p-6 md:p-8">
      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
          title="Back to workspace"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-serif font-semibold text-white">New Paper Ingestion</h2>
          <p className="text-xs text-slate-400">Provide an academic piece for instant AI synthesis and triage.</p>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-white/10 mb-6 font-mono">
        <button
          onClick={() => {
            setActiveTab("file");
            setErrorState(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
            activeTab === "file"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          PDF Document
        </button>
        <button
          onClick={() => {
            setActiveTab("text");
            setErrorState(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
            activeTab === "text"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          Pasted Text / Abstract
        </button>
      </div>

      {/* Ingestion Channels */}
      <div className="flex-1 space-y-6">
        {activeTab === "file" ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              isDragActive
                ? "border-indigo-500 bg-[#1E212E]"
                : selectedFile
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-white/10 hover:border-indigo-500/50 bg-[#16191E]"
            }`}
            onClick={triggerFileSelect}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf"
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full inline-block">
                  <BookOpen className="w-8 h-8" />
                </div>
                <p className="text-xs font-semibold text-slate-200 max-w-sm overflow-hidden text-ellipsis">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for parsing
                </p>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">
                  [Click to Change File]
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-[#1A1D23] text-indigo-400 rounded-full inline-block border border-white/5 shadow-inner">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-xs font-medium text-slate-300">
                  Drag and drop your research PDF here, or <span className="text-indigo-400 font-semibold underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-500">Supports standard academic PDFs (up to 50MB)</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
              Paper Text / Transcript
            </label>
            <textarea
              rows={8}
              placeholder="Paste raw research paper text, markdown content, or OCR transcript here..."
              value={paperText}
              onChange={(e) => setPaperText(e.target.value)}
              className="w-full p-4 text-xs border border-white/10 focus:border-indigo-500 focus:outline-none bg-[#16191E] text-slate-200 rounded-xl font-sans resize-y min-h-[150px] placeholder:text-slate-500"
            />
          </div>
        )}

        {/* Custom Instructions Lens */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <label className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
              Custom Research Lens (Optional)
            </label>
          </div>
          <input
            type="text"
            placeholder="Focus on specific aspects (e.g. 'Identify GPU parameters', 'Critique biological sample sizes')"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-[#16191E] border border-white/10 focus:border-indigo-500 focus:outline-none rounded-lg text-slate-200 placeholder:text-slate-500"
          />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Tell the AI model what you care about most. It will adjust the summaries to prioritize these details.
          </p>
        </div>

        {/* Errors display */}
        {errorState && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs flex items-start gap-2 text-left shadow-md">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorState}</span>
          </div>
        )}

        {/* Form Action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-white/10 hover:bg-white/5 text-slate-400 rounded-lg text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Initiate Smart Triage
          </button>
        </div>
      </div>
    </div>
  );
}
