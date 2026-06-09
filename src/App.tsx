import { useState, useEffect } from "react";
import { Paper } from "./types";
import PaperList from "./components/PaperList";
import IngestionPanel from "./components/IngestionPanel";
import SummaryViewer from "./components/SummaryViewer";
import ActiveChat from "./components/ActiveChat";
import { Sparkles, BrainCircuit, Info, Github, Library, Terminal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Load papers on mount
  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/papers");
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
        // Pick first paper as active selected if nothing selected yet
        if (data.papers && data.papers.length > 0 && !selectedPaperId) {
          setSelectedPaperId(data.papers[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load papers", err);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSelectPaper = (id: string | null) => {
    setSelectedPaperId(id);
    setIsIngesting(false);
  };

  const handleAddNewClick = () => {
    setIsIngesting(true);
    setSelectedPaperId(null);
  };

  const handleCancelIngestion = () => {
    setIsIngesting(false);
    if (papers.length > 0) {
      setSelectedPaperId(papers[0].id);
    }
  };

  // Triggers API Call to Parse and Summarize PDF
  const handleIngestPaper = async (payload: {
    pdfData?: string;
    paperText?: string;
    customInstructions?: string;
  }) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || "Failed to parse and synthesize paper summaries.");
      }

      const data = await res.json();

      if (data.success && data.summary) {
        const summary = data.summary;

        // Default status and timestamp
        const newPaper: Partial<Paper> = {
          ...summary,
          readStatus: "Read Deeply", // start with read deeply as default
          notes: "", // empty initial notes
        };

        // File/Save paper into server storage
        const saveRes = await fetch("/api/papers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPaper),
        });

        if (saveRes.ok) {
          const saveData = await saveRes.json();
          const savedPaper = saveData.paper as Paper;

          // Add to local state
          setPapers((prev) => [savedPaper, ...prev]);
          setSelectedPaperId(savedPaper.id);
          setIsIngesting(false);
        } else {
          throw new Error("Summary generated, but failing to file into library database.");
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Save/Update Paper changes (notes, tag additions, status edits)
  const handleUpdatePaper = async (updated: Paper) => {
    try {
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setPapers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch (e) {
      console.error("Failed to update paper", e);
    }
  };

  // Delete Paper
  const handleDeletePaper = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this paper and summary from your database?")) {
      return;
    }

    try {
      const res = await fetch(`/api/papers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const nextPapers = papers.filter((p) => p.id !== id);
        setPapers(nextPapers);
        setSelectedPaperId(nextPapers.length > 0 ? nextPapers[0].id : null);
        setIsChatOpen(false);
      }
    } catch (e) {
      console.error("Failed to delete paper", e);
    }
  };

  const selectedPaper = papers.find((p) => p.id === selectedPaperId);

  return (
    <div id="app" className="flex flex-col h-screen bg-[#0F1115] text-slate-200 select-none antialiased overflow-hidden font-sans">
      {/* Visual Workspace Clean Header */}
      <header className="h-14 bg-[#16191E] border-b border-[#ffffff10] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1 px-1.5 bg-indigo-600 text-white rounded font-serif italic text-base font-extrabold leading-none">
            Ψ
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">
              Personal Research Scholar
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">
              Workspace Triaging & Knowledge Archiving
            </p>
          </div>
        </div>

        {/* Gemini Engine Indicators */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold rounded font-mono border border-indigo-500/20">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            <span>GEMINI AI PROXY LIVE</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono font-semibold">
            UTC {new Date().toISOString().substring(11, 16)}
          </span>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Library Section (Fixed Width Sidebar) */}
        <aside className="w-80 shrink-0 border-r border-[#ffffff10]">
          <PaperList
            papers={papers}
            selectedPaperId={selectedPaperId}
            onSelectPaper={handleSelectPaper}
            onAddNewClick={handleAddNewClick}
            filterTag={filterTag}
            onSetFilterTag={setFilterTag}
            isLoadingList={isLoadingList}
            onRefreshList={fetchPapers}
          />
        </aside>

        {/* Right Active Panel */}
        <main className="flex-1 flex overflow-hidden bg-[#0F1115] relative">
          <AnimatePresence mode="wait">
            {isIngesting ? (
              // Ingest and uploading stage
              <motion.div
                key="ingest"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="flex-1 h-full bg-[#0F1115]"
              >
                <IngestionPanel
                  onIngest={handleIngestPaper}
                  onCancel={handleCancelIngestion}
                  isProcessing={isProcessing}
                />
              </motion.div>
            ) : selectedPaper ? (
              // Structured extraction template card view
              <motion.div
                key="summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex overflow-hidden bg-[#0F1115]"
              >
                {/* Visual Summary Sheet Column */}
                <div className="flex-1 h-full overflow-hidden">
                  <SummaryViewer
                    paper={selectedPaper}
                    onUpdatePaper={handleUpdatePaper}
                    onDeletePaper={handleDeletePaper}
                    onOpenChat={() => setIsChatOpen(!isChatOpen)}
                    isChatOpen={isChatOpen}
                  />
                </div>

                {/* AI Interactive chat sidebar */}
                <AnimatePresence>
                  {isChatOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "360px", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="h-full shrink-0 z-10 shadow-2xl"
                    >
                      <ActiveChat
                        paper={selectedPaper}
                        onClose={() => setIsChatOpen(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              // Default Landing Panel screen
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
              >
                <Library className="w-12 h-12 text-slate-500 stroke-[1.2] mb-3.5 animate-pulse" />
                <h2 className="text-base font-serif font-semibold text-slate-300 max-w-sm">
                  Welcome to Your Personal Research Base
                </h2>
                <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  Select an academic paper from the sidebar to view its synthesized schematic summaries, or click Ingest to import a new piece.
                </p>
                <button
                  onClick={handleAddNewClick}
                  className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow-lg shadow-indigo-500/10 transition-all hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  Ingest First Research Paper
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
