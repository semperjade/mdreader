(function () {
  'use strict';

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const welcome = $('welcome');
  const dropZone = $('dropZone');
  const reader = $('reader');
  const content = $('content');
  const toc = $('toc');
  const fileNameEl = $('fileName');
  const openBtn = $('openBtn');
  const openBtn2 = $('openBtn2');
  const fileInput = $('fileInput');
  const fileInput2 = $('fileInput2');
  const searchInput = $('searchInput');
  const copyBtn = $('copyBtn');
  const exportBtn = $('exportBtn');
  const matchBox = $('matchBox');
  const matchInfo = $('matchInfo');
  const matchPrev = $('matchPrev');
  const matchNext = $('matchNext');
  const matchClose = $('matchClose');
  const backTop = $('backTop');
  const toggleSidebar = $('toggleSidebar');

  let currentMarkdown = '';
  let headings = [];
  let scrollSpyTimer = null;

  // ---------- 渲染 ----------
  marked.setOptions({ breaks: true, gfm: true });

  function render() {
    let html;
    try {
      html = marked.parse(currentMarkdown || '');
    } catch (e) {
      html = '<p style="color:#c62828">渲染出错：' + e.message + '</p>';
    }
    content.innerHTML = DOMPurify.sanitize(html);

    collectHeadings();
    buildToc();
    attachHeadingAnchors();
    attachExternalLinks();
    clearSearchMarks();
    hideMatchBox();
  }

  function collectHeadings() {
    headings = [];
    content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
      const id = 'heading-' + h.tagName.toLowerCase() + '-' + headings.length;
      h.id = id;
      headings.push({
        el: h,
        id: id,
        text: h.textContent.trim() || '(无标题)',
        level: parseInt(h.tagName.charAt(1), 10)
      });
    });
  }

  function buildToc() {
    toc.innerHTML = '';
    headings.forEach((h) => {
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.text;
      a.className = 'lvl-' + h.level;
      a.dataset.target = h.id;
      a.addEventListener('click', () => {
        toc.querySelectorAll('a').forEach((n) => n.classList.remove('active'));
        a.classList.add('active');
      });
      toc.appendChild(a);
    });
  }

  function attachHeadingAnchors() {
    content.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach((h) => {
      const a = document.createElement('a');
      a.className = 'anchor';
      a.href = '#' + h.id;
      a.textContent = '#';
      a.style.cssText =
        'opacity:0;text-decoration:none;color:var(--accent);font-weight:normal;' +
        'margin-left:6px;font-size:0.8em;vertical-align:middle;';
      a.addEventListener('mouseenter', () => (a.style.opacity = '1'));
      a.addEventListener('mouseleave', () => (a.style.opacity = '0'));
      a.addEventListener('click', () => {
        navigator.clipboard && navigator.clipboard.writeText(location.href.split('#')[0] + '#' + h.id);
      });
      h.appendChild(a);
      h.addEventListener('mouseenter', () => (a.style.opacity = '1'));
      h.addEventListener('mouseleave', () => (a.style.opacity = '0'));
    });
  }

  function attachExternalLinks() {
    content.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    });
  }

  // ---------- 文件加载 ----------
  function openFile(file) {
    if (!file) return;
    if (!/\.(md|markdown|mdown|txt)$/i.test(file.name) && file.type !== 'text/markdown') {
      alert('请选择 .md / .markdown / .txt 文件');
      return;
    }
    const readerObj = new FileReader();
    readerObj.onload = (e) => {
      currentMarkdown = String(e.target.result || '');
      fileNameEl.textContent = file.name;
      fileNameEl.title = file.name;
      welcome.classList.add('hidden');
      reader.classList.remove('hidden');
      render();
    };
    readerObj.readAsText(file);
  }

  function bindOpen(btn, input) {
    btn.addEventListener('click', () => input.click());
    input.addEventListener('change', (e) => {
      openFile(e.target.files && e.target.files[0]);
      input.value = '';
    });
  }
  bindOpen(openBtn, fileInput);
  bindOpen(openBtn2, fileInput2);

  // 拖拽
  ['dragenter', 'dragover'].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    })
  );
  ['dragleave', 'drop'].forEach((ev) =>
    document.addEventListener(ev, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    })
  );
  document.addEventListener('drop', (e) => {
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) openFile(f);
  });

  // 返回顶部
  content.addEventListener('scroll', () => {
    backTop.classList.toggle('hidden', content.scrollTop < 400);
    scheduleScrollSpy();
  });

  backTop.addEventListener('click', () => content.scrollTo({ top: 0, behavior: 'smooth' }));

  // ---------- 侧边栏 ----------
  toggleSidebar.addEventListener('click', () => reader.classList.toggle('collapsed'));

  // ---------- 滚动跟随（TOC 高亮） ----------
  function scheduleScrollSpy() {
    clearTimeout(scrollSpyTimer);
    scrollSpyTimer = setTimeout(updateScrollSpy, 60);
  }
  function updateScrollSpy() {
    if (!headings.length) return;
    const contentTop = content.getBoundingClientRect().top;
    let current = headings[0];
    for (const h of headings) {
      if (h.el.getBoundingClientRect().top - contentTop <= 8) current = h;
      else break;
    }
    toc.querySelectorAll('a').forEach((n) =>
      n.classList.toggle('active', n.dataset.target === current.id)
    );
  }

  // ---------- 标题搜索 + 定位 ----------
  let matchIndex = 0;
  let matches = [];

  function clearSearchMarks() {
    content.querySelectorAll('mark.highlight').forEach((m) => {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
  }

  function normalizeText(s) {
    return s.replace(/\s+/g, '').toLowerCase();
  }

  function search() {
    const q = searchInput.value.trim();
    clearSearchMarks();
    hideMatchBox();
    if (!q) {
      toc.querySelectorAll('a').forEach((n) => n.classList.remove('match-flash'));
      return;
    }

    const nq = normalizeText(q);
    matches = [];
    headings.forEach((h) => {
      const idx = normalizeText(h.text).indexOf(nq);
      if (idx >= 0) matches.push({ type: 'heading', id: h.id, el: h.el, text: h.text });
    });

    const walker = document.createTreeWalker(
      content,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const p = node.parentNode;
          if (!p || p.tagName === 'A' && p.closest('.anchor')) return NodeFilter.FILTER_REJECT;
          if (p.closest('pre, code, mark')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);
    textNodes.forEach((tn) => {
      const parts = tn.nodeValue.split(new RegExp('(' + escapeRegExp(q) + ')', 'gi'));
      if (parts.length < 2) return;
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (part && new RegExp('^' + escapeRegExp(q) + '$', 'i').test(part)) {
          const mark = document.createElement('mark');
          mark.className = 'highlight';
          mark.textContent = part;
          frag.appendChild(mark);
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      });
      tn.parentNode.replaceChild(frag, tn);
    });

    content.querySelectorAll('mark.highlight').forEach((m) => matches.push({ type: 'text', el: m }));

    if (!matches.length) {
      matchInfo.textContent = '无结果';
      showMatchBox();
      return;
    }
    matchIndex = 0;
    matchInfo.textContent = '1/' + matches.length;
    showMatchBox();
    gotoMatch(0);
  }

  function gotoMatch(i) {
    if (!matches.length) return;
    matchIndex = (i + matches.length) % matches.length;
    const m = matches[matchIndex];
    matchInfo.textContent = matchIndex + 1 + '/' + matches.length;
    m.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    m.el.animate(
      [{ boxShadow: '0 0 0 3px rgba(255, 208, 92, 0.8)' }, { boxShadow: '0 0 0 3px rgba(255, 208, 92, 0)' }],
      { duration: 1200, easing: 'ease-out' }
    );
    const link = toc.querySelector('a[data-target="' + m.id + '"]');
    if (link) {
      link.classList.add('match-flash');
      link.scrollIntoView({ block: 'nearest' });
    }
  }

  function showMatchBox() { matchBox.classList.remove('hidden'); }
  function hideMatchBox() { matchBox.classList.add('hidden'); }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  searchInput.addEventListener('input', search);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      search();
      searchInput.blur();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) gotoMatch(matchIndex - 1);
      else gotoMatch(matchIndex + 1);
    }
  });
  matchPrev.addEventListener('click', () => gotoMatch(matchIndex - 1));
  matchNext.addEventListener('click', () => gotoMatch(matchIndex + 1));
  matchClose.addEventListener('click', () => {
    searchInput.value = '';
    search();
  });

  // ---------- 复制 / 导出 ----------
  copyBtn.addEventListener('click', async () => {
    const mdText = currentMarkdown;
    try {
      await navigator.clipboard.writeText(mdText);
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = mdText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    flash(copyBtn, '已复制');
  });

  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(() => (btn.textContent = old), 1200);
  }

  exportBtn.addEventListener('click', () => {
    const title = fileNameEl.textContent === '未命名' ? 'document' : fileNameEl.textContent.replace(/\.(md|markdown|mdown|txt)$/i, '');
    const doc = [
      '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>' + escapeHtml(title) + '</title>',
      '<style>' + minimalCss + '</style></head><body>',
      '<article class="markdown-body">',
      content.innerHTML,
      '</article></body></html>'
    ].join('');
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    flash(exportBtn, '已导出');
  });

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const minimalCss = [
    'body{font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#1f2328;',
    'max-width:820px;margin:0 auto;padding:24px;line-height:1.7;word-wrap:break-word}',
    'h1,h2{border-bottom:1px solid #d0d7de;padding-bottom:.3em}h1{font-size:2em}h2{font-size:1.5em}',
    'h3{font-size:1.25em}h4{font-size:1em}h1,h2,h3,h4,h5,h6{margin:1.4em 0 .6em;line-height:1.3}',
    'a{color:#0969da;text-decoration:none}a:hover{text-decoration:underline}',
    'blockquote{margin:0 0 16px;padding:0 1em;color:#656d76;border-left:.25em solid #d0d7de}',
    'code{background:rgba(175,184,193,.2);padding:.2em .4em;border-radius:6px;',
    'font-family:"SF Mono",Menlo,Consolas,monospace;font-size:85%}',
    'pre{background:#f6f8fa;border-radius:8px;padding:16px;overflow-x:auto}pre code{background:none;padding:0}',
    'table{border-collapse:collapse;margin:0 0 16px}th,td{border:1px solid #d0d7de;padding:6px 13px}',
    'th{background:#f6f8fa}img{max-width:100%}hr{border-top:1px solid #d0d7de}',
    'mark{background:#fff6a9}'
  ].join('');
})();
