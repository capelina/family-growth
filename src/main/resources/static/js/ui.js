/* ==========================================================================
   通用 UI 工具：图标、提示、弹窗、格式化、成员选择器、媒体上传
   ========================================================================== */

import { api } from './api.js';

/* ---------------------------------------------------------------- 图标 */
const ICONS = {
  home: '<path d="M3 10.4 12 3l9 7.4V20a1 1 0 0 1-1 1h-5.4v-6H9.4v6H4a1 1 0 0 1-1-1Z"/>',
  brand: '<path d="M3 10.4 12 3l9 7.4V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M12 17.6s-3-1.9-3-4a1.8 1.8 0 0 1 3-1.2 1.8 1.8 0 0 1 3 1.2c0 2.1-3 4-3 4Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  list: '<path d="m3 7.5 2 2 3.5-4"/><path d="M12 7h9"/><path d="m3 16.5 2 2 3.5-4"/><path d="M12 16h9"/>',
  sprout: '<path d="M12 21.5v-7.2"/><path d="M12 14.3c0-4.1 2.2-6.3 6.4-6.3 0 4.2-2.2 6.3-6.4 6.3Z"/><path d="M12 14.3c0-4.1-2.2-6.3-6.4-6.3 0 4.2 2.2 6.3 6.4 6.3Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3.4 9.5h17.2M3.4 14.5h17.2"/><path d="M12 3c2.5 2.6 2.5 15.4 0 18-2.5-2.6-2.5-15.4 0-18Z"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M19.2 14.6a1.6 1.6 0 0 0 .3 1.8 1.9 1.9 0 1 1-2.7 2.7 1.6 1.6 0 0 0-2.7 1.1v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-2.7-1.2 1.9 1.9 0 1 1-2.7-2.7 1.6 1.6 0 0 0-1.1-2.7h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.2-2.7 1.9 1.9 0 1 1 2.7-2.7 1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 2.7 1.2 1.9 1.9 0 1 1 2.7 2.7 1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
  plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  pen: '<path d="M16.4 3.6a2.2 2.2 0 0 1 3.1 3.1L7.2 19l-4.3 1.2 1.2-4.3Z"/><path d="m14.5 5.5 3 3"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/><path d="m6.5 7 .9 12.1a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7"/><path d="M10.5 11v6M13.5 11v6"/>',
  chevronRight: '<path d="m9.5 5 7 7-7 7"/>',
  chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.4-4.4"/>',
  heart: '<path d="M12 20.2s-7.2-4.4-7.2-9.4A4.3 4.3 0 0 1 12 7.8a4.3 4.3 0 0 1 7.2 3c0 5-7.2 9.4-7.2 9.4Z"/>',
  comment: '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.5L4 20.5l1.5-5A8.5 8.5 0 1 1 20.5 12Z"/>',
  camera: '<rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><path d="M8.5 7.5 10 5h4l1.5 2.5"/><circle cx="12" cy="13.7" r="3.4"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3 16 5-5 4.2 4.2 3-3L21 16"/><circle cx="8.6" cy="9.4" r="1.3"/>',
  sparkles: '<path d="m12 3.8 1.7 4.6 4.6 1.7-4.6 1.7L12 16.4l-1.7-4.6L5.7 10l4.6-1.7Z"/><path d="m18.4 15.4.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8Z"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4v5l3.2 1.9"/>',
  award: '<circle cx="12" cy="9.2" r="5.6"/><path d="m8.6 14.2-1.6 6.3 5-2.6 5 2.6-1.6-6.3"/>',
  book: '<path d="M4.5 4.5A1.5 1.5 0 0 1 6 3h13.5v15.5H6a1.5 1.5 0 0 0-1.5 1.5Z"/><path d="M6 18.5h13.5V21H6a1.5 1.5 0 0 1-1.5-1.5"/>',
  music: '<path d="M9.5 18V6.2l9-1.8v11.6"/><circle cx="7" cy="18" r="2.5"/><circle cx="16" cy="16" r="2.5"/>',
  bike: '<circle cx="6" cy="17.5" r="3.2"/><circle cx="18" cy="17.5" r="3.2"/><path d="m6 17.5 4.5-9h3.5l3 9"/><path d="M9.5 8.5h5"/>',
  swim: '<path d="M3 14.6c1.8 0 2.7-1.4 4.5-1.4s2.7 1.4 4.5 1.4 2.7-1.4 4.5-1.4 2.7 1.4 4.5 1.4"/><path d="M3 19c1.8 0 2.7-1.4 4.5-1.4s2.7 1.4 4.5 1.4 2.7-1.4 4.5-1.4 2.7 1.4 4.5 1.4"/><path d="m9 9.5 3-3 3 3"/>',
  smile: '<circle cx="12" cy="12" r="8.8"/><path d="M8.6 14.2c.9 1.2 2.1 1.8 3.4 1.8s2.5-.6 3.4-1.8"/><path d="M9.2 9.6h.01M14.8 9.6h.01"/>',
  users: '<path d="M15.5 20.5v-1.6a3.6 3.6 0 0 0-3.6-3.6H7.1a3.6 3.6 0 0 0-3.6 3.6v1.6"/><circle cx="9.5" cy="8.2" r="3.6"/><path d="M21 20.5v-1.6a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.6 4.8a3.6 3.6 0 0 1 0 7"/>',
  logout: '<path d="m15.5 16.8 4.8-4.8-4.8-4.8"/><path d="M20.3 12H9.6"/><path d="M12.4 4h-6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h6"/>',
  copy: '<rect x="9" y="9" width="11.5" height="11.5" rx="2.2"/><path d="M15 6.2V5.5a2.2 2.2 0 0 0-2.2-2.2H5.7A2.2 2.2 0 0 0 3.5 5.5v7.1A2.2 2.2 0 0 0 5.7 14.8h.7"/>',
  trend: '<path d="m3 17 5.5-5.5 4 4L21 7"/><path d="M15 7h6v6"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  star: '<path d="m12 3.6 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.3 10l6-.9Z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
};

