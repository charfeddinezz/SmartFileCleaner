import { CleanMode, DetectionMode, CustomPattern } from '@/types';
import { getFileExtension } from './fileUtils';

// ============================================================
// ADVANCED SMART CLEANING ENGINE v6
// ============================================================

function isCodeLine(line: string, ext: string = ''): boolean {
  const trimmed = line.trim();
  if (trimmed === '') return true;

  const hasCodeSymbols = /[{}()\[\]<>;=+\-*/%&|!~?@#$\\`]/.test(trimmed);
  const isHtmlTag = /^<[!?/]?[a-zA-Z]/.test(trimmed) || trimmed.startsWith('<!') || trimmed.startsWith('<?');
  const isCssPattern =
    /^\s*[.#*:@&>+~\[\]a-zA-Z_-].*\{/.test(trimmed) ||
    /^\s*[a-zA-Z-]+\s*:\s*.+;\s*$/.test(trimmed) ||
    /^\s*@[a-zA-Z]/.test(trimmed) ||
    /^\s*}\s*$/.test(trimmed) ||
    /^\s*\/\*/.test(trimmed);
  const isKeyword =
    /^\s*(import|export|from|require|module|define|namespace|package|use\s+strict|pragma|include|extends|implements|interface|enum|type|declare|abstract|override)\b/.test(trimmed) ||
    /^\s*(function\s*\*?|async\s+function|const\s+\w|let\s+\w|var\s+\w|class\s+\w|new\s+\w|return\s|throw\s|yield\s|await\s|typeof\s|instanceof\s|delete\s)/.test(trimmed) ||
    /^\s*(if\s*\(|else\s*\{|else\s*if|for\s*\(|while\s*\(|do\s*\{|switch\s*\(|case\s+|break;|continue;|default:|try\s*\{|catch\s*\(|finally\s*\{)/.test(trimmed) ||
    /^\s*(console\.(log|warn|error|info)|document\.|window\.|Math\.|JSON\.|Object\.|Array\.|String\.|Promise\.|setTimeout|setInterval|clearTimeout|clearInterval|fetch\(|axios\.)/.test(trimmed) ||
    /^\s*(def\s|print\(|elif\s|except:|lambda\s|with\s|pass$|None$|True$|False$)/.test(trimmed) ||
    /^\s*(public|private|protected|static|readonly|final|void|int|string|bool|float|double|byte|char|long|short)\s+\w/.test(trimmed) ||
    /^\s*(\$[a-zA-Z_]|echo\s|<?php|namespace\s|use\s+\w)/.test(trimmed);
  const isComment = /^\s*(\/\/|\/\*|\*|\*\/|#!|<!--.*-->|<!--$|--)/.test(trimmed);
  const isAssignOrCall =
    /^\s*[\w$]+\s*[=:]\s*/.test(trimmed) ||
    /=>/.test(trimmed) ||
    /\bfunction\b/.test(trimmed) ||
    /\(.*\)\s*\{/.test(trimmed) ||
    /^\s*[\w$.]+\s*\(/.test(trimmed);
  const isDirective =
    /^#!/.test(trimmed) ||
    /^"use (strict|client|server)"/.test(trimmed) ||
    /^'use (strict|client|server)'/.test(trimmed);
  const isDataFormat =
    /^\s*"[^"]+"\s*:/.test(trimmed) ||
    /^\s*-\s+\w/.test(trimmed) ||
    /^\s*[\[{\]}]/.test(trimmed);
  const isTechnicalValue =
    /https?:\/\/|ftp:\/\//.test(trimmed) ||
    /^\.\.\/|\.\.\/|^\.\//i.test(trimmed);

  const isOnlyArabicText = /^[\u0600-\u06FF\s،؛؟!.،:"'()-]+$/.test(trimmed) && trimmed.length > 3;
  if (isOnlyArabicText) return false;

  return hasCodeSymbols || isHtmlTag || isCssPattern || isKeyword || isComment ||
    isAssignOrCall || isDirective || isDataFormat || isTechnicalValue;
}

// ─── HTML cleaner ──────────────────────────────────────────
function cleanHtmlContent(content: string): { cleaned: string; modified: boolean } {
  let cleaned = content;
  let modified = false;

  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
  if (doctypeMatch) {
    const extracted = doctypeMatch[1].trim();
    if (extracted !== cleaned.trim()) { cleaned = extracted; modified = true; }
    return { cleaned, modified };
  }
  const htmlMatch = cleaned.match(/(<html[\s\S]*?<\/html>)/i);
  if (htmlMatch) {
    const extracted = htmlMatch[0].trim();
    if (extracted !== cleaned.trim()) { cleaned = extracted; modified = true; }
    return { cleaned, modified };
  }
  const bodyMatch = cleaned.match(/(<body[\s\S]*?<\/body>)/i);
  if (bodyMatch) {
    const extracted = bodyMatch[0].trim();
    if (extracted !== cleaned.trim()) { cleaned = extracted; modified = true; }
    return { cleaned, modified };
  }
  const firstTag = cleaned.indexOf('<');
  const lastTag = cleaned.lastIndexOf('>');
  if (firstTag !== -1 && lastTag !== -1 && lastTag > firstTag) {
    const extracted = cleaned.substring(firstTag, lastTag + 1).trim();
    if (extracted !== cleaned.trim()) { cleaned = extracted; modified = true; }
    return { cleaned, modified };
  }
  const lines = cleaned.split(/\r?\n/);
  const filtered: string[] = [];
  let foundFirstTag = false;
  for (const line of lines) {
    const t = line.trim();
    if (!foundFirstTag && !t.startsWith('<') && !t.startsWith('<!') && !/[<>]/.test(t)) {
      if (/[\u0600-\u06FF]|^[A-Za-z\s.,!?]+$/.test(t) && t.length > 0) {
        modified = true;
        continue;
      }
    }
    if (/<[a-zA-Z!]/.test(line)) foundFirstTag = true;
    filtered.push(line);
  }
  if (modified) cleaned = filtered.join('\n');
  return { cleaned, modified };
}

function cleanJsonContent(content: string): { cleaned: string; modified: boolean } {
  let cleaned = content;
  let modified = false;
  const firstBrace = Math.min(
    cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{'),
    cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('[')
  );
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (firstBrace !== Infinity && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = cleaned.substring(firstBrace, lastBrace + 1).trim();
    if (extracted !== cleaned.trim()) { cleaned = extracted; modified = true; }
  }
  return { cleaned, modified };
}

function cleanCssContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let braceDepth = 0;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    const opens = (t.match(/\{/g) || []).length;
    const closes = (t.match(/\}/g) || []).length;
    const isCss =
      braceDepth > 0 || /[{};:]/.test(t) || /^\/\*|^\*|^\*\//.test(t) ||
      /^@[a-zA-Z]/.test(t) || /^[.#:*a-zA-Z&+~>\[\]].*\{?/.test(t) ||
      /^[a-zA-Z-]+\s*:\s*/.test(t) || /^\}/.test(t);
    if (isCss) {
      filtered.push(line);
      braceDepth = Math.max(0, braceDepth + opens - closes);
    } else {
      modified = true;
    }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanJsContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultilineComment = false;
  let inTemplateLiteral = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultilineComment) {
      filtered.push(line);
      if (t.includes('*/')) inMultilineComment = false;
      continue;
    }
    if (t.startsWith('/*')) {
      inMultilineComment = !t.includes('*/');
      filtered.push(line);
      continue;
    }
    const backtickCount = (t.match(/`/g) || []).length;
    if (inTemplateLiteral) {
      filtered.push(line);
      if (backtickCount % 2 !== 0) inTemplateLiteral = false;
      continue;
    }
    if (backtickCount % 2 !== 0) inTemplateLiteral = true;
    if (isCodeLine(line, 'js')) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanPythonContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inTripleQuote = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    const tqCount = (t.match(/"""|'''/g) || []).length;
    if (inTripleQuote) {
      filtered.push(line);
      if (tqCount % 2 !== 0) inTripleQuote = false;
      continue;
    }
    if (tqCount % 2 !== 0) { inTripleQuote = true; filtered.push(line); continue; }
    const isPython =
      /^\s*(def |class |import |from |if |elif |else:|for |while |try:|except|finally:|with |return |yield |raise |pass|break|continue|print\(|assert |lambda |@)/.test(t) ||
      /^\s*#/.test(t) || /^\s*[\w.]+\s*=/.test(t) || /^\s*[\w.]+\(/.test(t) ||
      /^\s*[\[{(]/.test(t) || /[()\[\]{}:,=+\-*/%]/.test(t);
    if (isPython) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanPhpContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  let inHeredoc = false;
  let heredocEnd = '';

  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }

    // heredoc support
    if (inHeredoc) {
      filtered.push(line);
      if (t === heredocEnd || t === heredocEnd + ';') inHeredoc = false;
      continue;
    }
    const heredocOpen = t.match(/<<<['"]?([A-Z_]+)['"]?/i);
    if (heredocOpen) { inHeredoc = true; heredocEnd = heredocOpen[1]; filtered.push(line); continue; }

    if (inMultiComment) {
      filtered.push(line);
      if (t.includes('*/')) inMultiComment = false;
      continue;
    }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }

    const isPhp =
      /^(<\?php|<\?=|\?>)/.test(t) ||
      /^\s*\$[a-zA-Z_]/.test(t) ||
      /^\s*(echo|print|return|namespace|use|class|interface|trait|enum|function|if|elseif|else|for|foreach|while|do|switch|case|break|continue|try|catch|finally|throw|new|static|public|private|protected|abstract|readonly|match|yield)\b/.test(t) ||
      /[{}();,=]/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) ||
      /^\s*#/.test(t) ||
      /^\s*\[/.test(t) ||
      /^\s*(declare|include|include_once|require|require_once)\b/.test(t);

    if (isPhp) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanRubyContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    const isRuby =
      /^\s*(def |class |module |require|include|extend|attr_|if |unless |while |until |for |do |end$|begin$|rescue|ensure|raise|return |yield|lambda|proc|puts |print |p |pp )/.test(t) ||
      /^\s*#/.test(t) || /[{}()\[\]|;:=+\-*\/]/.test(t) || /^\s*@[a-zA-Z]/.test(t) ||
      /^\s*:[a-zA-Z]/.test(t) || /^\s*\w+\s*[=|]/.test(t);
    if (isRuby) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanGoContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isGo =
      /^\s*(package|import|func|var|const|type|struct|interface|return|if|else|for|range|switch|case|break|continue|defer|go|chan|select|map|make|new|append|len|cap|delete|panic|recover|print|println)\b/.test(t) ||
      /^\/\//.test(t) || /[{}()\[\];:=+\-*\/,]/.test(t);
    if (isGo) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanRustContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isRust =
      /^\s*(use |mod |pub |fn |let |const |static |struct |enum |trait |impl |type |where |if |else |match |for |while |loop |return |break |continue |async |await |unsafe |extern |crate |super |self |Self)\b/.test(t) ||
      /^\/\//.test(t) || /^#\[/.test(t) || /[{}()\[\];:=+\-*\/,<>|&]/.test(t);
    if (isRust) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanJavaContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*') || t.startsWith('/**')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isJava =
      /^\s*(package|import|public|private|protected|static|final|abstract|class|interface|enum|extends|implements|new|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|void|int|long|short|byte|char|boolean|float|double|String|var|record|sealed|permits)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /^@[A-Z]/.test(t) || /[{}()\[\];:=+\-*\/,<>]/.test(t);
    if (isJava) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanCSharpContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isCs =
      /^\s*(using|namespace|public|private|protected|internal|static|readonly|const|class|interface|struct|enum|record|delegate|event|new|return|if|else|for|foreach|while|do|switch|case|break|continue|try|catch|finally|throw|var|void|int|long|short|byte|char|bool|float|double|decimal|string|object|dynamic|async|await|abstract|sealed|override|virtual|partial|where|in|out|ref|params|base|this|null|true|false)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /^#(region|endregion|if|else|endif|pragma|nullable|define)/.test(t) ||
      /^\[/.test(t) || /[{}()\[\];:=+\-*\/,<>]/.test(t);
    if (isCs) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanShellContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    const isShell =
      /^#/.test(t) ||
      /^\s*(\$|echo|printf|read|export|source|\.|if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|local|declare|typeset|set|unset|shift|trap|cd|ls|cp|mv|rm|mkdir|touch|cat|grep|sed|awk|curl|wget|sudo|chmod|chown|eval|exec|alias|kill|ps|find|xargs)\b/.test(t) ||
      /[{}()\[\]|;&$"'`=+\-*\/]/.test(t);
    if (isShell) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanSwiftContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isSwift =
      /^\s*(import|var|let|func|class|struct|enum|protocol|extension|init|deinit|return|if|else|guard|for|while|repeat|switch|case|break|continue|throw|throws|try|catch|do|defer|where|typealias|associatedtype|operator|subscript|get|set|willSet|didSet|lazy|static|final|override|required|convenience|mutating|nonmutating|open|public|internal|fileprivate|private|weak|unowned|inout|@)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /[{}()\[\];:=+\-*\/,<>|&?!]/.test(t);
    if (isSwift) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanKotlinContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isKotlin =
      /^\s*(package|import|fun|val|var|class|object|interface|data|sealed|enum|abstract|open|override|private|protected|public|internal|companion|init|constructor|return|if|else|when|for|while|do|break|continue|try|catch|finally|throw|in|is|as|by|get|set|it|null|true|false|this|super|typealias|operator|infix|inline|suspend|coroutine|launch|async|await)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /^@[A-Z]/.test(t) || /[{}()\[\];:=+\-*\/,<>|&?!]/.test(t);
    if (isKotlin) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanDartContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isDart =
      /^\s*(import|export|library|part|class|abstract|interface|mixin|enum|extension|typedef|var|final|const|late|dynamic|void|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|rethrow|async|await|sync|yield|new|this|super|null|true|false|as|is|in)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /^@/.test(t) || /[{}()\[\];:=+\-*\/,<>|&?!]/.test(t);
    if (isDart) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanLuaContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes(']]')) inMultiComment = false; continue; }
    if (t.startsWith('--[[')) { inMultiComment = !t.includes(']]'); filtered.push(line); continue; }
    const isLua =
      /^\s*(local|function|return|if|then|else|elseif|end|for|while|do|repeat|until|break|and|or|not|nil|true|false|in|require|print|io\.|os\.|table\.|string\.|math\.|coroutine\.)\b/.test(t) ||
      /^--/.test(t) || /[{}()\[\];:=+\-*\/,#]/.test(t);
    if (isLua) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanCContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isC =
      /^\s*(#include|#define|#ifdef|#ifndef|#endif|#pragma|#if|#else|#undef|#error|#warning)\b/.test(t) ||
      /^\s*(int|long|short|char|void|float|double|unsigned|signed|struct|union|enum|typedef|extern|static|const|volatile|register|auto|return|if|else|for|while|do|switch|case|break|continue|goto|sizeof|typeof|inline|restrict)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /[{}()\[\];:=+\-*\/,<>&|^~!%]/.test(t);
    if (isC) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanScalaContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isScala =
      /^\s*(package|import|class|object|trait|extends|with|def|val|var|lazy|type|abstract|sealed|final|override|private|protected|implicit|case|match|if|else|for|yield|while|do|return|throw|try|catch|finally|new|this|super|null|true|false|=>|<-)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /^@/.test(t) || /[{}()\[\];:=+\-*\/,<>|&?!]/.test(t);
    if (isScala) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanGroovyContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered: string[] = [];
  let modified = false;
  let inMultiComment = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '') { filtered.push(line); continue; }
    if (inMultiComment) { filtered.push(line); if (t.includes('*/')) inMultiComment = false; continue; }
    if (t.startsWith('/*')) { inMultiComment = !t.includes('*/'); filtered.push(line); continue; }
    const isGroovy =
      /^\s*(package|import|class|interface|def|return|if|else|for|while|switch|case|break|continue|try|catch|finally|throw|new|this|super|null|true|false|public|private|protected|static|final|abstract)\b/.test(t) ||
      /^\/\//.test(t) || /^\*/.test(t) || /^@/.test(t) || /[{}()\[\];:=+\-*\/,<>|&?!]/.test(t);
    if (isGroovy) { filtered.push(line); } else { modified = true; }
  }
  return { cleaned: filtered.join('\n'), modified };
}

function cleanVueContent(content: string): { cleaned: string; modified: boolean } {
  const firstTag = content.indexOf('<');
  const lastTag = content.lastIndexOf('>');
  if (firstTag > 0) {
    const extracted = content.substring(firstTag, lastTag + 1).trim();
    if (extracted !== content.trim()) return { cleaned: extracted, modified: true };
  }
  return { cleaned: content, modified: false };
}

function cleanGraphQLContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered = lines.filter(line => {
    const t = line.trim();
    if (!t) return true;
    return /^\s*(type|query|mutation|subscription|fragment|schema|input|enum|interface|union|scalar|directive|extend|on|implements)\b/.test(t) ||
      /^#/.test(t) || /[{}():,=@!|&]/.test(t) || /^\s*\w+[\s\(]/.test(t) || /^\s*\.\.\.[a-zA-Z]/.test(t);
  });
  const modified = filtered.length !== lines.length;
  return { cleaned: filtered.join('\n'), modified };
}

function cleanTomlContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered = lines.filter(line => {
    const t = line.trim();
    if (!t) return true;
    return /^#/.test(t) || /^\[/.test(t) || /^\s*[a-zA-Z_-].*=/.test(t) || /[=\[\]{},.]/.test(t);
  });
  const modified = filtered.length !== lines.length;
  return { cleaned: filtered.join('\n'), modified };
}

function cleanIniContent(content: string): { cleaned: string; modified: boolean } {
  const lines = content.split(/\r?\n/);
  const filtered = lines.filter(line => {
    const t = line.trim();
    if (!t) return true;
    return /^[#;]/.test(t) || /^\[/.test(t) || /^\s*[a-zA-Z_].*=/.test(t);
  });
  const modified = filtered.length !== lines.length;
  return { cleaned: filtered.join('\n'), modified };
}

// ============================================================
// MAIN CLEAN FILE ENTRY POINT
// ============================================================

export function cleanFileContent(
  content: string,
  filePath: string,
  mode: CleanMode
): { cleaned: string; wasCleaned: boolean } {
  if (mode === 'none') return { cleaned: content, wasCleaned: false };

  const ext = getFileExtension(filePath);
  let cleaned = content;
  let wasCleaned = false;

  // ── HTML / HTM ──────────────────────────────────────────
  if (ext === 'html' || ext === 'htm' || ext === 'xhtml') {
    const r = cleanHtmlContent(content);
    cleaned = r.cleaned; wasCleaned = r.modified;
    if (mode === 'all') {
      const lines = cleaned.split(/\r?\n/);
      const filtered: string[] = [];
      let insideTag = false, removed = false;
      for (const line of lines) {
        const t = line.trim();
        if (t === '') { filtered.push(line); continue; }
        if (/<[a-zA-Z!/?]/.test(line)) insideTag = true;
        if (/>/.test(line)) insideTag = false;
        if (insideTag || /<[a-zA-Z!/?]/.test(t) || /^<!/.test(t) || isCodeLine(line, ext)) {
          filtered.push(line);
        } else { removed = true; }
      }
      if (removed) { cleaned = filtered.join('\n'); wasCleaned = true; }
    }
  }
  // ── CSS / SCSS / SASS / LESS / STYL ────────────────────
  else if (['css', 'scss', 'sass', 'less', 'styl'].includes(ext)) {
    if (mode === 'all') { const r = cleanCssContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── JS / TS / JSX / TSX ────────────────────────────────
  else if (['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'mts', 'cts', 'd'].includes(ext)) {
    if (mode === 'all') { const r = cleanJsContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── JSON / JSON5 / JSONC ────────────────────────────────
  else if (['json', 'json5', 'jsonc'].includes(ext)) {
    const r = cleanJsonContent(content); cleaned = r.cleaned; wasCleaned = r.modified;
  }
  // ── Python ─────────────────────────────────────────────
  else if (['py', 'pyw'].includes(ext)) {
    if (mode === 'all') { const r = cleanPythonContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── PHP ────────────────────────────────────────────────
  else if (ext === 'php') {
    if (mode === 'all') { const r = cleanPhpContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Ruby ───────────────────────────────────────────────
  else if (['rb', 'erb', 'rake', 'gemfile'].includes(ext)) {
    if (mode === 'all') { const r = cleanRubyContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Go ─────────────────────────────────────────────────
  else if (ext === 'go') {
    if (mode === 'all') { const r = cleanGoContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Rust ───────────────────────────────────────────────
  else if (ext === 'rs') {
    if (mode === 'all') { const r = cleanRustContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Java ───────────────────────────────────────────────
  else if (['java', 'class'].includes(ext)) {
    if (mode === 'all') { const r = cleanJavaContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── C# ─────────────────────────────────────────────────
  else if (['cs', 'csx'].includes(ext)) {
    if (mode === 'all') { const r = cleanCSharpContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── C / C++ ────────────────────────────────────────────
  else if (['c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx'].includes(ext)) {
    if (mode === 'all') { const r = cleanCContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Swift ──────────────────────────────────────────────
  else if (ext === 'swift') {
    if (mode === 'all') { const r = cleanSwiftContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Kotlin ─────────────────────────────────────────────
  else if (['kt', 'kts'].includes(ext)) {
    if (mode === 'all') { const r = cleanKotlinContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Dart ───────────────────────────────────────────────
  else if (ext === 'dart') {
    if (mode === 'all') { const r = cleanDartContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Lua ────────────────────────────────────────────────
  else if (ext === 'lua') {
    if (mode === 'all') { const r = cleanLuaContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Scala ──────────────────────────────────────────────
  else if (['scala', 'sc'].includes(ext)) {
    if (mode === 'all') { const r = cleanScalaContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Groovy / Gradle ────────────────────────────────────
  else if (['groovy', 'gradle'].includes(ext)) {
    if (mode === 'all') { const r = cleanGroovyContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Shell / Bash ───────────────────────────────────────
  else if (['sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'].includes(ext)) {
    if (mode === 'all') { const r = cleanShellContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── SQL ────────────────────────────────────────────────
  else if (['sql', 'mysql', 'pgsql', 'sqlite'].includes(ext)) {
    if (mode === 'all') {
      const lines = content.split(/\r?\n/);
      const filtered = lines.filter(line => {
        const t = line.trim().toUpperCase();
        if (!t) return true;
        return /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|WITH|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|FULL|ON|GROUP|ORDER|HAVING|UNION|LIMIT|OFFSET|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|GRANT|REVOKE|INDEX|VIEW|TRIGGER|PROCEDURE|FUNCTION|DECLARE|SET|INTO|VALUES|TABLE|DATABASE|SCHEMA|COLUMN|ADD|MODIFY|RENAME|CONSTRAINT|PRIMARY|FOREIGN|KEY|UNIQUE|NOT|NULL|DEFAULT|CHECK|REFERENCES|CASCADE|RESTRICT|DISTINCT|AS|AND|OR|IN|EXISTS|BETWEEN|LIKE|IS|ASC|DESC|--|\/\*)/.test(t) ||
          /[();,=<>]/.test(t);
      });
      if (filtered.length !== lines.length) { cleaned = filtered.join('\n'); wasCleaned = true; }
    }
  }
  // ── XML / SVG ──────────────────────────────────────────
  else if (['xml', 'svg', 'xsl', 'xslt', 'wsdl', 'rss', 'atom', 'plist'].includes(ext)) {
    const firstTag = cleaned.indexOf('<');
    const lastTag = cleaned.lastIndexOf('>');
    if (firstTag > 0 || (lastTag !== -1 && lastTag < cleaned.length - 1)) {
      cleaned = cleaned.substring(firstTag === -1 ? 0 : firstTag, lastTag === -1 ? cleaned.length : lastTag + 1).trim();
      wasCleaned = true;
    }
  }
  // ── YAML / YML ─────────────────────────────────────────
  else if (['yaml', 'yml'].includes(ext)) {
    if (mode === 'all') {
      const lines = content.split(/\r?\n/);
      const filtered = lines.filter(line => {
        const t = line.trim();
        if (!t) return true;
        return /^(#|---|\.\.\.|\s*[a-zA-Z0-9_"'\-]+\s*:|\s*-\s)/.test(t) || /:\s/.test(t) || /^\s*\|/.test(t) || /^\s*>/.test(t);
      });
      if (filtered.length !== lines.length) { cleaned = filtered.join('\n'); wasCleaned = true; }
    }
  }
  // ── TOML ───────────────────────────────────────────────
  else if (ext === 'toml') {
    if (mode === 'all') { const r = cleanTomlContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── INI / CFG / CONF ───────────────────────────────────
  else if (['ini', 'cfg', 'conf', 'env', 'editorconfig', 'npmrc', 'nvmrc'].includes(ext)) {
    if (mode === 'all') { const r = cleanIniContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Vue / Svelte / Astro ───────────────────────────────
  else if (['vue', 'svelte', 'astro'].includes(ext)) {
    if (mode === 'all') { const r = cleanVueContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── GraphQL ────────────────────────────────────────────
  else if (['graphql', 'gql'].includes(ext)) {
    if (mode === 'all') { const r = cleanGraphQLContent(content); cleaned = r.cleaned; wasCleaned = r.modified; }
  }
  // ── Markdown (preserve as-is but strip leading non-md text) ──
  else if (['md', 'mdx', 'rst'].includes(ext)) {
    // Keep all — markdown text IS content, do not clean
  }
  // ── Fallback: generic code-line filter ─────────────────
  else if (mode === 'all') {
    const lines = content.split(/\r?\n/);
    const filtered = lines.filter(line => isCodeLine(line, ext));
    if (filtered.length !== lines.length) { cleaned = filtered.join('\n'); wasCleaned = true; }
  }

  // ── Final normalize ────────────────────────────────────
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').replace(/^\s*\n+|\n+\s*$/g, '');

  // ── Placeholder for fully-emptied files ────────────────
  if (wasCleaned && cleaned.trim() === '') {
    if (['html', 'htm', 'xhtml'].includes(ext))              cleaned = '<!-- تم تنظيف الملف: لم يتبقَ محتوى برمجي صالح -->';
    else if (['css', 'scss', 'sass', 'less', 'styl'].includes(ext)) cleaned = '/* تم تنظيف الملف: لم يتبقَ محتوى CSS صالح */';
    else if (['py', 'pyw'].includes(ext))                    cleaned = '# تم تنظيف الملف: لم يتبقَ كود Python صالح';
    else if (['rb'].includes(ext))                           cleaned = '# تم تنظيف الملف: لم يتبقَ كود Ruby صالح';
    else if (['sql', 'mysql', 'pgsql'].includes(ext))        cleaned = '-- تم تنظيف الملف: لم يتبقَ كود SQL صالح';
    else if (['sh', 'bash', 'zsh', 'fish'].includes(ext))   cleaned = '# تم تنظيف الملف: لم يتبقَ أوامر Shell صالحة';
    else if (['xml', 'svg'].includes(ext))                  cleaned = '<!-- تم تنظيف الملف: لم يتبقَ محتوى XML صالح -->';
    else                                                      cleaned = '// تم تنظيف الملف: لم يتبقَ محتوى برمجي صالح';
  }

  return { cleaned, wasCleaned };
}

export function cleanExistingFiles(
  files: Array<{ path: string; content: string; originalContent?: string; wasCleaned?: boolean }>,
  mode: CleanMode
): Array<{ path: string; content: string; originalContent: string; wasCleaned: boolean }> {
  return files.map(file => {
    const sourceContent = file.originalContent ?? file.content;
    const { cleaned, wasCleaned } = cleanFileContent(sourceContent, file.path, mode);
    return { path: file.path, content: cleaned, originalContent: sourceContent, wasCleaned };
  });
}

// ============================================================
// SMART PATH DETECTOR v6 — multi-mode + custom patterns
// ============================================================

const KNOWN_EXTS = new Set([
  'html','htm','xhtml','css','scss','sass','less','styl',
  'js','mjs','cjs','ts','tsx','jsx','mts','cts','d',
  'json','json5','jsonc','xml','csv','tsv','yaml','yml','toml','ini','cfg','conf','env','lock',
  'md','mdx','rst','txt','rtf',
  'php','py','pyw','rb','go','java','kt','kts','swift','rs','c','cpp','cc','cxx','h','hpp','hxx',
  'cs','csx','vb','fs','ex','exs','erl','hrl','clj','cljs','hs','lhs','lua','r','m','pl','pm',
  'scala','sc','groovy','gradle','dart',
  'sh','bash','zsh','fish','ps1','bat','cmd',
  'sql','sqlite','db','mysql','pgsql',
  'dockerfile','tf','tfvars',
  'vue','astro','svelte','njk','hbs','ejs','pug','twig','blade','erb',
  'graphql','gql',
  'svg','webp','png','jpg','jpeg','gif','ico','woff','woff2','ttf','otf','eot',
  'map','wasm','htaccess','gitignore','eslintrc','babelrc','editorconfig',
  'prettierrc','stylelintrc','npmrc','nvmrc',
]);

function isValidFilePath(candidate: string): boolean {
  if (!candidate || candidate.length < 2) return false;
  const c = candidate.replace(/^[./]+/, '').trim();
  if (!c) return false;
  if (/https?:\/\/|ftp:\/\/|data:|mailto:/.test(candidate)) return false;
  if (/[{}()\[\];=+*&|!~`?@$\\,"']/.test(c)) return false;

  const extMatch = c.match(/\.([a-zA-Z0-9]{1,15})$/);
  if (!extMatch) {
    const base = c.split('/').pop()?.toLowerCase() || '';
    const EXTENSIONLESS = new Set([
      'makefile','dockerfile','gemfile','rakefile','procfile','vagrantfile',
      'readme','license','changelog','authors','contributing',
      '.htaccess','.gitignore','.gitattributes','.editorconfig','.npmrc','.nvmrc',
      '.eslintrc','.prettierrc','.babelrc','.stylelintrc','.env','.env',
    ]);
    if (!EXTENSIONLESS.has(base) && !base.startsWith('.')) return false;
    return c.includes('/') || EXTENSIONLESS.has(base);
  }

  const ext = extMatch[1].toLowerCase();
  if (!KNOWN_EXTS.has(ext) && ext.length < 2) return false;
  if (/^\d+\.[a-zA-Z]+$/.test(c)) return false;
  if (/^\d+(\.\d+)+$/.test(c)) return false;
  if (!/^[a-zA-Z0-9_./-]/.test(c)) return false;
  return true;
}

function extractPathToken(text: string): string | null {
  const candidates: string[] = [];

  const WITH_SLASH = /(?:^|[\s:>\-*#\[\]|'"/,(])((\.\.?\/)?[a-zA-Z0-9_][a-zA-Z0-9_.\-]*(?:\/[a-zA-Z0-9_.\-]+)+(?:\.[a-zA-Z0-9]{1,15})?)(?=[\s,;|'")\]>]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = WITH_SLASH.exec(text)) !== null) {
    const cand = m[1].trim().replace(/[/]+$/, '');
    if (isValidFilePath(cand)) candidates.push(cand);
  }

  const EXTENSIONLESS_PATH = /(?:^|[\s:>])((?:[a-zA-Z0-9_.\-]+\/)+(?:makefile|dockerfile|gemfile|rakefile|procfile|readme|license|\.htaccess|\.gitignore|\.env))(?=[\s,;|"'\]>]|$)/gi;
  while ((m = EXTENSIONLESS_PATH.exec(text)) !== null) {
    const cand = m[1].trim();
    if (isValidFilePath(cand)) candidates.push(cand);
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      const sa = (a.match(/\//g) || []).length;
      const sb = (b.match(/\//g) || []).length;
      return sb - sa || b.length - a.length;
    });
    return candidates[0];
  }

  const SINGLE = /(?:^|[\s:>\-*#\[\]|'"/,(])([a-zA-Z_][a-zA-Z0-9_.\-]*\.([a-zA-Z]{2,12}))(?:\s*$)/;
  const sm = text.match(SINGLE);
  if (sm && sm[2] && KNOWN_EXTS.has(sm[2].toLowerCase())) {
    const cand = sm[1].trim();
    if (isValidFilePath(cand)) return cand;
  }

  return null;
}

function detectStrict(line: string): string | null {
  const t = line.trim();
  if (!t) return null;
  if (/^(import|export|const|let|var|function|class|return|if|else|for|while|switch|try|catch|<|\{|\[|\(|\/\/|\/\*|\*\s|#!|@)/.test(t)) return null;
  if (/^[{}()\[\]<>;=+\-%&|!~?$`]/.test(t)) return null;
  const firstSlash = t.indexOf('/');
  if (firstSlash > 0 && /\s/.test(t.substring(0, firstSlash))) return null;
  if (!isValidFilePath(t)) return null;
  return t;
}

function detectNumbered(line: string): string | null {
  const m = line.match(/^\s*(?:[\[(]?\d+[\])]?[.:)\s]\s*|#\d+\s+)(.+)$/);
  if (!m) return null;
  const rest = m[1].trim();
  return extractPathToken(rest) ?? detectStrict(rest);
}

function detectArabic(line: string): string | null {
  const m = line.match(/^\s*[\u0600-\u06FF][\u0600-\u06FF\s\d#]*[:：\-–—]\s*(.+)$/);
  if (!m) return null;
  const rest = m[1].trim();
  return extractPathToken(rest) ?? detectStrict(rest);
}

function detectColon(line: string): string | null {
  const t = line.trim();
  if (detectStrict(t)) return null;
  const m = t.match(/^[^/]+?[:：\-–]\s+(.+)$/);
  if (!m) return null;
  const rest = m[1].trim();
  return extractPathToken(rest) ?? detectStrict(rest);
}

function detectHashHeading(line: string): string | null {
  const m = line.match(/^\s*#{1,6}\s+(.+)$/);
  if (!m) return null;
  return extractPathToken(m[1].trim()) ?? detectStrict(m[1].trim());
}

function detectBracket(line: string): string | null {
  const m = line.match(/^\s*(?:\[([^\]]+)\]|\(([^)]+)\)|>\s*(.+)|\|\s*(.+))\s*$/);
  const rest = (m?.[1] ?? m?.[2] ?? m?.[3] ?? m?.[4])?.trim();
  if (!rest) return null;
  return detectStrict(rest) ?? extractPathToken(rest);
}

export function detectCustom(line: string, patterns: CustomPattern[]): string | null {
  const activePatterns = patterns.filter(p => p.enabled);
  for (const p of activePatterns) {
    try {
      const rx = new RegExp(p.regex, p.flags || 'i');
      const m = rx.exec(line);
      if (m) {
        const candidate = (m[1] ?? m[0]).trim();
        if (candidate && isValidFilePath(candidate)) return candidate;
        const extracted = extractPathToken(candidate || m[0]);
        if (extracted) return extracted;
      }
    } catch (e) {
      console.warn(`Custom pattern "${p.name}" has invalid regex:`, e);
    }
  }
  return null;
}

function detectAuto(line: string, customPatterns: CustomPattern[] = []): string | null {
  const t = line.trim();
  if (!t) return null;
  if (/^(import\s|export\s|const\s|let\s|var\s|function\s|class\s|return\s|if\s*\(|else[\s{]|for\s*\(|while\s*\(|switch\s*\(|=>|\/\/|\/\*|\*\s|<!--)/.test(t)) return null;
  if (/^[{}()\[\]<>;=+\-%&|!~?$`]/.test(t)) return null;
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s/i.test(t)) return null;
  if (/^\s*(body|html|div|span|header|footer|nav|main|section|article)\s*\{/i.test(t)) return null;
  if (/^[\u0600-\u06FF\s،؛؟!.،:"'()-]+$/.test(t) && !t.includes('/') && !/\.[a-zA-Z]{2,}$/.test(t)) return null;
  if (/^[A-Za-z][A-Za-z\s.,!?;:"'()-]{15,}$/.test(t) && !t.includes('/') && !/\.[a-zA-Z]{2,}$/.test(t)) return null;

  return (
    detectStrict(line) ??
    detectArabic(line) ??
    detectNumbered(line) ??
    detectColon(line) ??
    detectHashHeading(line) ??
    detectBracket(line) ??
    (customPatterns.length > 0 ? detectCustom(line, customPatterns) : null) ??
    extractPathToken(line)
  );
}

export function extractFilePath(
  line: string,
  mode: DetectionMode = 'auto',
  customPatterns: CustomPattern[] = []
): string | null {
  switch (mode) {
    case 'strict':   return detectStrict(line);
    case 'numbered': return detectNumbered(line) ?? detectStrict(line);
    case 'arabic':   return detectArabic(line) ?? detectStrict(line);
    case 'colon':    return detectColon(line) ?? detectStrict(line);
    case 'markdown': return null;
    case 'custom':   return detectCustom(line, customPatterns) ?? detectStrict(line);
    case 'auto':
    default:         return detectAuto(line, customPatterns);
  }
}

// ─── Code fence parser ─────────────────────────────────────
function parseCodeFence(line: string): { isOpen: boolean; isClose: boolean; lang?: string; path?: string } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('```') && !trimmed.startsWith('~~~')) return null;
  const fence = trimmed.startsWith('```') ? '```' : '~~~';
  if (trimmed === fence) return { isOpen: false, isClose: true };
  const rest = trimmed.slice(fence.length).trim();
  if (!rest) return { isOpen: false, isClose: true };
  const parts = rest.split(/\s+/);
  const lang = parts[0]?.replace(/[^a-zA-Z0-9_+#]/g, '') || '';
  const pathCandidate = parts.slice(1).join(' ').trim();
  const path = pathCandidate && isValidFilePath(pathCandidate) ? pathCandidate : undefined;
  return { isOpen: true, isClose: false, lang, path };
}

const LANG_TO_EXT: Record<string, string> = {
  javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts',
  jsx: 'jsx', tsx: 'tsx', html: 'html', css: 'css', scss: 'scss',
  sass: 'sass', json: 'json', python: 'py', py: 'py', php: 'php',
  sql: 'sql', xml: 'xml', yaml: 'yaml', yml: 'yml', sh: 'sh',
  bash: 'sh', shell: 'sh', markdown: 'md', md: 'md', go: 'go',
  java: 'java', rust: 'rs', ruby: 'rb', kotlin: 'kt', swift: 'swift',
  c: 'c', cpp: 'cpp', cs: 'cs', vue: 'vue', svelte: 'svelte',
  astro: 'astro', graphql: 'graphql', dart: 'dart', lua: 'lua',
  scala: 'scala', groovy: 'groovy', r: 'r', perl: 'pl',
};

// ─── Helper: collect content from inside a fence block ────
function collectFenceContent(lines: string[], startI: number): { contentLines: string[]; nextI: number } {
  const contentLines: string[] = [];
  let i = startI;
  while (i < lines.length) {
    const currentLine = lines[i];
    const closingFence = parseCodeFence(currentLine);
    if (closingFence && (closingFence.isClose || !closingFence.isOpen)) {
      i++; // consume closing fence
      break;
    }
    contentLines.push(currentLine);
    i++;
  }
  return { contentLines, nextI: i };
}

// ─── Helper: find next non-blank line index ────────────────
function nextNonBlankIndex(lines: string[], from: number): number {
  let idx = from;
  while (idx < lines.length && !lines[idx].trim()) idx++;
  return idx;
}

export function parseTextToFiles(
  rawText: string,
  detectionMode: DetectionMode = 'auto',
  customPatterns: CustomPattern[] = []
): Array<{ path: string; content: string; detectedLang?: string }> {
  const lines = rawText.split(/\r?\n/);
  const result: Array<{ path: string; content: string; detectedLang?: string }> = [];

  let i = 0;
  let fenceUnnamedCount = 0;

  // Tracks a "pending" file path whose content we're about to collect
  let pendingPath: string | null = null;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // ── Check for a code fence ────────────────────────────
    const fence = parseCodeFence(line);
    if (fence?.isOpen) {
      let filePath: string | null = null;
      let fenceLang = fence.lang;

      // Case 1: path embedded in the fence info line  ```php src/handler.php
      if (fence.path) {
        filePath = fence.path;
        pendingPath = null; // consumed
      }
      // Case 2: path was detected on the previous line (pendingPath)
      else if (pendingPath) {
        filePath = pendingPath;
        pendingPath = null;
      }
      // Case 3: look AHEAD one non-blank line for a path label
      else {
        const aheadI = nextNonBlankIndex(lines, i + 1);
        if (aheadI < lines.length && aheadI <= i + 3) {
          const aheadLine = lines[aheadI];
          const aheadPath = extractFilePath(aheadLine, detectionMode, customPatterns);
          // Only treat as a path label if it's NOT code content
          if (aheadPath && !isCodeLine(aheadLine, aheadPath.split('.').pop() || '')) {
            filePath = aheadPath;
            i = aheadI; // skip the path label line
          }
        }
      }

      // Fallback: generate a snippet name
      if (!filePath) {
        fenceUnnamedCount++;
        const ext = fenceLang ? (LANG_TO_EXT[fenceLang.toLowerCase()] || fenceLang) : 'txt';
        filePath = `snippet_${fenceUnnamedCount}.${ext}`;
      }

      i++; // move past the opening fence line
      const { contentLines, nextI } = collectFenceContent(lines, i);
      i = nextI;

      const content = contentLines.join('\n').replace(/^\n+|\n+$/g, '');
      result.push({ path: filePath, content, detectedLang: fenceLang });
      continue;
    }

    // ── If we have a pendingPath and this is content, collect it ──
    if (pendingPath) {
      const contentLines: string[] = [];
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentTrimmed = currentLine.trim();

        // Encountered a fence — treat its content as belonging to pendingPath
        const cf = parseCodeFence(currentLine);
        if (cf?.isOpen) {
          i++; // skip opening fence
          const { contentLines: fenceLines, nextI } = collectFenceContent(lines, i);
          contentLines.push(...fenceLines);
          i = nextI;
          break; // fence consumed, done with this file's content
        }

        // Check if this line is a NEW path declaration
        if (currentTrimmed) {
          const nextPath = extractFilePath(currentLine, detectionMode, customPatterns);
          if (nextPath && nextPath !== pendingPath) break; // start of next file
        }

        contentLines.push(currentLine);
        i++;
      }

      const content = contentLines.join('\n').replace(/^\n+|\n+$/g, '');
      result.push({ path: pendingPath, content });
      pendingPath = null;
      continue;
    }

    if (detectionMode === 'markdown') { i++; continue; }

    // ── Try to detect a path line ─────────────────────────
    const extractedPath = extractFilePath(line, detectionMode, customPatterns);
    if (extractedPath) {
      i++;
      // Check if IMMEDIATELY followed (ignoring blanks) by a code fence
      const nbI = nextNonBlankIndex(lines, i);
      if (nbI < lines.length && parseCodeFence(lines[nbI])?.isOpen) {
        // Skip blanks, then process fence in next iteration with pendingPath set
        pendingPath = extractedPath;
        i = nbI; // position at the fence, let the fence branch handle it
      } else {
        pendingPath = extractedPath;
        // Will be collected in the pendingPath branch above on next iteration
      }
      continue;
    }

    i++;
  }

  // Flush any remaining pendingPath with no content
  if (pendingPath) {
    result.push({ path: pendingPath, content: '' });
  }

  return result;
}

export function mergeDuplicates(
  files: Array<{ path: string; content: string }>,
  strategy: 'merge' | 'keepLast' | 'keepLongest'
): { files: Array<{ path: string; content: string }>; duplicatesHandled: number } {
  const map = new Map<string, string[]>();
  for (const file of files) {
    if (!map.has(file.path)) map.set(file.path, []);
    map.get(file.path)!.push(file.content);
  }
  const result: Array<{ path: string; content: string }> = [];
  let duplicatesHandled = 0;
  for (const [path, contents] of map.entries()) {
    if (contents.length === 1) {
      result.push({ path, content: contents[0] });
    } else {
      duplicatesHandled += contents.length - 1;
      if (strategy === 'merge') {
        const merged = contents.map((c, idx) => `/* ===== نسخة ${idx + 1} ===== */\n${c}`).join('\n\n');
        result.push({ path, content: merged });
      } else if (strategy === 'keepLast') {
        result.push({ path, content: contents[contents.length - 1] });
      } else {
        const longest = contents.reduce((a, b) => (a.length >= b.length ? a : b), '');
        result.push({ path, content: longest });
      }
    }
  }
  return { files: result, duplicatesHandled };
}

export function validateCustomRegex(regexStr: string, flags: string): string | null {
  if (!regexStr.trim()) return 'الـ Regex لا يمكن أن يكون فارغاً';
  try {
    const rx = new RegExp(regexStr, flags || 'i');
    const testGroups = rx.exec('test/path/file.ts');
    void testGroups;
    return null;
  } catch (e: any) {
    return `خطأ في الـ Regex: ${e.message}`;
  }
}

export function testCustomPattern(
  regexStr: string,
  flags: string,
  sampleLine: string
): { matched: boolean; path: string | null; groups: string[] } {
  try {
    const rx = new RegExp(regexStr, flags || 'i');
    const m = rx.exec(sampleLine);
    if (!m) return { matched: false, path: null, groups: [] };
    const candidate = (m[1] ?? m[0]).trim();
    const path = isValidFilePath(candidate) ? candidate : (extractPathToken(candidate) ?? null);
    return { matched: true, path, groups: Array.from(m).slice(1).filter(Boolean) };
  } catch {
    return { matched: false, path: null, groups: [] };
  }
}
