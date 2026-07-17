import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';

export default function StudyMaterialInput({ onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [material, setMaterial] = useState('');
  const [fileName, setFileName] = useState('');
  const [extracting, setExtracting] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setExtracting(true);

    try {
      if (file.name.endsWith('.txt')) {
        setMaterial(await file.text());
      } else {
        // Read as base64, send to backend for extraction
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/study/extract-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ filename: file.name, content: base64 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '提取失败');
        setMaterial(data.text);
      }
    } catch (err) {
      setFileName('文件解析失败: ' + err.message);
      setTimeout(() => setFileName(''), 3000);
      setExtracting(false);
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!material.trim()) return;
    onSubmit({ title: title.trim(), subject: subject.trim(), raw_material: material.trim() });
  };

  const inputClass = 'w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder:text-slate-600 outline-none focus:border-cyan-400/40 transition-all';

  // During file extraction, keep form visible but show clear progress
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="标题（可选）" className={inputClass} />
        <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="科目（可选）" className={inputClass} />
      </div>

      {extracting ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4 border border-white/[0.06] rounded-xl bg-white/[0.01]">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-violet-400/40 animate-spin"
              style={{ borderTopColor: 'transparent', borderRightColor: 'transparent' }} />
          </div>
          <div className="text-center">
            <p className="text-sm text-violet-400 font-semibold">正在解析文件...</p>
            <p className="text-xs text-slate-500 mt-1">{fileName}</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <textarea value={material} onChange={e => { setMaterial(e.target.value); setFileName(''); }}
            placeholder="粘贴学习材料到这里，或点击下方上传文件..."
            rows={10} className={inputClass + ' resize-none'} />
          {/* Char count + warning */}
          {material.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-mono ${material.length > 20000 ? 'text-rose-400' : material.length > 8000 ? 'text-amber-400' : 'text-slate-600'}`}>
                {material.length.toLocaleString()} 字
              </span>
              {material.length > 20000 && (
                <span className="text-[10px] text-rose-400/70">材料过长，建议精简到 20,000 字以内以保证分析质量</span>
              )}
              {material.length > 8000 && material.length <= 20000 && (
                <span className="text-[10px] text-amber-400/70">材料较长，处理时间可能延长</span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]
          transition-colors text-xs text-slate-400 ${extracting ? 'opacity-50 pointer-events-none' : 'hover:bg-white/[0.04] cursor-pointer'}`}>
          <Upload size={13} />
          <span>上传文件</span>
          <input type="file" accept=".txt,.docx,.pdf" onChange={handleFile} className="hidden" disabled={extracting} />
        </label>
        {fileName && !extracting && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 truncate max-w-[200px]">
            <FileText size={12} /> {fileName} · {(material?.length || 0).toLocaleString()} 字
          </span>
        )}
        <button type="submit" disabled={!material.trim() || loading || extracting}
          className="ml-auto px-6 py-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-sm text-cyan-400
            hover:bg-cyan-500/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all font-semibold tracking-wide">
          {loading ? '处理中...' : '开始 AI 处理'}
        </button>
      </div>
    </form>
  );
}