export function icon(name, size = 18, extraClass = '') {
  const body = ICONS[name] || ICONS.dot;
  return `<svg class="ic${extraClass ? ' ' + extraClass : ''}" width="${size}" height="${size}" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${body}</svg>`;
}

/* ---------------------------------------------------------------- 基础 */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html).trim();
  return tpl.content.firstElementChild;
}

export function safeUrl(url) {
  const u = String(url || '');
  return /^(https?:|\/)/i.test(u) ? u : '';
}

/** 公开可访问的图片生成接口（pollinations.ai，浏览器可直接加载） */
const TOPIC_SIZES = {
  square_hd: 'width=1024&height=1024',
  square: 'width=1024&height=1024',
  landscape_4_3: 'width=1024&height=768',
  landscape_16_9: 'width=1280&height=720',
  portrait_4_3: 'width=768&height=1024',
  portrait_16_9: 'width=720&height=1280',
};

export function topicImage(prompt, size = 'square') {
  const sizeParam = TOPIC_SIZES[size] || TOPIC_SIZES.square;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${sizeParam}&nologo=true`;
}

/* ---------------------------------------------------------------- 提示 */
const TOAST_ICON = { ok: 'check', err: 'x', info: 'sparkles' };

export function toast(message, type = 'ok', ms = 2600) {
  const host = document.getElementById('toast-host');
  if (!host) return;
  const node = el(`<div class="toast ${type}">${icon(TOAST_ICON[type] || 'check', 16)}<span>${esc(message)}</span></div>`);
  host.appendChild(node);
  window.setTimeout(() => {
    node.style.transition = 'opacity .2s ease, transform .2s ease';
    node.style.opacity = '0';
    node.style.transform = 'translateY(8px)';
    window.setTimeout(() => node.remove(), 220);
  }, ms);
}

/* ---------------------------------------------------------------- 弹窗 */
export function openModal({ title, sub = '', body, foot, wide = false, onClose } = {}) {
  const host = document.getElementById('modal-host');
  const mask = el('<div class="modal-mask"></div>');
  const modal = el(`
    <div class="modal${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div>
          <h2>${esc(title || '')}</h2>
          ${sub ? `<p>${esc(sub)}</p>` : ''}
        </div>
        <button class="btn btn-quiet btn-icon close" type="button" aria-label="关闭">${icon('x', 18)}</button>
      </div>
      <div class="modal-body"></div>
      <div class="modal-foot"></div>
    </div>`);

  const bodyEl = modal.querySelector('.modal-body');
  const footEl = modal.querySelector('.modal-foot');
  if (body) bodyEl.appendChild(typeof body === 'string' ? el(body) : body);
  if (foot) footEl.appendChild(typeof foot === 'string' ? el(foot) : foot);
  else footEl.remove();

  mask.appendChild(modal);
  host.appendChild(mask);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    mask.remove();
    if (onClose) onClose();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  modal.querySelector('.close').addEventListener('click', close);
  mask.addEventListener('mousedown', (e) => {
    if (e.target === mask) close();
  });
  document.addEventListener('keydown', onKey);

  return { close, modal, mask, body: bodyEl, foot: footEl };
}

export function confirmDialog({ title = '确认操作', message = '', okText = '确认', cancelText = '取消', danger = false } = {}) {
  return new Promise((resolve) => {
    const foot = el(`
      <div class="row gap-lg">
        <button class="btn btn-ghost" type="button" data-act="cancel">${esc(cancelText)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" data-act="ok">${esc(okText)}</button>
      </div>`);
    const m = openModal({ title, body: `<p class="text-2">${esc(message)}</p>`, foot, onClose: () => resolve(false) });
    m.foot.querySelector('[data-act="cancel"]').addEventListener('click', () => m.close());
    m.foot.querySelector('[data-act="ok"]').addEventListener('click', () => {
      resolve(true);
      m.close();
    });
  });
}

/* ---------------------------------------------------------------- 时间 */
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function toDate(value) {
  if (!value) return null;
  const raw = String(value);
  const d = new Date(raw.length === 10 ? `${raw}T00:00:00` : raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayISO() {
  return isoDate(new Date());
}

export function isoDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function dateFull(value) {
  const d = toDate(value);
  return d ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日` : '';
}

export function dateShort(value) {
  const d = toDate(value);
  return d ? `${d.getMonth() + 1}月${d.getDate()}日` : '';
}

export function dateTimeShort(value) {
  const d = toDate(value);
  if (!d) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function dateSmart(value) {
  const d = toDate(value);
  if (!d) return '';
  return d.getFullYear() === new Date().getFullYear()
    ? `${d.getMonth() + 1}月${d.getDate()}日`
    : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function weekday(value) {
  const d = toDate(value);
  return d ? WEEK_LABELS[d.getDay()] : '';
}

export function monthKey(value) {
  const d = toDate(value);
  return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '';
}

export function monthLabel(key) {
  const [y, m] = String(key || '').split('-');
  if (!y || !m) return String(key || '');
  return `${y}年${Number(m)}月`;
}

export function relTime(value) {
  const d = toDate(value);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  const days = Math.floor(diff / 86_400_000);
  if (days === 1) return '昨天';
  if (days < 30) return `${days} 天前`;
  return dateSmart(d);
}

export function ageText(birthday) {
  const d = toDate(birthday);
  if (!d) return '';
  const now = new Date();
  let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years <= 0) return `${rest} 个月`;
  return rest ? `${years} 岁 ${rest} 个月` : `${years} 岁`;
}

export function isOverdue(deadline) {
  const d = toDate(deadline);
  return d ? d.getTime() < Date.now() : false;
}

/* ---------------------------------------------------------------- 展示 */
const CAT_TONE = {
  家庭: 'tag-red', 艺术: 'tag-violet', 运动: 'tag-blue', 阅读: 'tag-amber',
  自然: 'tag-green', 户外: 'tag-green', 生活: 'tag-teal', 学习: 'tag-blue',
  任务: 'tag-red', 家务: 'tag-amber', 习惯养成: 'tag-teal', 旅行: 'tag-violet',
  节日: 'tag-amber', 美食: 'tag-red',
};

export function catTag(name, extra = '') {
  if (!name) return '';
  return `<span class="tag ${CAT_TONE[name] || ''} ${extra}">${esc(name)}</span>`;
}

export function avatar(entity, size = '') {
  const src = safeUrl(entity?.avatar || entity?.authorAvatar || entity?.familyCover);
  const name = entity?.name || entity?.authorName || entity?.familyName || entity?.userName || '';
  const cls = `avatar${size ? ' ' + size : ''}`;
  if (src) return `<div class="${cls}"><img src="${esc(src)}" alt="${esc(name)}" loading="lazy"></div>`;
  return `<div class="${cls}">${esc(name.slice(0, 1) || '·')}</div>`;
}

export function avatarStack(members, max = 4, size = 'avatar-sm') {
  const list = (members || []).slice(0, max);
  return `<div class="avatar-stack">${list.map((m) => avatar(m, size)).join('')}</div>`;
}

export function emptyState(text, iconName = 'image') {
  return `<div class="empty">${icon(iconName, 30)}<span>${esc(text)}</span></div>`;
}

/* ---------------------------------------------------------------- 成员选择 */
export function memberPicker(members, values = [], { multiple = true, allowEmpty = false } = {}) {
  const selected = new Set((values || []).map(String));
  const wrap = el('<div class="pick-row"></div>');

  const options = allowEmpty ? [{ id: '', name: '不指定', role: '' }, ...members] : members;

  options.forEach((m) => {
    const on = selected.has(String(m.id));
    const node = el(`
      <button type="button" class="pick${on ? ' on' : ''}" data-id="${esc(m.id)}">
        ${m.role === 'CHILD' ? icon('smile', 15) : m.id === '' ? icon('x', 15) : icon('heart', 15)}
        <span>${esc(m.name)}</span>
      </button>`);
    node.addEventListener('click', () => {
      const key = String(m.id);
      if (multiple) {
        if (selected.has(key)) {
          selected.delete(key);
          node.classList.remove('on');
        } else {
          selected.add(key);
          node.classList.add('on');
        }
      } else {
        selected.clear();
        wrap.querySelectorAll('.pick').forEach((n) => n.classList.remove('on'));
        selected.add(key);
        node.classList.add('on');
      }
    });
    wrap.appendChild(node);
  });

  wrap.values = () => [...selected].filter((v) => v !== '').map((v) => Number(v));
  wrap.value = () => [...selected][0] === '' ? null : [...selected].map((v) => Number(v))[0] ?? null;
  return wrap;
}

/* ---------------------------------------------------------------- 媒体 */
export function mediaPicker({ urls = [], multiple = true, onChange } = {}) {
  const state = urls.filter(Boolean).slice();
  const root = el('<div class="stack" style="gap:12px"></div>');
  const grid = el('<div class="media-grid"></div>');
  const fileInput = el(`<input type="file" accept="image/*,video/*" ${multiple ? 'multiple' : ''} hidden>`);

  const box = el(`
    <div class="uploader">
      ${icon('camera', 22)}
      <b>上传照片 / 短视频</b>
      <span>支持 JPG、PNG、MP4，单个文件 20MB 以内</span>
    </div>`);

  function render() {
    grid.innerHTML = state.map((u, i) => `
      <div class="media-item" data-i="${i}">
        ${/\.(mp4|webm|mov)(\?|$)/i.test(u)
          ? `<video src="${esc(u)}" muted playsinline></video>`
          : `<img src="${esc(u)}" alt="配图" loading="lazy">`}
        <button class="del" type="button" aria-label="删除">${icon('x', 13)}</button>
      </div>`).join('');
    grid.querySelectorAll('.del').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.splice(Number(btn.closest('.media-item').dataset.i), 1);
        render();
        onChange && onChange(state);
      });
    });
    grid.style.display = state.length ? 'flex' : 'none';
  }

  function push(url) {
    if (!multiple) state.length = 0;
    state.push(url);
    render();
    onChange && onChange(state);
  }

  box.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const files = [...fileInput.files];
    fileInput.value = '';
    if (!files.length) return;
    box.style.opacity = '.6';
    try {
      for (const file of files) {
        const url = await api.upload(file);
        push(url);
      }
      toast('上传完成');
    } catch (e) {
      toast(e.message || '上传失败', 'err');
    } finally {
      box.style.opacity = '1';
    }
  });

  render();
  root.append(grid, box, fileInput);
  root.urls = () => state.slice();
  root.push = push;
  return root;
}

