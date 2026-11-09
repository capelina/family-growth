/* ==========================================================================
   亲子记录：时间线 / 照片墙，支持分类、成员、月份筛选
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';
import { openRecordForm } from './record-form.js';
import { openRecordDetail } from './record-detail.js';

const TYPE_OPTIONS = [
  { value: 'ALL', label: '全部' },
  { value: 'FREE', label: '自由记录' },
  { value: 'TASK', label: '任务记录' },
];

export default async function TimelineView(host, ctx) {
  const members = ctx.store.family?.members || [];
  const isChild = (ctx.store.user?.role || 'PARENT') === 'CHILD';
  const tasks = await api.tasks().catch(() => []);

  const state = {
    type: 'ALL', category: '', memberId: '', month: '', keyword: '',
    mode: 'list', page: 0, size: 12, items: [], total: 0, totalPages: 1,
  };

  const [categories, monthSource] = await Promise.all([
    api.categories().catch(() => []),
    api.records({ page: 0, size: 200 }).catch(() => ({ items: [] })),
  ]);

  const months = [...new Set((monthSource.items || []).map((r) => ui.monthKey(r.recordDate)).filter(Boolean))]
    .sort()
    .reverse();

  host.innerHTML = `
    <div class="page-head fade-in">
      <div>
        <h1 class="page-title">亲子记录</h1>
        <p class="page-sub">共 ${monthSource.total ?? 0} 条记录，记录下来的瞬间都会留在这里</p>
      </div>
      <div class="spacer"></div>
      <div class="segmented" data-role="mode">
        <button type="button" data-value="list" class="on">时间线</button>
        <button type="button" data-value="wall">照片墙</button>
      </div>
      <button class="btn btn-primary" data-act="new-record">${ui.icon('plus', 16)}新增记录</button>
    </div>

    <div class="row wrap gap-lg fade-in" style="margin-bottom:16px">
      <div style="position:relative;flex:1;min-width:220px;max-width:320px">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted)">${ui.icon('search', 15)}</span>
        <input class="input" style="padding-left:36px" data-role="keyword" placeholder="搜索标题、内容或地点">
      </div>
      <div class="segmented" data-role="type">
        ${TYPE_OPTIONS.map((t) => `<button type="button" data-value="${t.value}" class="${t.value === state.type ? 'on' : ''}">${ui.esc(t.label)}</button>`).join('')}
      </div>
      <select class="select" style="width:auto;min-width:150px" data-role="member">
        <option value="">全部家人</option>
        ${members.map((m) => `<option value="${m.id}">${ui.esc(m.name)}${m.relation ? `（${ui.esc(m.relation)}）` : ''}</option>`).join('')}
      </select>
    </div>

    <div class="row wrap fade-in" style="gap:8px;margin-bottom:20px" data-role="categories">
      <button class="chip on" type="button" data-value="">全部</button>
      ${categories.map((c) => `<button class="chip" type="button" data-value="${ui.esc(c.name)}">${ui.esc(c.name)} ${c.count}</button>`).join('')}
    </div>

    <div class="fade-in" style="display:grid;grid-template-columns:132px minmax(0,1fr);gap:22px;align-items:start">
      <div class="month-rail" data-role="months">
        <button type="button" class="on" data-value="">全部月份</button>
        ${months.map((m) => `<button type="button" data-value="${m}">${ui.esc(ui.monthLabel(m))}</button>`).join('')}
      </div>
      <div data-role="list-area"></div>
    </div>`;

  const listArea = host.querySelector('[data-role="list-area"]');
  const railBox = host.querySelector('[data-role="months"]');
  const catBox = host.querySelector('[data-role="categories"]');
  const keywordInput = host.querySelector('[data-role="keyword"]');
  const modeBox = host.querySelector('[data-role="mode"]');

  function query() {
    return {
      type: state.type === 'ALL' ? undefined : state.type,
      category: state.category || undefined,
      memberId: state.memberId || undefined,
      month: state.month || undefined,
      keyword: state.keyword || undefined,
      page: state.page,
      size: state.size,
    };
  }

  function renderList() {
    const loadingMore = state.page > 0;
    const moreBtn = state.page + 1 < state.totalPages
      ? `<div class="center mt-4"><button class="btn btn-ghost" data-act="more">加载更多</button></div>`
      : (state.items.length ? `<p class="center muted mt-4" style="font-size:12.5px">已经到底啦</p>` : '');

    if (!state.items.length) {
      listArea.innerHTML = `<div class="card">${ui.emptyState(
        state.keyword || state.category || state.month || state.memberId || state.type !== 'ALL'
          ? '没有符合条件的记录，换个筛选条件试试'
          : '还没有记录，写下你们的第一条吧', 'pen')}</div>`;
      return;
    }

    if (state.mode === 'wall') {
      listArea.innerHTML = `
        <div class="wall">${state.items.map((r) => ui.wallCard(r)).join('')}</div>
        ${moreBtn}`;
    } else {
      listArea.innerHTML = `
        <div class="card">
          <div class="card-head">
            <h3>${ui.esc(ui.monthLabel(state.month) || '全部记录')}</h3>
            <div class="spacer"></div>
            <span class="muted" style="font-size:12px">${state.total} 条</span>
          </div>
          <div class="record-list">${state.items.map((r) => ui.recordRow(r)).join('')}</div>
        </div>
        ${moreBtn}`;
    }

    if (listArea.dataset.bind !== '1') {
      listArea.dataset.bind = '1';
      listArea.addEventListener('click', async (e) => {
        const more = e.target.closest('[data-act="more"]');
        if (more) {
          more.disabled = true;
          state.page += 1;
          await load(false);
          return;
        }
        const card = e.target.closest('[data-record-id]');
        if (card) {
          try {
            openRecordDetail({
              record: await api.record(card.dataset.recordId),
              members,
              tasks,
              onChanged: () => load(true),
              isChild,
            });
          } catch (err) {
            ui.toast(err.message || '加载失败', 'err');
          }
        }
      });
    }
    if (loadingMore) ui.toast('已加载更多');
  }

  async function load(reset) {
    if (reset) {
      state.page = 0;
      state.items = [];
    }
    const data = await api.records(query());
    const items = reset ? data.items : state.items.concat(data.items);
    state.items = items;
    state.total = data.total;
    state.totalPages = data.totalPages;
    renderList();
  }

  modeBox.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      state.mode = b.dataset.value;
      modeBox.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      renderList();
    });
  });

  host.querySelector('[data-role="type"]').querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      state.type = b.dataset.value;
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      load(true);
    });
  });

  catBox.querySelectorAll('.chip').forEach((c) => {
    c.addEventListener('click', () => {
      state.category = c.dataset.value;
      catBox.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
      load(true);
    });
  });

  railBox.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      state.month = b.dataset.value;
      railBox.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      load(true);
    });
  });

  host.querySelector('[data-role="member"]').addEventListener('change', (e) => {
    state.memberId = e.target.value;
    load(true);
  });

  keywordInput.addEventListener('input', ui.debounce(() => {
    state.keyword = keywordInput.value.trim();
    load(true);
  }, 380));

  host.querySelector('[data-act="new-record"]').addEventListener('click', () => {
    openRecordForm({ members, isChild, onSaved: () => load(true) });
  });

  await load(true);
}
