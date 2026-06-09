import { useState } from "react";
import { Paper } from "../types";
import { Search, Tag, Calendar, Award, Plus, FolderOpen, RefreshCw, Layers } from "lucide-react";

interface PaperListProps {
  papers: Paper[];
  selectedPaperId: string | null;
  onSelectPaper: (id: string | null) => void;
  onAddNewClick: () => void;
  filterTag: string | null;
  onSetFilterTag: (tag: string | null) => void;
  isLoadingList: boolean;
  onRefreshList: () => void;
}

export default function PaperList({
  papers,
  selectedPaperId,
  onSelectPaper,
  onAddNewClick,
  filterTag,
  onSetFilterTag,
  isLoadingList,
  onRefreshList,
}: PaperListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"date" | "year" | "confidence">("date");

  // Get unique tags across all papers for the tag filter widget
  const allTags = Array.from(new Set(papers.flatMap((p) => p.tags || []))).sort();

  // Filter papers
  const filteredPapers = papers.filter((paper) => {
    const matchesSearch =
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.authors.some((auth) => auth.toLowerCase().includes(searchTerm.toLowerCase())) ||
      paper.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.oneLiner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || paper.readStatus === statusFilter;

    const matchesTag = !filterTag || paper.tags.includes(filterTag);

    return matchesSearch && matchesStatus && matchesTag;
  });

  // Sort papers
  const sortedPapers = [...filteredPapers].sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Newest first
    } else if (sortBy === "year") {
      return parseInt(b.year || "0") - parseInt(a.year || "0"); // Latest publication year first
    } else {
      return (b.confidenceScore || 0) - (a.confidenceScore || 0); // Highest confidence score first
    }
  });

  const getStatusBadgeClass = (status: Paper["readStatus"]) => {
    switch (status) {
      case "Read Deeply":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Skim":
        return "bg-indigo-500/15 text-indigo-300 border-indigo-500/20";
      case "Archived":
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
      case "Discarded":
        return "bg-rose-500/10 text-rose-400 line-through border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  return (
    <div id="paper-list-container" className="flex flex-col h-full bg-[#16191E] border-r border-white/10 text-slate-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-semibold tracking-wide uppercase font-mono text-slate-200">
              Research Base
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefreshList}
              disabled={isLoadingList}
              title="Refresh Library"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onAddNewClick}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-all shadow-md shadow-indigo-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              Ingest
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search papers, authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#1A1D23] text-slate-200 border border-white/10 focus:border-indigo-500 focus:outline-none rounded-lg transition-colors placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Filters (Status & Sort) */}
      <div className="px-4 py-2.5 border-b border-white/5 bg-[#1F232B]/30 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {["All", "Read Deeply", "Skim", "Archived", "Discarded"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2 py-1 text-[10px] font-medium rounded border transition-all shrink-0 ${
                statusFilter === status
                  ? "bg-[#1A1D23] text-indigo-400 border-indigo-500/50 shadow-sm"
                  : "bg-transparent text-slate-400 border-white/10 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-slate-400">
          <span className="font-mono text-slate-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-slate-300 font-medium focus:outline-none cursor-pointer"
          >
            <option value="date" className="bg-[#16191E] text-slate-200">Date Saved</option>
            <option value="year" className="bg-[#16191E] text-slate-200">Pub Year</option>
            <option value="confidence" className="bg-[#16191E] text-slate-200">Confidence</option>
          </select>
        </div>
      </div>

      {/* Tag Filtering Bar (Active Tag) */}
      {filterTag && (
        <div className="px-4 py-1.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-indigo-300">
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>Filtering: <strong className="font-mono text-indigo-200">{filterTag}</strong></span>
          </div>
          <button
            onClick={() => onSetFilterTag(null)}
            className="text-[10px] text-indigo-400 hover:text-indigo-200 font-medium font-mono"
          >
            [Clear]
          </button>
        </div>
      )}

      {/* Paper List Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-400" />
            <span className="text-xs">Refreshing research library...</span>
          </div>
        ) : sortedPapers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-48">
            <Layers className="w-8 h-8 stroke-[1.2] mb-2 text-slate-600" />
            <span className="text-xs font-medium text-slate-400">No archived papers found</span>
            <span className="text-[10px] mt-1 text-slate-500 max-w-[200px]">
              Try clearing filters or ingest a new article to start your base.
            </span>
          </div>
        ) : (
          sortedPapers.map((paper) => {
            const isSelected = selectedPaperId === paper.id;
            return (
              <div
                key={paper.id}
                onClick={() => onSelectPaper(paper.id)}
                className={`p-4 cursor-pointer text-left transition-all ${
                  isSelected
                    ? "bg-[#1F232B] border-l-2 border-indigo-500"
                    : "hover:bg-[#1A1D23]/50 border-l-2 border-transparent"
                }`}
              >
                {/* Score & Status */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono border rounded ${getStatusBadgeClass(
                      paper.readStatus
                    )}`}
                  >
                    {paper.readStatus}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[9px] text-slate-500">
                    <Award className="w-3 h-3 text-amber-500/80" />
                    <span>Conf: {paper.confidenceScore}/5</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 hover:text-white mb-1 font-serif leading-snug">
                  {paper.title}
                </h3>

                {/* Authors & Year */}
                <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                  {paper.authors?.join(", ")} • <span className="font-mono">{paper.year}</span>
                </p>

                {/* Tags */}
                {paper.tags && paper.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {paper.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetFilterTag(tag === filterTag ? null : tag);
                        }}
                        className={`px-1.5 py-0.5 text-[8px] font-mono rounded transition-colors ${
                          tag === filterTag
                            ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                            : "bg-[#1A1D23] text-slate-400 border border-white/5 hover:bg-white/10 hover:text-slate-200"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                    {paper.tags.length > 3 && (
                      <span className="text-[8px] font-mono text-slate-500 self-center">
                        +{paper.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Tag Cloud in Footer */}
      {allTags.length > 0 && (
        <div className="p-3 bg-[#131519] border-t border-white/10">
          <p className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold">
            Popular Tags
          </p>
          <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto">
            {allTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                onClick={() => onSetFilterTag(tag === filterTag ? null : tag)}
                className={`px-1.5 py-0.5 text-[9px] font-mono rounded-full border transition-all ${
                  tag === filterTag
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-[#1A1D23] text-slate-400 border border-white/10 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