/* ---------------------------------------------------------------- 其他 */
export function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export function debounce(fn, wait = 300) {
  let timer = 0;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}

/** 简易折线图（手绘 SVG，双序列，各自独立量纲） */
export function lineChart(points, series, { width = 720, height = 260, pad = 34 } = {}) {
  if (!points.length) return emptyState('还没有测量数据，先记一条吧', 'trend');
  const w = width;
  const h = height;
  const innerW = w - pad * 2;
  const innerH = h - pad - 26;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const paths = series.map((s, si) => {
    const values = points.map((p) => (typeof s.value === 'function' ? s.value(p) : p[s.value]));
    const valid = values.filter((v) => typeof v === 'number' && !Number.isNaN(v));
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const span = max - min || 1;
    const low = min - span * 0.25;
    const high = max + span * 0.25;
    const y = (v) => pad + 12 + innerH - ((v - low) / (high - low)) * innerH;
    const x = (i) => pad + i * step;
    const coords = values.map((v, i) => (typeof v === 'number' && !Number.isNaN(v) ? [x(i), y(v)] : null));
    const solid = coords.filter(Boolean);
    const d = solid.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(' ');
    const area = solid.length
      ? `${d} L${solid[solid.length - 1][0].toFixed(1)} ${pad + 12 + innerH} L${solid[0][0].toFixed(1)} ${pad + 12 + innerH} Z`
      : '';
    return `
      <g>
        ${area ? `<path d="${area}" fill="${s.color}" opacity="0.08"/>` : ''}
        <path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        ${solid.map((c) => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3.6" fill="#fff" stroke="${s.color}" stroke-width="2.2"/>`).join('')}
      </g>`;
  }).join('');

  const gridLines = [0, 1, 2, 3].map((i) => {
    const gy = pad + 12 + (innerH / 3) * i;
    return `<line x1="${pad}" y1="${gy.toFixed(1)}" x2="${w - pad}" y2="${gy.toFixed(1)}" stroke="#EFE6DE" stroke-width="1"/>`;
  }).join('');

  const labels = points.map((p, i) => {
    const x = pad + i * step;
    return `<text x="${x.toFixed(1)}" y="${h - 8}" font-size="11" fill="#9A9088" text-anchor="middle">${esc(p.label)}</text>`;
  }).join('');

  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="成长曲线">
        ${gridLines}
        ${paths}
        ${labels}
      </svg>
    </div>`;
}

