import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  Tag, 
  ChevronRight,
  ArrowLeft,
  PenTool,
  Bookmark,
  RefreshCw,
  Clock,
  User,
  Sparkles
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  category: string;
  status: 'Published' | 'Draft';
  date: string;
  description?: string;
  summary?: string;
  author?: string;
  authorRole?: string;
  coverImage?: string;
}

interface BlogsViewProps {
  posts?: BlogPost[];
  onSaveBlog?: (blog: any) => void;
  onDeleteBlog?: (id: string) => void;
  onRefresh?: () => void;
  isReadOnly?: boolean;
  loggedInUser?: { role: 'patient' | 'doctor' | 'staff'; data: any } | null;
  onNavigate?: (view: any) => void;
}

const CATEGORIES = [
  'All Articles',
  'Medical Breakthroughs',
  'Health Tips',
  'Clinical Guidelines',
  'Hospital Bulletins',
  'Wellness & Care'
];

export default function BlogsView({
  posts = [],
  onSaveBlog,
  onDeleteBlog,
  onRefresh,
  isReadOnly = false,
  loggedInUser = null,
  onNavigate
}: BlogsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Articles');
  const [viewPost, setViewPost] = useState<BlogPost | null>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Medical Breakthroughs');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'Published' | 'Draft'>('Published');
  const [formAuthor, setFormAuthor] = useState('');
  const [formSummary, setFormSummary] = useState('');

  // Toast notification state
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAddForm = () => {
    setIsEditingId(null);
    setFormTitle('');
    setFormCategory('Medical Breakthroughs');
    setFormDescription('');
    setFormStatus('Published');
    setFormAuthor(loggedInUser?.data?.name || 'Medical Officer');
    setFormSummary('');
    setShowForm(true);
  };

  const handleOpenEditForm = (post: BlogPost) => {
    setIsEditingId(post.id);
    setFormTitle(post.title);
    setFormCategory(post.category);
    setFormDescription(post.description || '');
    setFormStatus(post.status);
    setFormAuthor(post.author || 'Medical Officer');
    setFormSummary(post.summary || '');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formDescription.trim()) {
      alert('Please fill out both Title and Core Article content.');
      return;
    }

    if (onSaveBlog) {
      onSaveBlog({
        id: isEditingId,
        title: formTitle,
        category: formCategory,
        description: formDescription,
        status: formStatus,
        date: isEditingId ? undefined : new Date().toLocaleDateString(),
        author: formAuthor,
        summary: formSummary
      });
      triggerToast(isEditingId ? '✓ Publication updated successfully.' : '✓ Publication created successfully.');
    }

    setShowForm(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you absolutely sure you want to delete "${title}"?`)) {
      if (onDeleteBlog) {
        onDeleteBlog(id);
        triggerToast('✓ Article has been removed.');
        if (viewPost?.id === id) {
          setViewPost(null);
        }
      }
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (post.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All Articles' || 
      post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div id="blogs-panel-view" className="space-y-6">
      
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-55 bg-slate-900 border border-emerald-500/35 text-white py-3 px-5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Area */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-[#007f6e] inline-block font-bold">
              <PenTool size={18} />
            </span>
            <span className="text-[10px] font-extrabold text-[#007f6e] uppercase tracking-widest bg-[#007f6e]/10 px-2.5 py-1 rounded-sm">
              Publishing Desk
            </span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Clinical Blog & Information Publication</h1>
          <p className="text-xs text-slate-400">Share informative articles, clinical breakthroughs, health tips, and notifications with colleagues and patients.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigate && (
            <button
              onClick={() => onNavigate('blogs-ai')}
              type="button"
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-[#007f6e] hover:from-emerald-700 hover:to-[#006657] text-[#ffffff] px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              id="trigger-blogs-ai"
            >
              <Sparkles size={14} className="animate-pulse" />
              <span>Blogs AI</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 text-slate-500 hover:text-[#007f6e] bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/40"
              title="Refresh database records"
            >
              <RefreshCw size={15} />
            </button>
          )}

          {!isReadOnly && !showForm && (
            <button
              onClick={handleOpenAddForm}
              className="px-4 py-2.5 bg-[#007f6e] hover:bg-[#006657] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer hover:shadow-md"
            >
              <Plus size={15} />
              <span>Add Publication</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW DETAILED ARTICLE STATE */}
        {viewPost ? (
          <motion.div
            key="post-details"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-6"
          >
            <button
              onClick={() => setViewPost(null)}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
            >
              <ArrowLeft size={14} />
              <span>Back to Articles</span>
            </button>

            {/* Read Layout */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
              
              {/* Cover Banner */}
              <div className="h-56 md:h-72 w-full overflow-hidden relative bg-gradient-to-r from-[#007f6e] to-[#115e59] flex items-end p-6">
                <div className="space-y-2 relative z-10">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-xs">
                    {viewPost.category}
                  </span>
                  <h2 className="text-xl md:text-3xl font-black text-white leading-tight tracking-tight">
                    {viewPost.title}
                  </h2>
                </div>
                <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
              </div>

              {/* Author & Info bar */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#e6f4f1] flex items-center justify-center font-bold text-[#007f6e] text-sm">
                    <User size={14} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">{viewPost.author || 'Clinical Specialist'}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Specialist & Medical Board Contributor</span>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-[11px] text-slate-500 font-medium font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    Date: {viewPost.date}
                  </span>
                  <span className={`px-2 py-0.5 rounded-sm text-[9px] font-extrabold uppercase tracking-widest ${
                    viewPost.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {viewPost.status}
                  </span>
                </div>
              </div>

              {/* Main Contents */}
              <div className="p-6 md:p-8 space-y-6">
                
                {viewPost.summary && (
                  <div className="text-sm text-slate-600 leading-relaxed font-semibold italic border-l-4 border-[#007f6e] pl-4 py-2 bg-slate-50/50 rounded-r-xl">
                    {viewPost.summary}
                  </div>
                )}

                {/* Body Content */}
                <div className="text-slate-700 leading-relaxed text-xs md:text-sm whitespace-pre-wrap font-sans space-y-4">
                  {viewPost.description}
                </div>
              </div>

              {/* Actions footer inside view screen */}
              {!isReadOnly && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-bold">
                  <button
                    onClick={() => handleOpenEditForm(viewPost)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-201 text-[#007f6e] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>Edit Publication</span>
                  </button>
                  <button
                    onClick={() => handleDelete(viewPost.id, viewPost.title)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete Publication</span>
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        ) : showForm ? (
          
          /* FORM ENTRY STATE */
          <motion.div
            key="post-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-md">
              <div className="bg-[#e6f4f1]/50 px-6 py-4 border-b border-[#007f6e]/10 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    {isEditingId ? '✍️ Edit Announcement / Article' : '🌱 Publish New Insights'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Publish research facts and tips accurately</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100/50 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Article Title */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Article Title *</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Advancements in Micro-Surgical Cardiac Stents"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] font-sans font-bold"
                      required
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Category Classification *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] font-semibold cursor-pointer"
                    >
                      {CATEGORIES.slice(1).map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Publish Status */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">State Visibility *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] font-semibold cursor-pointer"
                    >
                      <option value="Published">Published (Display to all patients instantly)</option>
                      <option value="Draft">Draft (Save privately in archive)</option>
                    </select>
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Author Name / Publisher</label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      placeholder="e.g. Dr. Jane Smith"
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e] font-semibold"
                    />
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brief Lead Summary</label>
                    <input
                      type="text"
                      value={formSummary}
                      onChange={(e) => setFormSummary(e.target.value)}
                      placeholder="A short sentence summarizing this post..."
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#007f6e]"
                    />
                  </div>

                  {/* Full Description */}
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Article Documents & Recommendations *</label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={12}
                      placeholder="Type the core publication documents, results, tips or announcements in full detail here..."
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-205 rounded-xl focus:outline-none focus:border-[#007f6e] leading-relaxed font-sans"
                      required
                    ></textarea>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-500 rounded-xl transition-all cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#007f6e] hover:bg-[#006657] text-white rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Submit Publication
                  </button>
                </div>

              </form>
            </div>
          </motion.div>
        ) : (
          
          /* PUBLIC LISTING BOARD STATE */
          <motion.div
            key="list-board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Search Filters header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 border border-slate-100 rounded-2xl shadow-3xs">
              
              {/* Category switches */}
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === category 
                        ? 'bg-[#007f6e] text-white shadow-xs' 
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Text Search queries */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Query titles, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs border border-slate-150 rounded-xl focus:outline-none focus:border-[#007f6e]"
                />
              </div>

            </div>

            {/* Publication Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ y: -4, shadow: "0 10px 20px -10px rgba(0,0,0,0.08)" }}
                  className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col justify-between shadow-3xs group relative"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#007f6e]/10 text-[#007f6e] font-bold text-[9px] uppercase tracking-wider">
                        {post.category}
                      </span>
                      
                      {post.status === 'Draft' && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-extrabold text-[9px] uppercase tracking-wider">
                          Private Draft
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#007f6e] line-clamp-2 transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-450 line-clamp-3 leading-relaxed">
                        {post.summary || post.description || 'No summary available.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100/60 text-[10.5px] text-slate-400 font-mono">
                      <Calendar size={11} /> 
                      <span>{post.date}</span>
                      <span>&bull;</span>
                      <span>{post.author || 'Contributor'}</span>
                    </div>
                  </div>

                  {/* Actions & Read Buttons footer */}
                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100/60 flex items-center justify-between text-xs font-bold">
                    <button
                      onClick={() => setViewPost(post)}
                      className="text-[#007f6e] hover:text-[#006657] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Read Document</span>
                      <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleOpenEditForm(post)}
                          className="p-1.5 bg-white border border-slate-201 hover:bg-slate-50 text-slate-500 hover:text-[#007f6e] rounded-lg transition-colors cursor-pointer"
                          title="Edit Document"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-550 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {filteredPosts.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 py-16 bg-white border border-slate-100 rounded-3xl text-center space-y-2">
                  <Bookmark size={30} className="mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No Articles Found Match Queries</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">We couldn't find any medical publications or healthy lifestyle insights matching categories or titles specified in the filters bar.</p>
                </div>
              )}
            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
