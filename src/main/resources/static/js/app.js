/* ==========================================================================
   应用入口：hash 路由 + 侧边栏外壳 + 登录守卫
   ========================================================================== */

import { api, getToken, clearToken, setUnauthorizedHandler } from './api.js';
import * as ui from './ui.js';
import AuthView from './views/auth.js';
import HomeView from './views/home.js';
import TimelineView from './views/timeline.js';
import TasksView from './views/tasks.js';
import GrowthView from './views/growth.js';
import PlazaView from './views/plaza.js';
import ShopView from './views/shop.js';
import FamilyView from './views/family.js';
import { openRecordForm } from './views/record-form.js';

const store = { user: null, family: null, member: null };

const NAV = [
  { path: '/home', label: '首页', icon: 'home' },
  { path: '/timeline', label: '亲子记录', icon: 'calendar' },
  { path: '/tasks', label: '任务看板', icon: 'list', badge: true },
  { path: '/growth', label: '成长档案', icon: 'sprout' },
  { path: '/plaza', label: '互动广场', icon: 'globe' },
  { path: '/shop', label: '积分商城', icon: 'star' },
  { path: '/family', label: '家庭设置', icon: 'settings' },
];

const VIEWS = {
  '/home': HomeView,
  '/timeline': TimelineView,
  '/tasks': TasksView,
  '/growth': GrowthView,
  '/plaza': PlazaView,
  '/shop': ShopView,
  '/family': FamilyView,
};

let pendingCount = 0;

/* ---------------------------------------------------------------- 路由 */
function currentPath() {
  const hash = location.hash.replace(/^#/, '');
  if (!hash || hash === '/') return '/home';
  return hash.split('?')[0];
}

function navigate(path) {
  if (currentPath() === path) {
    renderRoute();
    return;
  }
  location.hash = path;
}

function applySession(data) {
  store.user = data?.user || null;
  store.family = data?.family || null;
  store.member = (data?.family?.members || []).find((m) => m.isMe) || null;
}

const ctx = {
  store,
  navigate,
  setSession: (data) => applySession(data),
  reload: () => reloadContent(),
};

async function loadSession() {
  try {
    const data = await api.me();
    applySession(data);
    return true;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------- 外壳 */
function shell() {
  const user = store.user || {};
  const family = store.family || {};
  const path = currentPath();
  const isChild = (user.role || 'PARENT') === 'CHILD';

  return `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">${ui.icon('brand', 20)}</div>
          <div class="brand-text">
            <span class="brand-name">成长家</span>
            <span class="brand-sub">FAMILY GROWTH</span>
          </div>
        </div>
        <nav class="nav">
          ${NAV.map((n) => `
            <button class="nav-item${n.path === path ? ' active' : ''}" type="button" data-path="${n.path}">
              ${ui.icon(n.icon, 19)}
              <span>${ui.esc(n.label)}</span>
              ${n.badge && !isChild ? `<span class="nav-badge${pendingCount ? '' : ' hidden'}" data-role="badge">${pendingCount}</span>` : ''}
            </button>`).join('')}
        </nav>
        <div class="sidebar-foot" data-act="profile" style="cursor:pointer">
          ${ui.avatar({ name: user.nickname, avatar: user.avatar }, 'avatar-sm')}
          <div class="who">
            <b>${ui.esc(user.nickname || '我')}</b>
            <span class="truncate">${ui.esc(family.name || '我的家庭')}</span>
          </div>
          ${ui.icon('chevronRight', 15)}
        </div>
      </aside>

      <main class="main">
        <header class="topbar">
          <div class="topbar-greet">
            <h1>${ui.esc(ui.greeting())}，${ui.esc(user.nickname || '家人')}</h1>
            <p>${ui.esc(family.name || '我的家庭')}${family.motto ? ` · ${ui.esc(family.motto)}` : ''}${isChild ? ' · 亲子成员' : ''}</p>
          </div>
          <div class="topbar-actions">
            ${isChild ? '' : `<button class="btn btn-primary" type="button" data-act="quick-record">${ui.icon('plus', 16)}快速记录</button>`}
            <button class="btn btn-quiet btn-icon" type="button" data-act="logout" title="退出登录">${ui.icon('logout', 18)}</button>
          </div>
        </header>
        <div class="content"></div>
      </main>
    </div>`;
}

function bindShell() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => navigate(item.dataset.path));
  });

  document.querySelector('[data-act="logout"]')?.addEventListener('click', async () => {
    const ok = await ui.confirmDialog({ title: '退出登录？', message: '退出后需要重新登录才能查看家庭记录。', okText: '退出' });
    if (!ok) return;
    try {
      await api.logout();
    } catch {
      /* 忽略退出接口异常 */
    }
    clearToken();
    store.user = null;
    store.family = null;
    store.member = null;
    navigate('/login');
  });

  document.querySelector('[data-act="profile"]')?.addEventListener('click', () => navigate('/family'));

  document.querySelector('[data-act="quick-record"]')?.addEventListener('click', () => {
    const members = store.family?.members || [];
    openRecordForm({ members, onSaved: () => reloadContent() });
  });

  const topbar = document.querySelector('.topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 4);
  window.removeEventListener('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

async function refreshBadge() {
  if ((store.user?.role || 'PARENT') === 'CHILD') {
    pendingCount = 0;
  } else {
    try {
      const list = await api.pendingSubmissions();
      pendingCount = list.length;
    } catch {
      pendingCount = 0;
    }
  }
  const badge = document.querySelector('[data-role="badge"]');
  if (badge) {
    badge.textContent = pendingCount;
    badge.classList.toggle('hidden', !pendingCount);
  }
}

/* ---------------------------------------------------------------- 渲染 */
async function reloadContent() {
  const path = currentPath();
  const host = document.querySelector('.content');
  if (!host || !VIEWS[path]) {
    renderRoute();
    return;
  }
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.path === path));
  try {
    await VIEWS[path](host, ctx);
  } catch (e) {
    host.innerHTML = `<div class="card">${ui.emptyState(e.message || '页面加载失败', 'x')}</div>`;
  }
  refreshBadge();
}

async function renderRoute() {
  const path = currentPath();

  if (!getToken()) {
    document.getElementById('app').innerHTML = '';
    await AuthView(document.getElementById('app'), ctx);
    return;
  }

  if (!store.user) {
    const ok = await loadSession();
    if (!ok) {
      document.getElementById('app').innerHTML = '';
      await AuthView(document.getElementById('app'), ctx);
      return;
    }
  }

  if (!VIEWS[path]) {
    navigate('/home');
    return;
  }

  document.getElementById('app').innerHTML = shell();
  bindShell();
  await reloadContent();
}

/* ---------------------------------------------------------------- 启动 */
setUnauthorizedHandler(() => {
  store.user = null;
  store.family = null;
  store.member = null;
  if (currentPath() !== '/login') {
    location.hash = '/login';
    renderRoute();
  }
});

let started = false;
function start() {
  if (started) return;
  started = true;
  if (!location.hash) location.hash = '/home';
  renderRoute();
}

window.addEventListener('hashchange', renderRoute);
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