/** 记录列表行 */
export function recordRow(r) {
  const cover = safeUrl((r.mediaUrls || [])[0]);
  return `
    <div class="record-row" data-record-id="${r.id}" role="button" tabindex="0">
      ${cover
        ? `<img class="record-thumb" src="${esc(cover)}" alt="" loading="lazy">`
        : `<div class="record-thumb" style="display:grid;place-items:center;color:#D6C9BC">${icon('image', 24)}</div>`}
      <div class="record-main">
        <div class="row wrap" style="gap:8px">
          <span class="record-title truncate">${esc(r.title)}</span>
          ${r.type === 'TASK' ? '<span class="tag tag-teal">任务</span>' : ''}
          ${r.visibility === 'PUBLIC' ? '<span class="tag tag-green">公开</span>' : ''}
          ${r.status === 'PENDING' ? '<span class="tag tag-amber">待审核</span>' : ''}
          ${r.status === 'REJECTED' ? '<span class="tag tag-red">已退回</span>' : ''}
        </div>
        <div class="record-meta">
          <span>${esc(dateSmart(r.recordDate))} ${esc(weekday(r.recordDate))}</span>
          ${r.category ? `<span class="muted">·</span>${catTag(r.category)}` : ''}
          ${r.location ? `<span class="muted">·</span><span class="truncate">${esc(r.location)}</span>` : ''}
          ${r.points ? `<span class="muted">·</span><span style="color:var(--primary);font-weight:700">+${r.points} 积分</span>` : ''}
        </div>
        ${r.content ? `<div class="record-snippet">${esc(r.content)}</div>` : ''}
      </div>
      ${(r.participants || []).length ? `<div class="avatar-stack" style="align-self:flex-start">${(r.participants || []).slice(0, 3).map((p) => avatar(p, 'avatar-sm')).join('')}</div>` : ''}
    </div>`;
}

