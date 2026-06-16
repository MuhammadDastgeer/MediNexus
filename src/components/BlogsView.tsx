import React, { useState } from 'react';
import { BookOpen, Plus, Search, RefreshCw, Eye, ThumbsUp, CheckSquare } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft';
  date: string;
}

interface BlogsViewProps {
  posts?: BlogPost[];
  onAddBlog?: (title: string, category: string) => void;
  onRefresh: () => void;
}

export default function BlogsView({ posts = [], onAddBlog, onRefresh }: BlogsViewProps) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical Breakthroughs');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (onAddBlog) {
      onAddBlog(title, category);
    }
    setTitle('');
    setShowForm(false);
  };

  const publishedCount = posts.filter(p => p.status === 'Published').length;
  const draftCount = posts.filter(p => p.status === 'Draft').length;

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-[#f4f7f6] select-none text-slate-700" id="blogs-view-root">
      {/* Title block */}
      <div className="flex justify-between items-center" id="blogs-header">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight" id="blogs-title">Hospital Blogs & Articles</h1>
          <p className="text-xs text-slate-400 mt-0.5">Publish clinical insights, news briefings, and patient care tips.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-[#007f6e] hover:bg-[#006657] text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Create Blog Post</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 border border-slate-150 bg-white hover:bg-slate-50 text-[#007f6e] rounded-xl"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-5 space-y-4 shadow-sm max-w-lg">
          <h3 className="text-sm font-bold text-slate-800">New Publication</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Article Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
              >
                <option value="Medical Breakthroughs">Medical Breakthroughs</option>
                <option value="Wellness & Lifestyle">Wellness & Lifestyle</option>
                <option value="Hospital Updates">Hospital Updates</option>
                <option value="Research & Clinical">Research & Clinical</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs border border-slate-100 rounded-lg text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs bg-[#007f6e] text-white font-semibold rounded-lg hover:bg-[#006657]"
            >
              Publish Post
            </button>
          </div>
        </form>
      )}

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="blogs-kpis">
        {/* Total Blogs */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Blogs</span>
            <span className="text-2xl font-extrabold text-slate-800">{posts.length}</span>
          </div>
          <div className="w-10 h-10 bg-[#e6f4f1] text-[#007f6e] rounded-xl flex items-center justify-center">
            <BookOpen size={18} />
          </div>
        </div>

        {/* Published */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Published</span>
            <span className="text-2xl font-extrabold text-slate-800">{publishedCount}</span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <CheckSquare size={18} />
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Drafts</span>
            <span className="text-2xl font-extrabold text-slate-800">{draftCount}</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-bold">
            0
          </div>
        </div>

        {/* Views */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Views</span>
            <span className="text-2xl font-extrabold text-slate-800">0</span>
          </div>
          <div className="w-10 h-10 bg-cyan-50 text-cyan-500 rounded-xl flex items-center justify-center">
            <Eye size={18} />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="blogs-main-card">
        {/* Search tool */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-end">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-book">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No blogs yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Create your first blog!</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Rows list */}
          </div>
        )}
      </div>
    </div>
  );
}
