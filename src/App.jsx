import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AlertCircle, CheckCircle2, XCircle, Layers, Search, MessageSquare, 
  ChevronDown, ChevronUp, Clock, Download, ExternalLink, Filter, 
  LayoutGrid, Info, Link as LinkIcon, List, LogIn, LogOut, Mail, 
  MapPin, Newspaper, PenLine, Plus, Send, Settings, Siren, Trash2, 
  User, UserPlus, X, Edit
} from 'lucide-react';

// --- 靜態配置 ---
const BLOCKS = [
  { id: "A", name: "仁 (A座)" }, { id: "B", name: "道 (B座)" },
  { id: "C", name: "新 (C座)" }, { id: "D", name: "建 (D座)" },
  { id: "E", name: "泰 (E座)" }, { id: "F", name: "昌 (F座)" },
  { id: "G", name: "盛 (G座)" }, { id: "H", name: "志 (H座)" },
];
const FLOORS = Array.from({ length: 35 }, (_, i) => i + 1);
const UNITS = [1, 2, 3, 4, 5, 6, 7, 8];

// --- API 服務層 ---
const api = {
  checkAuth: async () => {
    try { return await (await fetch('/api/auth.php?action=check')).json(); } 
    catch { return { authenticated: false }; }
  },
  login: async (email, password) => {
    const res = await fetch('/api/auth.php?action=login', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "登入失敗");
    return data.user;
  },
  logout: async () => { await fetch('/api/auth.php?action=logout', { method: 'POST' }); },
  getBlockData: async (block) => {
    const response = await fetch(`/api/data.php?action=get_block&block=${block}`);
    if (!response.ok) throw new Error("Failed to fetch block data");
    return await response.json();
  },
  updateStatus: async (payload) => {
    const res = await fetch('/api/data.php?action=update_status', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  },
  getNews: async () => {
    const response = await fetch('/api/data.php?action=get_news');
    if (!response.ok) return []; 
    return await response.json();
  },
  addNews: async (payload) => {
    await fetch('/api/data.php?action=add_news', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
  },
  deleteNews: async (id) => await fetch(`/api/data.php?action=delete_news&id=${id}`, { method: 'DELETE' })
};

// --- 工具函數 ---
const formatTimeAgo = (str) => {
  if(!str) return "";
  const d = new Date(str), now = new Date();
  if(isNaN(d.getTime())) return "";
  const diff = (now - d) / 60000;
  if(diff < 1) return "剛剛";
  if(diff < 60) return `${Math.floor(diff)}分鐘前`;
  if(diff < 1440) return `${Math.floor(diff/60)}小時前`;
  return `${Math.floor(diff/1440)}日前`;
};
const formatFullTime = (str) => {
  if(!str) return "-";
  const d = new Date(str);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString('zh-HK', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
};

// --- 子組件 ---

// 1. 狀態標籤
const StatusBadge = ({ status }) => {
  switch (status) {
    case "safe": return <span className="flex items-center gap-1 text-emerald-700 text-xs font-medium"><CheckCircle2 className="w-3 h-3"/> 平安</span>;
    case "danger": return <span className="flex items-center gap-1 text-red-700 text-xs font-medium"><AlertCircle className="w-3 h-3"/> 求救</span>;
    case "deceased": return <span className="flex items-center gap-1 text-gray-700 text-xs font-medium"><XCircle className="w-3 h-3"/> 離世</span>;
    case "mixed": return <span className="flex items-center gap-1 text-purple-700 text-xs font-medium"><Layers className="w-3 h-3"/> 複雜</span>;
    case "missing": return <span className="flex items-center gap-1 text-orange-700 text-xs font-medium"><Search className="w-3 h-3"/> 尋人</span>;
    default: return null;
  }
};

// 2. 登入 Modal
const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true); 
    setError("");
    try { 
      await onLogin(email, password); 
      onClose(); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LogIn className="w-5 h-5" /> 登入以繼續
            </h3>
            <p className="text-slate-300 text-sm">需要登入才能編輯</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none transition-all text-sm" placeholder="電郵地址" required />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 outline-none transition-all text-sm" placeholder="密碼" required />
            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600"><AlertCircle className="w-4 h-4 shrink-0" /><p className="text-xs font-medium">{error}</p></div>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70">
              {loading ? "登入中..." : <><LogIn className="w-4 h-4" /> 登入</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// 3. 狀態編輯 Modal
const UnitEditorModal = ({ block, floor, unit, currentData, onClose, onUpdate, canEdit }) => {
  const [status, setStatus] = useState(currentData?.status || null);
  const [remark, setRemark] = useState(currentData?.remark || "");
  const [source, setSource] = useState(currentData?.source || 'citizen');
  const [sourceUrl, setSourceUrl] = useState(currentData?.sourceUrl || "");

  if (!canEdit) {
    const blockName = BLOCKS.find(b => b.id === block)?.name;
    const s = currentData?.status;
    const r = currentData?.remark;
    let statusContent;
    let statusClass = "flex items-center gap-3 p-4 rounded-lg border ";
    if (!s) { statusClass += "bg-slate-50 text-slate-500 border-slate-200"; statusContent = <span className="text-base">未有更新</span>; } 
    else if (s === 'safe') { statusClass += "bg-emerald-50 text-emerald-700 border-emerald-200"; statusContent = <><CheckCircle2 className="w-5 h-5"/> <span className="text-base font-bold">平安</span></>; } 
    else if (s === 'danger') { statusClass += "bg-red-50 text-red-700 border-red-200"; statusContent = <><AlertCircle className="w-5 h-5"/> <span className="text-base font-bold">求救</span></>; } 
    else if (s === 'deceased') { statusClass += "bg-gray-100 text-gray-700 border-gray-200"; statusContent = <><XCircle className="w-5 h-5"/> <span className="text-base font-bold">已離世</span></>; } 
    else if (s === 'mixed') { statusClass += "bg-purple-50 text-purple-700 border-purple-200"; statusContent = <><Layers className="w-5 h-5"/> <span className="text-base font-bold">複雜狀況</span></>; } 
    else if (s === 'missing') { statusClass += "bg-orange-50 text-orange-700 border-orange-200"; statusContent = <><Search className="w-5 h-5"/> <span className="text-base font-bold">尋人</span></>; }

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
            <div><h3 className="text-lg font-bold text-slate-800">{blockName}</h3><p className="text-slate-500 text-sm">{floor}樓 - {unit}室</p></div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
          </div>
          <div className="p-6">
            <div className="mb-4"><p className="text-slate-500 text-xs uppercase tracking-wide mb-2">目前狀態</p><div className={statusClass}>{statusContent}</div></div>
            {r && (<div className="mb-4"><p className="text-slate-500 text-xs uppercase tracking-wide mb-2">備註</p><div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">{r}</div></div>)}
            {currentData?.updatedAt && (<p className="text-xs text-slate-400 text-right mb-4">更新於: {formatFullTime(currentData.updatedAt)}</p>)}
            <div className="pt-4 border-t border-slate-100"><p className="text-slate-400 text-xs text-center">需要管理員權限才能編輯狀態</p></div>
          </div>
        </div>
      </div>
    );
  }

  const btns = [
    { id: 'safe', l: '平安', c: 'bg-emerald-100 text-emerald-800 border-emerald-300', i: CheckCircle2 },
    { id: 'danger', l: '求救', c: 'bg-red-100 text-red-800 border-red-300', i: AlertCircle },
    { id: 'deceased', l: '離世', c: 'bg-gray-800 text-white border-gray-600', i: XCircle },
    { id: 'mixed', l: '複雜', c: 'bg-purple-100 text-purple-800 border-purple-300', i: Layers },
    { id: 'missing', l: '尋人', c: 'bg-orange-100 text-orange-800 border-orange-300', i: Search },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-100 p-4 border-b flex justify-between items-center">
          <div><h3 className="text-lg font-bold text-slate-800">{BLOCKS.find(b=>b.id===block)?.name}</h3><p className="text-sm text-slate-500">{floor}樓 {unit}室</p></div>
          <button onClick={onClose}><X className="w-6 h-6 text-slate-500"/></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div><label className="block text-sm font-medium text-slate-700 mb-2">狀態</label><div className="grid grid-cols-3 gap-2">{btns.map(b => (<button key={b.id} onClick={() => setStatus(status===b.id?null:b.id)} className={`p-2 rounded-lg border flex flex-col items-center transition-all active:scale-95 ${status===b.id ? b.c + ' shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}><b.i className="w-5 h-5 mb-1"/> <span className="text-xs font-bold">{b.l}</span></button>))}</div></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-2">備註</label><textarea value={remark} onChange={e=>setRemark(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} placeholder="請輸入詳細情況..." /></div>
          <div className="pt-4 border-t border-slate-100"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">資訊來源</label><div className="flex gap-2 mb-3">{['citizen','family_media','partner'].map(v => (<button key={v} onClick={()=>setSource(v)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${source===v?'bg-blue-100 text-blue-800 border-blue-400':'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>{v==='citizen'?'網民':v==='family_media'?'家屬/傳媒':'友台'}</button>))}</div><input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="來源連結 URL (選填)" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"/></div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-white transition-colors">取消</button>
          <button onClick={() => onUpdate({block, floor, unit, status, remark, source, sourceUrl})} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-sm transition-colors">儲存更新</button>
        </div>
      </div>
    </div>
  );
};

// 4. 新聞 Modal
const NewsModal = ({ initialData, onClose, onSubmit }) => {
  const [content, setContent] = useState(initialData?.content || "");
  const [link, setLink] = useState(initialData?.link || "");
  const [linkText, setLinkText] = useState(initialData?.linkText || "");
  const isEdit = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg flex gap-2"><Newspaper className="w-5 h-5"/> {isEdit ? "編輯消息" : "發佈消息"}</h3>
          <button onClick={onClose}><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-4">
          <textarea value={content} onChange={e=>setContent(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" rows={4} placeholder="內容..." />
          <div className="grid grid-cols-2 gap-3">
            <input value={link} onChange={e=>setLink(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="連結URL" />
            <input value={linkText} onChange={e=>setLinkText(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" placeholder="連結文字" />
          </div>
          <button onClick={()=>onSubmit({content, link, linkText})} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white rounded-lg font-bold">
             {isEdit ? "確認修改" : "發佈"}
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. 求救事項高亮組件
const DangerAlert = ({ units, blockName }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!units || units.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg mb-3 shadow-lg overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full p-2 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <div className="bg-white/20 rounded-full p-0.5 animate-pulse">
            <Siren className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-white font-bold text-sm">求救事項</h2>
            <p className="text-red-100 text-[10px]">{blockName} • {units.length} 個單位</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/80">
          <span className="text-xs">{expanded ? '收起' : '展開'}</span>
          {expanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
        </div>
      </button>
      
      {expanded && (
        <div className="bg-black/10 p-2 space-y-2">
          {units.map((u, i) => (
             <div key={i} className="bg-white/10 rounded p-2 text-white flex justify-between items-start gap-2">
                <div>
                   <span className="font-bold text-sm">{u.f}樓 {u.u}室</span>
                   {u.remark && <p className="text-xs text-red-100 mt-1 opacity-90">{u.remark}</p>}
                </div>
                <div className="text-[10px] text-red-200 whitespace-nowrap bg-black/20 px-1.5 py-0.5 rounded">
                   {formatTimeAgo(u.updatedAt)}
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---
function App() {
  const [user, setUser] = useState(null);
  const [currentBlock, setCurrentBlock] = useState("A");
  const [blockData, setBlockData] = useState({ units: {} });
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  
  // News State
  const [news, setNews] = useState([]);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingNewsItem, setEditingNewsItem] = useState(null);
  const [newsExpanded, setNewsExpanded] = useState(false); // Controls full list view

  const [viewMode, setViewMode] = useState("grid");
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [filters, setFilters] = useState({ statusFilter: 'all', hasRemarkFilter: false, sortBy: 'floor', sortOrder: 'desc' });
  
  const blockRefs = useRef({});

  useEffect(() => {
    api.checkAuth().then(data => data.authenticated && setUser(data.user));
    loadNews();
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getBlockData(currentBlock).then(setBlockData).finally(() => setLoading(false));
    if(blockRefs.current[currentBlock]) {
      blockRefs.current[currentBlock].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentBlock]);

  const loadNews = () => api.getNews().then(setNews);
  
  const handleUpdateStatus = async (payload) => {
    try {
      await api.updateStatus(payload);
      setBlockData(prev => ({...prev, units: {...prev.units, [`${payload.floor}_${payload.unit}`]: {...prev.units[`${payload.floor}_${payload.unit}`], status: payload.status, remark: payload.remark, updatedAt: new Date().toISOString()}}}));
      setEditingUnit(null);
    } catch (e) { alert(e.message); }
  };

  const handleNewsSubmit = async (payload) => {
    if (editingNewsItem) {
       // "Edit" by deleting old and adding new (since backend has no UPDATE)
       await api.deleteNews(editingNewsItem.id);
    }
    await api.addNews(payload);
    loadNews();
    setShowNewsModal(false);
    setEditingNewsItem(null);
  };

  const openNewsEdit = (item) => {
    setEditingNewsItem(item);
    setShowNewsModal(true);
  };

  // Derived Data
  const stats = useMemo(() => {
    const c = { safe: 0, danger: 0, deceased: 0, mixed: 0, missing: 0 };
    Object.values(blockData.units).forEach(u => { if(u.status && c[u.status] !== undefined) c[u.status]++; });
    return c;
  }, [blockData]);

  const dangerUnits = useMemo(() => {
    return Object.entries(blockData.units)
      .filter(([_, v]) => v.status === 'danger')
      .map(([k, v]) => {
         const [f, u] = k.split('_');
         return { f, u, ...v };
      });
  }, [blockData]);

  // Filtering Logic
  const isUnitVisible = (d) => {
    if (filters.statusFilter === 'reported') { if (!d?.status) return false; } 
    else if (filters.statusFilter !== 'all') {
       if (filters.statusFilter === null) { if (d?.status) return false; }
       else if (d?.status !== filters.statusFilter) return false;
    }
    if (filters.hasRemarkFilter && (!d?.remark || !d.remark.trim())) return false;
    return true;
  };

  const filteredCount = useMemo(() => {
    let count = 0;
    for (const f of FLOORS) for (const u of UNITS) if (isUnitVisible(blockData.units[`${f}_${u}`])) count++;
    return count;
  }, [blockData, filters]);

  const listData = useMemo(() => {
    let data = [];
    Object.entries(blockData.units).forEach(([k, v]) => {
      if (isUnitVisible(v)) {
        const [f, u] = k.split('_').map(Number);
        data.push({ f, u, ...v, key: k });
      }
    });
    data.sort((a, b) => filters.sortBy === 'floor' ? (filters.sortOrder === 'asc' ? a.f - b.f : b.f - a.f) : (filters.sortOrder === 'asc' ? new Date(a.updatedAt||0) - new Date(b.updatedAt||0) : new Date(b.updatedAt||0) - new Date(a.updatedAt||0)));
    return data;
  }, [blockData, filters]);

  const getCellClass = (d, hidden) => {
    let c = "h-10 w-full flex items-center justify-center rounded border text-sm font-medium transition-all cursor-pointer relative ";
    if (hidden) c += "opacity-20 scale-95 ";
    if(!d?.status) return c + "bg-white border-slate-300 text-slate-400 hover:bg-slate-50";
    if(d.status==='safe') return c + "bg-emerald-500 border-emerald-600 text-white shadow-sm";
    if(d.status==='danger') return c + "bg-red-600 border-red-700 text-white shadow-md font-bold animate-pulse-slow";
    if(d.status==='deceased') return c + "bg-gray-900 border-gray-700 text-white shadow-sm";
    if(d.status==='mixed') return c + "bg-purple-500 border-purple-600 text-white shadow-sm";
    return c + "bg-orange-500 border-orange-600 text-white shadow-sm";
  };

  const currentBlockName = BLOCKS.find(b => b.id === currentBlock)?.name;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg shrink-0">
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">宏福苑報平安</h1>
              <a href="https://t.me/+vSbsohG3XWRlOTZl" target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 transition-colors text-xs">
                <Send className="w-3 h-3"/><span>聯絡管理員</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <button onClick={async()=>{await api.logout(); setUser(null);}} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white bg-slate-800 px-2 py-1 rounded-lg">
                  <User className="w-4 h-4"/> <LogOut className="w-3.5 h-3.5"/>
                </button>
              ) : (
                <button onClick={()=>setShowLogin(true)} className="flex items-center gap-2 text-xs text-white hover:text-emerald-300 bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg font-medium">
                  <LogIn className="w-3.5 h-3.5"/> 登入
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Info & External Links */}
      <div className="bg-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-1">
          <p className="text-xs flex items-center gap-2 flex-wrap">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-300">數據來源包括：</span>
            <a href="https://taipo-spreadsheet.vercel.app/" target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 flex items-center gap-1">
              宏福苑報平安 Google Sheet【齋睇】 <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>
      <div className="bg-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-1 pb-3">
          <div className="grid grid-cols-4 gap-2">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSc64NpaVIcAkg92fanI5W34xXwpoTnxXu0QozccOiRf3cAZYw/viewform" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg py-3 px-2 transition-all active:scale-[0.98]"><CheckCircle2 className="w-4 h-4 shrink-0"/> <span className="font-bold text-xs">報平安</span></a>
            <a href="https://forms.gle/RpSpL7KiXcuD3eN89" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 rounded-lg py-3 px-2 transition-all active:scale-[0.98]"><AlertCircle className="w-4 h-4 shrink-0"/> <span className="font-bold text-xs">尋人/失聯</span></a>
            <a href="https://experience.arcgis.com/experience/22b9d309e69548f28d2f4055d4de5ace" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg py-3 px-2 transition-all active:scale-[0.98]"><MapPin className="w-4 h-4 shrink-0"/> <span className="font-bold text-xs">物資地圖</span></a>
            <a href="https://www.taipofire.gov.hk/" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg py-3 px-2 transition-all active:scale-[0.98]"><span className="font-bold text-xs">政府官方網站</span></a>
          </div>
        </div>
      </div>

      {/* Latest News - Style Update */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Newspaper className="w-4 h-4"/>最新消息
              </h3>
            </div>
            {user?.isAdmin && (
              <button 
                onClick={() => { setEditingNewsItem(null); setShowNewsModal(true); }} 
                className="flex items-center gap-1 text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-3 h-3"/> 新增
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {news.length === 0 ? (
               <p className="text-slate-400 text-sm text-center py-2">暫無消息</p>
            ) : (
               (newsExpanded ? news : news.slice(0, 1)).map(n => (
                 <div key={n.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100 shadow-sm relative group">
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{n.content}</p>
                    {n.link && (
                      <a href={n.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-2 font-medium bg-blue-50 px-2 py-1 rounded">
                        <LinkIcon className="w-3 h-3"/> {n.linkText || "查看連結"} <ExternalLink className="w-3 h-3"/>
                      </a>
                    )}
                    <div className="flex justify-between items-center mt-2 pt-2">
                       <p className="text-slate-400 text-xs flex items-center gap-1">
                         <Clock className="w-3 h-3"/> {formatTimeAgo(n.created_at)}
                       </p>
                       {user?.isAdmin && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => openNewsEdit(n)} className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-0.5"><PenLine className="w-3 h-3"/> 編輯</button>
                             <button onClick={async()=>{if(confirm("確認刪除?")){await api.deleteNews(n.id);loadNews();}}} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> 刪除</button>
                          </div>
                       )}
                    </div>
                 </div>
               ))
            )}
          </div>
          
          {news.length > 1 && (
            <button 
              onClick={() => setNewsExpanded(!newsExpanded)} 
              className="w-full mt-2 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            >
              {newsExpanded ? (
                <>收起 <ChevronUp className="w-4 h-4"/></>
              ) : (
                <>顯示更多 ({news.length - 1} 則) <ChevronDown className="w-4 h-4"/></>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Block Selector (Sticky) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex overflow-x-auto no-scrollbar py-2 pl-4 pr-2 gap-2 snap-x scroll-pl-4">
            {BLOCKS.map(b => (
              <button key={b.id} ref={el => blockRefs.current[b.id] = el} onClick={() => setCurrentBlock(b.id)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all snap-start ${currentBlock===b.id ? "bg-slate-800 text-white shadow-md transform scale-105" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{b.name}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-2 pt-3 flex-grow w-full pb-12">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-5 gap-2 mb-4 text-sm">
          <div className="bg-emerald-100 rounded-lg px-2 py-2 flex flex-col items-center border border-emerald-300"><span className="flex items-center gap-1 text-emerald-700 text-xs font-medium"><CheckCircle2 className="w-3 h-3"/> 平安</span><span className="text-xl font-bold text-emerald-800">{stats.safe}</span></div>
          <div className="bg-red-100 rounded-lg px-2 py-2 flex flex-col items-center border border-red-300"><span className="flex items-center gap-1 text-red-700 text-xs font-medium"><AlertCircle className="w-3 h-3"/> 求救</span><span className="text-xl font-bold text-red-800">{stats.danger}</span></div>
          <div className="bg-gray-200 rounded-lg px-2 py-2 flex flex-col items-center border border-gray-400"><span className="flex items-center gap-1 text-gray-700 text-xs font-medium"><XCircle className="w-3 h-3"/> 離世</span><span className="text-xl font-bold text-gray-800">{stats.deceased}</span></div>
          <div className="bg-purple-100 rounded-lg px-2 py-2 flex flex-col items-center border border-purple-300"><span className="flex items-center gap-1 text-purple-700 text-xs font-medium"><Layers className="w-3 h-3"/> 複雜</span><span className="text-xl font-bold text-purple-800">{stats.mixed}</span></div>
          <div className="bg-orange-100 rounded-lg px-2 py-2 flex flex-col items-center border border-orange-300"><span className="flex items-center gap-1 text-orange-700 text-xs font-medium"><Search className="w-3 h-3"/> 尋人</span><span className="text-xl font-bold text-orange-800">{stats.missing}</span></div>
        </div>

        {/* Danger Alert Section */}
        <DangerAlert units={dangerUnits} blockName={currentBlockName} />

        {/* Control Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded-r shadow-sm text-xs text-blue-900 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
               <p className="font-bold flex items-center gap-1.5 min-w-0"><Info className="w-3.5 h-3.5 flex-shrink-0"/>當前顯示：<span className="text-sm underline decoration-blue-300 underline-offset-2 whitespace-nowrap">{currentBlockName}</span></p>
               <button onClick={()=>setFilters({...filters, hasRemarkFilter:true})} className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors active:scale-95 flex-shrink-0"><MessageSquare className="w-3 h-3"/>備註總覽</button>
            </div>
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1 ml-2">
            <button onClick={()=>setViewMode('grid')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode==='grid'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}><LayoutGrid className="w-3.5 h-3.5"/>格子</button>
            <button onClick={()=>setViewMode('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode==='list'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}><List className="w-3.5 h-3.5"/>列表</button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 mb-3 overflow-hidden">
          <button onClick={()=>setFiltersExpanded(!filtersExpanded)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors">
             <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Filter className="w-4 h-4"/>篩選條件<span className="text-xs text-slate-500 font-normal">(顯示 {filteredCount} / {35*8} 戶)</span></div>
             {filtersExpanded ? <ChevronUp className="w-4 h-4 text-slate-500"/> : <ChevronDown className="w-4 h-4 text-slate-500"/>}
          </button>
          {filtersExpanded && (
            <div className="p-3 space-y-3 border-t border-slate-100">
               <div>
                 <label className="block text-xs font-medium text-slate-600 mb-2">狀態篩選</label>
                 <div className="flex flex-wrap gap-1.5">
                   {[
                     {v:'all',l:'全部',c:'bg-slate-100 text-slate-700'},
                     {v:'reported',l:'已回報',c:'bg-blue-100 text-blue-700'},
                     {v:'safe',l:'平安',c:'bg-emerald-100 text-emerald-700'},
                     {v:'danger',l:'求救',c:'bg-red-100 text-red-700'},
                     {v:'deceased',l:'已離世',c:'bg-gray-200 text-gray-700'},
                     {v:'mixed',l:'複雜狀況',c:'bg-purple-100 text-purple-700'},
                     {v:'missing',l:'尋人',c:'bg-orange-100 text-orange-700'},
                     {v:null,l:'未回報',c:'bg-white text-slate-500 border border-slate-300'}
                   ].map(opt => (
                     <button key={opt.l} onClick={()=>setFilters({...filters, statusFilter: opt.v})} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${filters.statusFilter===opt.v ? `${opt.c} ring-2 ring-offset-1 ring-slate-400` : `${opt.c} opacity-60 hover:opacity-100`}`}>{opt.l}</button>
                   ))}
                 </div>
               </div>
               <div className="flex items-center gap-4 pt-1">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" checked={filters.hasRemarkFilter} onChange={e=>setFilters({...filters, hasRemarkFilter: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                   <span className="text-sm text-slate-700 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-blue-500"/> 只顯示有備註</span>
                 </label>
               </div>
            </div>
          )}
        </div>

        {/* Content Grid/List */}
        {loading ? (
           <div className="bg-white/80 p-12 flex items-center justify-center rounded-lg border border-slate-100"><div className="flex items-center gap-3 text-slate-500"><div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div><span className="text-sm font-medium">載入中...</span></div></div>
        ) : viewMode === 'grid' ? (
          <div className="relative">
             <div className="grid grid-cols-9 gap-1 mb-2 sticky top-[53px] bg-slate-50 z-30 py-2 border-b border-slate-200 text-center text-xs font-bold text-slate-500">
                <div className="flex items-end justify-center pb-1">樓層</div>
                {UNITS.map(u=><div key={u} className="bg-slate-200 rounded py-1 text-slate-600">{u}室</div>)}
             </div>
             <div className="space-y-1">
                {FLOORS.map(f => (
                  <div key={f} className="grid grid-cols-9 gap-1 items-center">
                    <div className="text-center font-bold text-slate-600 text-sm bg-white border border-slate-200 rounded h-10 flex items-center justify-center shadow-sm">{f}</div>
                    {UNITS.map(u => {
                      const k = `${f}_${u}`;
                      const d = blockData.units[k];
                      const visible = isUnitVisible(d);
                      return (
                        <button key={u} onClick={()=>setEditingUnit({block:currentBlock,floor:f,unit:u})} className={getCellClass(d, !visible)}>
                           {d?.status==='safe' && <CheckCircle2 className="w-5 h-5"/>}
                           {d?.status==='danger' && <AlertCircle className="w-5 h-5"/>}
                           {d?.status==='deceased' && <XCircle className="w-5 h-5"/>}
                           {d?.status==='mixed' && <Layers className="w-5 h-5"/>}
                           {d?.status==='missing' && <Search className="w-5 h-5"/>}
                           {!d?.status && <span className="text-xs font-light">{u}</span>}
                           {d?.remark && !(!visible && filters.hasRemarkFilter) && <div className="absolute -top-1 -right-1 bg-white rounded-full p-[4px] shadow-sm"><MessageSquare className="w-3 h-3 text-blue-500 fill-blue-100"/></div>}
                           {d?.status && d?.updatedAt && !(!visible && filters.hasRemarkFilter) && <div className="absolute -bottom-0.5 left-0 right-0 text-center"><span className="text-[8px] bg-black/40 text-white px-1 rounded-sm">{formatTimeAgo(d.updatedAt)}</span></div>}
                        </button>
                      );
                    })}
                  </div>
                ))}
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
             <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 text-xs font-bold text-slate-600 border-b border-slate-200 sticky z-30">
                <div className="col-span-1 text-center">樓層</div>
                <div className="col-span-1 text-center">室</div>
                <div className="col-span-2 text-center">狀態</div>
                <div className="col-span-4">備註</div>
                <div className="col-span-2 text-center">更新時間</div>
                <div className="col-span-2 text-center">操作</div>
             </div>
             <div className="divide-y divide-slate-100">
                {listData.length === 0 ? (
                   <div className="px-4 py-8 text-center text-slate-500"><Filter className="w-8 h-8 mx-auto mb-2 text-slate-300"/><p className="text-sm">沒有符合條件的紀錄</p></div>
                ) : listData.map(d => (
                   <div key={d.key} className={`grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-slate-50 transition-colors ${d.status==='danger'?'bg-red-50':''}`}>
                      <div className="col-span-1 text-center"><span className="inline-flex items-center justify-center w-7 h-7 bg-slate-200 rounded text-sm font-bold text-slate-700">{d.f}</span></div>
                      <div className="col-span-1 text-center"><span className="text-sm font-medium text-slate-600">{d.u}室</span></div>
                      <div className="col-span-2 text-center"><StatusBadge status={d.status}/></div>
                      <div className="col-span-4">{d.remark ? <p className="text-sm text-slate-700 line-clamp-2">{d.remark}</p> : <span className="text-xs text-slate-400">-</span>}</div>
                      <div className="col-span-2 text-center text-xs text-slate-500">{formatFullTime(d.updatedAt)}</div>
                      <div className="col-span-2 text-center"><button onClick={()=>setEditingUnit({block:currentBlock,floor:d.f,unit:d.u})} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><PenLine className="w-3 h-3"/>編輯</button></div>
                   </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <div className="bg-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-0">
           <p className="text-sm font-medium flex items-center gap-2 justify-center py-2">
             <AlertCircle className="w-4 h-4 shrink-0"/>
             <span>全民間自發，由管理員人手update，請見諒 🙏</span>
           </p>
        </div>
      </div>

      {showLogin && <LoginModal onClose={()=>setShowLogin(false)} onLogin={api.login} />}
      {showNewsModal && <NewsModal initialData={editingNewsItem} onClose={()=>{setShowNewsModal(false); setEditingNewsItem(null);}} onSubmit={handleNewsSubmit} />}
      {editingUnit && <UnitEditorModal {...editingUnit} currentData={blockData.units[`${editingUnit.floor}_${editingUnit.unit}`]} onClose={()=>setEditingUnit(null)} onUpdate={handleUpdateStatus} canEdit={!!user} />}

    </div>
  );
}

export default App;