/** 照片墙卡片 */
export function wallCard(r) {
  const cover = safeUrl((r.mediaUrls || [])[0]);
  return `
    <article class="wall-card" data-record-id="${r.id}" role="button" tabindex="0">
      ${cover
        ? `<div class="wall-media">
             <img src="${esc(cover)}" alt="${esc(r.title)}" loading="lazy">
             ${r.category ? `<span class="float-tag">${esc(r.category)}</span>` : ''}
             ${r.visibility === 'PUBLIC' ? '<span class="float-status ok">已公开</span>' : ''}
             ${r.status === 'PENDING' ? '<span class="float-status">待审核</span>' : ''}
             ${r.status === 'REJECTED' ? '<span class="float-status" style="background:var(--danger,#C8402A)">已退回</span>' : ''}
           </div>`
        : `<div class="wall-media" style="aspect-ratio:4/3;display:grid;place-items:center;color:#D6C9BC">${icon('image', 30)}</div>`}
      <div class="wall-body">
        <h4 class="truncate">${esc(r.title)}</h4>
        <p>${esc(r.content || '')}</p>
        <div class="wall-foot">
          <span>${esc(dateSmart(r.recordDate))}</span>
          <span class="spacer"></span>
          ${(r.participants || []).length ? `<div class="avatar-stack">${(r.participants || []).slice(0, 3).map((p) => avatar(p, 'avatar-sm')).join('')}</div>` : ''}
        </div>
      </div>
    </article>`;
}

