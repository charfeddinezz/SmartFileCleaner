export type AIProvider = 'deepseek' | 'openai' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  endpoint: string;
}

export const AI_STORAGE_KEY = 'smartcleaner_ai_settings_v1';

export const AI_PROVIDERS: Record<AIProvider, { label: string; endpoint: string; model: string; needsKey: boolean }> = {
  deepseek: { label: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat', needsKey: true },
  openai: { label: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini', needsKey: true },
  openrouter: { label: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini', needsKey: true },
  ollama: { label: 'Ollama محلي', endpoint: 'http://localhost:11434/v1/chat/completions', model: 'llama3.2', needsKey: false },
  lmstudio: { label: 'LM Studio محلي', endpoint: 'http://localhost:1234/v1/chat/completions', model: 'local-model', needsKey: false },
  custom: { label: 'مزود مخصص', endpoint: '', model: '', needsKey: true },
};

export async function askAI(settings: AISettings, prompt: string): Promise<string> {
  if (!settings.endpoint) throw new Error('أدخل نقطة اتصال المزود المخصص');
  if (AI_PROVIDERS[settings.provider].needsKey && !settings.apiKey.trim()) {
    throw new Error('أدخل مفتاح API أو اختر مزودًا محليًا');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (settings.apiKey.trim()) headers.Authorization = `Bearer ${settings.apiKey.trim()}`;
  if (settings.provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'Smart File Cleaner';
  }

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: settings.model,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'أنت مهندس برمجيات دقيق. أعد فقط نص الملفات بصيغة: المسار ثم المحتوى، وافصل بين الملفات بسطر فارغ. لا تضف شرحًا خارج الملفات.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`فشل اتصال الذكاء الاصطناعي (${response.status})${detail ? `: ${detail.slice(0, 160)}` : ''}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('لم يُرجع المزود محتوى صالحًا');
  return content;
}

export async function extractSharedPage(url: string): Promise<string> {
  const response = await fetch(url, { headers: { Accept: 'text/html,application/xhtml+xml' } });
  if (!response.ok) throw new Error(`تعذر الوصول إلى الرابط (${response.status}). قد تكون حماية الموقع أو CORS تمنع الاستخراج.`);
  const html = await response.text();
  const document = new DOMParser().parseFromString(html, 'text/html');
  const text = document.body?.innerText?.trim() || document.documentElement.textContent?.trim() || '';
  if (!text) throw new Error('الرابط لم يُرجع محتوى قابلًا للقراءة');
  return text;
}
