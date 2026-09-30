import React, { useEffect, useState } from 'react';
import { BrainCircuit, Link2, Loader2, KeyRound, Sparkles, ChevronDown, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { AI_PROVIDERS, AI_STORAGE_KEY, AISettings, AIProvider, askAI, extractSharedPage } from '@/lib/ai';

interface AIWorkspaceProps {
  editorText: string;
  onEditorTextChange: (value: string) => void;
}

const DEFAULT_SETTINGS: AISettings = {
  provider: 'deepseek',
  apiKey: '',
  model: AI_PROVIDERS.deepseek.model,
  endpoint: AI_PROVIDERS.deepseek.endpoint,
};

const AIWorkspace: React.FC<AIWorkspaceProps> = ({ editorText, onEditorTextChange }) => {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [shareUrl, setShareUrl] = useState('https://chat.deepseek.com/share/7vwg7om7n821bgqzzv');
  const [pastedContent, setPastedContent] = useState('');
  const [busy, setBusy] = useState<'extract' | 'analyze' | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AI_STORAGE_KEY);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } catch { /* use defaults when saved settings are invalid */ }
  }, []);

  const updateSettings = (updates: Partial<AISettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(next));
  };

  const selectProvider = (provider: AIProvider) => {
    const preset = AI_PROVIDERS[provider];
    updateSettings({ provider, endpoint: preset.endpoint, model: preset.model });
  };

  const handleExtract = async () => {
    setBusy('extract');
    try {
      const content = pastedContent.trim() || await extractSharedPage(shareUrl.trim());
      onEditorTextChange(content);
      toast.success('تم استخراج المحتوى إلى المحرر. راجعه ثم اضغط تحليل + تنظيف.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر استخراج الرابط');
    } finally {
      setBusy(null);
    }
  };

  const handleAnalyze = async () => {
    if (!editorText.trim()) {
      toast.error('أدخل محتوى أو استخرج رابطًا أولًا');
      return;
    }
    setBusy('analyze');
    try {
      const result = await askAI(settings, `استخرج جميع الملفات من النص التالي بدقة. حافظ على المحتوى البرمجي، أنشئ مسارًا منطقيًا للملفات التي لا تملك مسارًا، وأعد النتيجة بصيغة قابلة للتحليل:\n\n${editorText}`);
      onEditorTextChange(result);
      toast.success(`تمت معالجة المحتوى عبر ${AI_PROVIDERS[settings.provider].label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذر الاتصال بالذكاء الاصطناعي');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="glass-card mb-6 rounded-2xl border border-cyan-800/30 overflow-hidden">
      <button onClick={() => setOpen(value => !value)} className="w-full flex items-center justify-between p-4 text-right hover:bg-slate-800/20 transition-colors">
        <span className="flex items-center gap-2 text-cyan-300 font-bold"><BrainCircuit className="w-5 h-5" /> مركز الذكاء والربط المتقدم</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="p-4 pt-0 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <label className="space-y-1 text-xs text-slate-400">
              مزود الذكاء الاصطناعي
              <select value={settings.provider} onChange={e => selectProvider(e.target.value as AIProvider)} className="w-full mt-1 bg-slate-900/70 border border-slate-700 rounded-xl p-2.5 text-cyan-300 outline-none">
                {(Object.keys(AI_PROVIDERS) as AIProvider[]).map(provider => <option key={provider} value={provider} className="bg-slate-900">{AI_PROVIDERS[provider].label}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              النموذج
              <input value={settings.model} onChange={e => updateSettings({ model: e.target.value })} className="w-full mt-1 bg-slate-900/70 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono outline-none" placeholder="اسم النموذج" />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              مفتاح API (محلي فقط)
              <div className="relative mt-1"><KeyRound className="absolute right-3 top-3 w-4 h-4 text-slate-600" /><input type="password" value={settings.apiKey} onChange={e => updateSettings({ apiKey: e.target.value })} className="w-full bg-slate-900/70 border border-slate-700 rounded-xl p-2.5 pr-9 text-slate-200 font-mono outline-none" placeholder="لا يُرسل إلا للمزود المختار" /></div>
            </label>
          </div>
          <label className="block text-xs text-slate-400">نقطة الاتصال
            <input value={settings.endpoint} onChange={e => updateSettings({ endpoint: e.target.value })} className="w-full mt-1 bg-slate-900/70 border border-slate-700 rounded-xl p-2.5 text-slate-300 font-mono outline-none" placeholder="https://.../v1/chat/completions" />
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-2">
            <input value={shareUrl} onChange={e => setShareUrl(e.target.value)} className="bg-slate-900/70 border border-slate-700 rounded-xl p-2.5 text-slate-300 font-mono outline-none" placeholder="رابط محادثة DeepSeek أو أي صفحة نصية" />
            <button onClick={handleExtract} disabled={busy !== null} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-700/60 hover:bg-cyan-600/70 text-cyan-100 font-bold disabled:opacity-40"><Link2 className="w-4 h-4" />{busy === 'extract' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'استخراج الرابط'}</button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleAnalyze} disabled={busy !== null} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-700/60 hover:bg-violet-600/70 text-violet-100 font-bold disabled:opacity-40"><Sparkles className="w-4 h-4" />{busy === 'analyze' ? 'جارٍ التحليل...' : 'حلّل واستخرج بالذكاء الاصطناعي'}</button>
            <button onClick={() => setPastedContent(window.prompt('الصق محتوى محادثة DeepSeek هنا:') || '')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-600/70 text-slate-200 text-sm"><ClipboardPaste className="w-4 h-4" />استخدام محتوى ملصوق</button>
          </div>
          <p className="text-[11px] text-slate-500">المفاتيح تحفظ في متصفحك فقط. قد يمنع DeepSeek استخراج الرابط مباشرة بسبب WAF أو CORS؛ عندها استخدم زر المحتوى الملصوق ثم التحليل.</p>
        </div>
      )}
    </section>
  );
};

export default AIWorkspace;