/** 近 30 天记录趋势柱状图：带 Y 轴刻度、日期标签、悬停提示与汇总数据 */
export function barChart(points, { width = 720, height = 206 } = {}) {
  if (!points?.length) return emptyState('最近还没有记录哦', 'calendar');

  const total = points.reduce((sum, p) => sum + p.count, 0);
  if (!total) {
    return `<div class="chart-wrap"><div class="center muted" style="padding:36px 0;font-size:13px">最近 30 天还没有记录，快去记录一条吧</div></div>`;
  }

  const padL = 30;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = points.length;
  const max = Math.max(...points.map((p) => p.count));
  const ticks = 4;
  const top = Math.max(ticks, Math.ceil(max / ticks) * ticks);
  const step = innerW / n;
  const todayISO = isoDate(new Date());

  // 水平网格线与 Y 轴刻度
  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const y = padT + (innerH / ticks) * i;
    const value = (top / ticks) * (ticks - i);
    return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}"
        stroke="var(--line)" stroke-width="1"${i === ticks ? '' : ' stroke-dasharray="3 5"'}/>
      <text x="${padL - 7}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--muted)">${value}</text>`;
  }).join('');

  const every = Math.max(1, Math.ceil(n / 6));
  const bars = points.map((p, i) => {
    const bh = p.count ? Math.max((p.count / top) * innerH, 5) : 0;
    const w = step * 0.6;
    const x = padL + i * step + (step - w) / 2;
    const y = padT + innerH - bh;
    const isToday = p.label === todayISO;
    const fill = !p.count ? '#F1E8E0' : (isToday ? 'url(#bc-today)' : 'url(#bc-bar)');
    const axis = (i % every === 0 || isToday)
      ? `<text x="${(x + w / 2).toFixed(1)}" y="${height - 8}" text-anchor="middle" font-size="10.5"
           fill="${isToday ? 'var(--primary)' : 'var(--muted)'}" font-weight="${isToday ? 700 : 400}">${esc(axisLabel(p.label))}</text>`
      : '';
    const peak = p.count === max
      ? `<text x="${(x + w / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}" text-anchor="middle" font-size="10.5" fill="var(--primary)" font-weight="700">${p.count}</text>`
      : '';
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${fill}">
        <title>${esc(p.label)}　${p.count} 条记录</title>
      </rect>${peak}${axis}`;
  }).join('');

  const best = points.reduce((a, b) => (b.count > a.count ? b : a), points[0]);
  const activeDays = points.filter((p) => p.count > 0).length;
  const avg = (total / n).toFixed(1).replace(/\.0$/, '');

  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bc-bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFAD96"/>
            <stop offset="100%" stop-color="#FF7A57"/>
          </linearGradient>
          <linearGradient id="bc-today" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FF8A6B"/>
            <stop offset="100%" stop-color="#E24A30"/>
          </linearGradient>
        </defs>
        ${grid}
        ${bars}
      </svg>
      <div class="bc-summary">
        <span>共 <b>${total}</b> 条</span>
        <span>日均 <b>${avg}</b> 条</span>
        <span>最多一天 <b>${best.count}</b> 条（${esc(dateShort(best.label))}）</span>
        <span>有记录 <b>${activeDays}</b> 天</span>
      </div>
    </div>`;
}

/** 横轴日期标签：每月 1 号显示月份，其余显示「月/日」 */
function axisLabel(iso) {
  const d = toDate(iso);
  if (!d) return iso;
  return d.getDate() === 1 ? `${d.getMonth() + 1}月` : `${d.getMonth() + 1}/${d.getDate()}`;
}

