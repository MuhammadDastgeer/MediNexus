import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  RefreshCw, 
  Eye, 
  ThumbsUp, 
  CheckSquare, 
  Edit2, 
  Trash2, 
  X,
  Calendar,
  Tag,
  FileText,
  Clock
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft';
  date: string;
  description?: string;
}

interface BlogsViewProps {
  posts?: BlogPost[];
  onSaveBlog?: (blog: any) => void;
  onDeleteBlog?: (id: string) => void;
  onRefresh: () => void;
}

export default function BlogsView({ 
  posts = [], 
  onSaveBlog, 
  onDeleteBlog, 
  onRefresh 
}: BlogsViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical Breakthroughs');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
  
  // Article reader modal state
  const [readingPost, setReadingPost] = useState<BlogPost | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    if (onSaveBlog) {
      onSaveBlog({
        id: currentId,
        title,
        category,
        description,
        status,
        date: formMode === 'add' ? new Date().toLocaleDateString() : undefined
      });
    }

    setIsFormOpen(false);
  };

  const handleOpenAdd = () => {
    setFormMode('add');
    setCurrentId(null);
    setTitle('');
    setCategory('Medical Breakthroughs');
    setDescription('');
    setStatus('Published');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setFormMode('edit');
    setCurrentId(post.id);
    setTitle(post.title || '');
    setCategory(post.category || 'Medical Breakthroughs');
    setDescription(post.description || '');
    setStatus(post.status || 'Published');
    setIsFormOpen(true);
  };

  const publishedCount = posts.filter(p => p.status === 'Published').length;
  const draftCount = posts.filter(p => p.status === 'Draft').length;

  const categories = [
    'Medical Breakthroughs',
    'Wellness & Lifestyle',
    'Hospital Updates',
    'Research & Clinical'
  ];

  const filtered = posts.filter((p) => {
    const matchSearch =
      (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

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
            onClick={handleOpenAdd}
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

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="blogs-kpis">
        {/* Total Blogs */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-semibold text-slate-405">Total Blogs</span>
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
          <div className="w-10 h-10 bg-emerald-50 text-emerald-550 rounded-xl flex items-center justify-center">
            <CheckSquare size={18} />
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-semibold text-slate-405">Drafts</span>
            <span className="text-2xl font-extrabold text-slate-800">{draftCount}</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        {/* Views */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Views</span>
            <span className="text-2xl font-extrabold text-slate-800">{posts.length * 42}</span>
          </div>
          <div className="w-10 h-10 bg-cyan-50 text-cyan-500 rounded-xl flex items-center justify-center">
            <Eye size={18} />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden" id="blogs-main-card">
        {/* Search / Filter Toolbar */}
        <div className="p-4 border-b border-slate-50 bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-[#007f6e] text-slate-700"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {(search || categoryFilter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter('All'); }}
                className="text-xs text-[#007f6e] hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search articles & logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#007f6e]"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center space-y-3" id="empty-book">
            <div className="w-14 h-14 bg-slate-50/50 rounded-full flex items-center justify-center text-slate-300">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">No blogs yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Click Create Blog Post to establish one!</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left text-slate-600">
              <thead className="bg-[#fcfdfe] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Article Title & Description</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Publish Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        post.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <div className="font-semibold text-slate-800 text-sm leading-tight mb-1">{post.title}</div>
                      <div className="text-slate-400 truncate max-w-xs">{post.description || 'No description written yet.'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Tag size={12} className="text-[#007f6e]" />
                        {post.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450 font-mono">
                      {post.date}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setReadingPost(post)}
                          className="p-1.5 rounded bg-slate-54 text-slate-600 hover:bg-slate-100"
                          title="View Article"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                          title="Edit Article"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => {
                            if(confirm("Are you sure you want to delete this blog post?")) {
                              if (onDeleteBlog) onDeleteBlog(post.id);
                            }
                          }}
                          className="p-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100"
                          title="Delete Article"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Blog Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 animate-pulse">
                <BookOpen size={15} className="text-[#007f6e]" />
                {formMode === 'add' ? 'Create Blog Post' : 'Edit Blog Publication'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Article Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advancements in Pediatric Vaccines"
                  className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-700"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Publish Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] text-slate-700"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Article Content / Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write clear paragraph description of the clinical insights, news, or lifestyle advice..."
                  className="w-full text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg focus:outline-none focus:border-[#007f6e] h-32 leading-relaxed"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-[#007f6e] text-white rounded-lg hover:bg-[#006657] font-bold"
                >
                  {formMode === 'add' ? 'Publish Article' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reader / Viewer Modal */}
      {readingPost && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-2xl w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-[#007f6e] uppercase tracking-wide bg-teal-50 px-2 py-1 rounded-md">
                {readingPost.category}
              </span>
              <button 
                onClick={() => setReadingPost(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-850 leading-tight">{readingPost.title}</h2>
                <div className="flex gap-4 text-[11px] text-slate-400 mt-2 font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {readingPost.date}
                  </span>
                  <span className={`font-semibold ${readingPost.status === 'Published' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    ● {readingPost.status}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl leading-relaxed text-sm text-slate-700 whitespace-pre-wrap font-sans">
                {readingPost.description || 'No description written yet.'}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#007f6e] bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <ThumbsUp size={12} />
                  <span>Recommend ({4 + Math.floor(Math.random() * 20)})</span>
                </button>
              </div>
              <button
                onClick={() => setReadingPost(null)}
                className="px-4 py-2 text-xs bg-[#007f6e] text-white rounded-lg hover:bg-[#006657] font-bold"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
