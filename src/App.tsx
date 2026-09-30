import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Home from '@/pages/Home';

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-[#030a14] flex items-center justify-center text-center" dir="rtl">
    <div>
      <div className="text-6xl font-mono text-cyan-400 mb-4">404</div>
      <p className="text-slate-400 mb-6">الصفحة غير موجودة</p>
      <a href="/" className="px-6 py-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold transition-colors">
        الرجوع للرئيسية
      </a>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-left"
        theme="dark"
        toastOptions={{
          style: {
            background: '#0c1825',
            border: '1px solid rgba(148,163,184,0.2)',
            color: '#e2e8f0',
            fontFamily: '"Cairo", sans-serif',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
