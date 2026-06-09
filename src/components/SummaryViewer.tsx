import React, { useState, useEffect } from "react";
import { Paper, TabName } from "../types";
import {
  BookOpen,
  Calendar,
  Award,
  Copy,
  Check,
  Trash2,
  Tag,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Activity,
  Award as AwardIcon,
  Plus,
  X,
  PlusCircle,
} from "lucide-react";

interface SummaryViewerProps {
  paper: Paper;
  onUpdatePaper: (updated: Paper) => Promise<void>;
  onDeletePaper: (id: string) => Promise<void>;
  onOpenChat: () => void;
  isChatOpen: boolean;
}

export default function SummaryViewer({
  paper,
  onUpdatePaper,
  onDeletePaper,
  onOpenChat,
  isChatOpen,
}: SummaryViewerProps) {
  const [activeTab, setActiveTab] = useState<TabName>("core");
  const [isCopied, setIsCopied] = useState(false);
  const [localNotes, setLocalNotes] = useState(paper.notes || "");
  const [newTagStr, setNewTagStr] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Sync internal notes state when paper changes
  useEffect(() => {
    setLocalNotes(paper.notes || "");
  }, [paper.id, paper.notes]);

  const handleStatusChange = async (newStatus: Paper["readStatus"]) => {
    await onUpdatePaper({
      ...paper,
      readStatus: newStatus,
    });
  };

  const handleSaveNotes = async () => {
    await onUpdatePaper({
      ...paper,
      notes: localNotes,
    });
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagStr.trim().toLowerCase();
    if (!tag) return;

    const formattedTag = tag.startsWith("#") ? tag : `#${tag}`;
    if (paper.tags.includes(formattedTag)) {
      setNewTagStr("");
      setShowTagInput(false);
      return;
    }

    const updatedTags = [...paper.tags, formattedTag];
    await onUpdatePaper({
      ...paper,
      tags: updatedTags,
    });
    setNewTagStr("");
    setShowTagInput(false);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = paper.tags.filter((t) => t !== tagToRemove);
    await onUpdatePaper({
      ...paper,
      tags: updatedTags,
    });
  };

  // Compile full markdown template
  const compileMarkdown = () => {
    return `### Bibliographic & Filing
- **Title:** ${paper.title}
- **Authors:** ${paper.authors?.join(", ")}
- **Year:** ${paper.year}
- **Journal/Conference:** ${paper.journal}
- **Read Status:** ${paper.readStatus}
- **Confidence Score:** ${paper.confidenceScore}/5
- **Tags:** ${paper.tags?.join(", ")}

### Core Distillation
- **One-Liner summary:** ${paper.oneLiner}

- **Problem Statement:** 
  ${paper.problemStatement}

- **Core Contribution / Key Idea:** 
  ${paper.coreContribution}

### Methodology in Brief
${paper.methodology}

### Key Results & Evidence
${paper.keyResults?.map((r) => `- [x] ${r}`).join("\n")}

### Critical Analysis & Connections
- **Limitations & Critiques:**
${paper.limitations?.map((l) => `- ${l}`).join("\n")}

- **Future Directions & Concept Spars:**
${paper.futureWork?.map((f) => `- ${f}`).join("\n")}

### Personal Research Notes
${paper.notes || "(No personal notes saved yet)"}
`;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(compileMarkdown());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getStatusBgColor = (status: Paper["readStatus"]) => {
    switch (status) {
      case "Read Deeply":
        return "bg-emerald-600 hover:bg-emerald-500 text-white";
      case "Skim":
        return "bg-indigo-600 hover:bg-indigo-500 text-white";
      case "Archived":
        return "bg-slate-700 hover:bg-[#2A2B36] text-slate-200";
      case "Discarded":
        return "bg-rose-600 hover:bg-rose-500 text-white";
      default:
        return "bg-[#16191E] border border-white/10 text-slate-100";
    }
  };

  return (
    <div id="summary-viewer-container" className="flex flex-col h-full bg-[#0F1115] text-slate-200 text-left">
      {/* Scrollable Workspace */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {/* Paper Bibliographic Header */}
        <div className="space-y-4 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-white max-w-2xl leading-tight">
              {paper.title}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg transition-all"
                title="Copy full summary as Markdown"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Markdown</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onDeletePaper(paper.id)}
                className="p-2 border border-white/10 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-slate-500 transition-colors"
                title="Delete from My Library"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Authors List */}
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans max-w-4xl">
            <span className="font-semibold text-slate-300">By:</span> {paper.authors?.join(", ")}
          </p>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Published: <strong className="text-slate-300">{paper.year}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Venue: <strong className="text-slate-300">{paper.journal || "Unknown"}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500/90" />
              <span>AI Fit Confidence: <strong className="text-slate-300">{paper.confidenceScore}/5</strong></span>
            </div>
          </div>

          {/* Interactive Tags Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0 self-center" />
            {paper.tags?.map((tag) => (
              <span
                key={tag}
                className="group flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-medium bg-[#16191E] text-slate-300 border border-white/5 rounded"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all ml-1"
                  title="Remove tag"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            {showTagInput ? (
              <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="tag-name"
                  value={newTagStr}
                  onChange={(e) => setNewTagStr(e.target.value)}
                  autoFocus
                  className="px-1.5 py-0.5 border border-white/10 focus:border-indigo-500 focus:outline-none rounded text-[10px] font-mono leading-none w-20 bg-[#1A1D23] text-slate-200"
                />
                <button type="submit" className="text-slate-300 hover:text-white text-xs font-bold">
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTagInput(false);
                    setNewTagStr("");
                  }}
                  className="text-slate-500 hover:text-rose-400 text-xs"
                >
                  ✕
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#16191E] hover:bg-white/5 border border-white/10 text-slate-400 font-mono rounded-md"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Add Tag</span>
              </button>
            )}
          </div>
        </div>

        {/* Phase 3 Smart Workspace Triage Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#16191E] p-5 border border-white/10 rounded-xl">
          {/* Classification Selection */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
              Triage / Read Status
            </label>
            <div className="relative">
              <select
                value={paper.readStatus}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className={`w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/5 shadow-sm focus:outline-none transition-all cursor-pointer ${getStatusBgColor(
                  paper.readStatus
                )}`}
              >
                <option value="Read Deeply" className="bg-[#16191E] text-slate-200">Read Deeply (Full Study)</option>
                <option value="Skim" className="bg-[#16191E] text-slate-200">Skim (Core Highlights)</option>
                <option value="Archived" className="bg-[#16191E] text-slate-200">Archived (Filed Reference)</option>
                <option value="Discarded" className="bg-[#16191E] text-slate-200">Discarded (Irrelevant)</option>
              </select>
            </div>
          </div>

          {/* Personal Learnings Notes */}
          <div className="md:col-span-2 space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
                My Learnings & Ideas (Filing Notes)
              </label>
              <button
                onClick={handleSaveNotes}
                className="text-[10px] text-indigo-400 font-bold font-mono hover:text-indigo-300"
              >
                [Save Notes]
              </button>
            </div>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="What did you learn from this paper? Jots down notes, mathematical insights, or project links to tie this paper persistently..."
              rows={2}
              className="w-full text-xs p-2 border border-white/10 focus:border-indigo-500 focus:outline-none bg-[#1A1D23] text-slate-200 rounded-lg font-sans leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Tab Interface */}
        <div className="flex border-b border-white/5 font-mono">
          <button
            onClick={() => setActiveTab("core")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
              activeTab === "core"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Core Distillation
          </button>
          <button
            onClick={() => setActiveTab("methodology")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
              activeTab === "methodology"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Methodology & Outcomes
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all -mb-px ${
              activeTab === "analysis"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Critical Review
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-2 text-left space-y-6">
          {activeTab === "core" && (
            <div className="space-y-6">
              {/* One Liner quote */}
              <div className="pl-4 border-l-4 border-indigo-500 py-3.5 bg-[#16191E] rounded-r-xl">
                <p className="text-sm md:text-base font-serif italic text-slate-200 leading-relaxed font-semibold">
                  "{paper.oneLiner}"
                </p>
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider font-bold mt-1.5 block">
                  One-Sentence Essence Summary
                </span>
              </div>

              {/* Problem Statement */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
                  Problem Statement & Literature Gap
                </h3>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-sans bg-[#16191E] border border-white/5 p-4 rounded-xl shadow-md">
                  {paper.problemStatement}
                </p>
              </div>

              {/* Core Contribution */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <h3 className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
                    Core Contribution & Proposed Metatheory
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl shadow-md">
                  {paper.coreContribution}
                </p>
              </div>
            </div>
          )}

          {activeTab === "methodology" && (
            <div className="space-y-6">
              {/* Methodology brief */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
                  Methodology & Experimental Architecture
                </h3>
                <p className="text-xs md:text-sm text-slate-300 bg-[#16191E] border border-white/5 p-4 rounded-xl leading-relaxed shadow-sm">
                  {paper.methodology}
                </p>
              </div>

              {/* Key Results Checklist */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
                    Key Findings & Quantitative Evidence
                  </h3>
                </div>
                <div className="space-y-2">
                  {paper.keyResults?.map((result, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-2.5 shadow-md text-xs md:text-sm text-emerald-300/90 leading-relaxed"
                    >
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "analysis" && (
            <div className="space-y-6">
              {/* Stated & Inferred Limitations */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
                    Stated Caveats & Potential Weaknesses (AI Critical Review)
                  </h3>
                </div>
                <div className="space-y-2">
                  {paper.limitations?.map((lim, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-2.5 shadow-md text-xs md:text-sm text-rose-300/90 leading-relaxed"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Future Directions */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-[10px] font-bold tracking-wider font-mono text-slate-500 uppercase">
                    Future Research Paths & Concept Sparks
                  </h3>
                </div>
                <div className="space-y-2">
                  {paper.futureWork?.map((fw, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2.5 shadow-md text-xs md:text-sm text-indigo-200/90 leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2"></span>
                      <span>{fw}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Workspace Workspace Action Footer */}
      <div className="p-4 border-t border-white/10 bg-[#16191E] flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">
          Saved in database on {new Date(paper.createdAt).toLocaleDateString()}
        </span>
        <button
          onClick={onOpenChat}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            isChatOpen
              ? "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {isChatOpen ? "Close AI Reading partner" : "Open Active Reading Partner"}
        </button>
      </div>
    </div>
  );
}
