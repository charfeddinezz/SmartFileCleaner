export const STORAGE_KEY_FILES = 'smartcleaner_files_v2';
export const STORAGE_KEY_EDITOR = 'smartcleaner_editor_v2';
export const STORAGE_KEY_SETTINGS = 'smartcleaner_settings_v2';

export const FILE_ICONS: Record<string, string> = {
  html: '🌐',
  htm: '🌐',
  css: '🎨',
  scss: '🎨',
  sass: '🎨',
  js: '⚡',
  mjs: '⚡',
  cjs: '⚡',
  ts: '🔷',
  tsx: '🔷',
  jsx: '⚛️',
  json: '📋',
  xml: '📄',
  md: '📝',
  txt: '📄',
  php: '🐘',
  py: '🐍',
  rb: '💎',
  go: '🐹',
  java: '☕',
  cs: '🔵',
  cpp: '⚙️',
  c: '⚙️',
  sh: '🖥️',
  sql: '🗄️',
  svg: '🖼️',
  htaccess: '⚙️',
  env: '🔑',
  gitignore: '🚫',
  dockerfile: '🐳',
};

export const FILE_COLORS: Record<string, string> = {
  html: 'text-orange-400',
  htm: 'text-orange-400',
  css: 'text-blue-400',
  scss: 'text-pink-400',
  js: 'text-yellow-400',
  ts: 'text-blue-500',
  tsx: 'text-cyan-400',
  jsx: 'text-cyan-400',
  json: 'text-green-400',
  md: 'text-gray-300',
  py: 'text-yellow-300',
  php: 'text-purple-400',
  sql: 'text-teal-400',
  sh: 'text-lime-400',
  go: 'text-cyan-300',
  rb: 'text-red-400',
};

// Sample text demonstrating SMART PATH DETECTION v4:
export const SAMPLE_TEXT = `الملف الأول: project/index.html
نص خارجي قبل الوسوم يجب حذفه تلقائياً!!
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>موقع نظيف</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>مرحباً بالعالم</h1>
  <p>هذا موقع تجريبي نظيف</p>
  <script src="app.js"><\/script>
</body>
</html>
نص بعد الإغلاق سيتم حذفه أيضاً

2. project/app.js
// JavaScript File - منطق التطبيق
هذه جملة عادية خارج الكود سيتم حذفها تلقائياً
const greeting = "مرحباً";
function showGreeting() {
  console.log(greeting);
  document.querySelector('h1').textContent = greeting;
}
كلمات فضفاضة بين الكود ستختفي!
showGreeting();

الملف 50: app/Modules/Publisher/PlatformAdapters/BloggerAdapter.php
<?php
namespace App\\Modules\\Publisher\\PlatformAdapters;
class BloggerAdapter {
  public function publish(array $post): bool {
    return true;
  }
}

ملف: project/style.css
/* ملف التنسيق */
نص خارج السياق سيُحذف هنا
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Cairo', sans-serif; background: #0b1a2e; color: #eee; }
h1 { color: #00b4d8; font-size: 2rem; }

ملف: project/data/config.json
{
  "version": "1.0.0",
  "theme": "dark",
  "language": "ar"
}
\`\`\`php project/api/handler.php
<?php
  $data = json_decode(file_get_contents('php://input'), true);
  echo json_encode(['status' => 'ok', 'data' => $data]);
?>
\`\`\`
`;
