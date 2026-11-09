/* ==========================================================================
   家庭互动广场：聚合所有家庭的公开动态，点赞 + 评论
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';
import { openRecordDetail } from './record-detail.js';

export default async function PlazaView(host, ctx) {
  const members = ctx.store.family?.members || [];
  const isChild = (ctx.store.user?.role || 'PARENT') === 'CHILD';
  const tasks = await api.tasks().catch(() => []);
  const state = { category: '', page: 0, size: 9, items: [], total: 0, totalPages: 1 };

  const categories = await api.plazaCategories().catch(() => []);

  host.innerHTML = `
    <div class="page-head fade-in">
      <div>
        <h1 class="page-title">家庭互动广场</h1>
        <p class="page-sub">看看其他家庭都在记录什么，点个赞、留句话，把温暖传递出去</p>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-ghost" data-act="to-timeline"${isChild ? ' hidden' : ''}>${ui.icon('pen', 16)}记录并公开分享</button>
    </div>

    <div class="row wrap fade-in" style="gap:8px;margin-bottom:20px" data-role="categories">
      <button class="chip on" type="button" data-value="">全部</button>
      ${categories.map((c) => `<button class="chip" type="button" data-value="${ui.esc(c.name)}">${ui.esc(c.name)} ${c.count}</button>`).join('')}
    </div>

    <div data-role="feed"></div>`;

  const feedBox = host.querySelector('[data-role="feed"]');
  const catBox = host.querySelector('[data-role="categories"]');

  function commentNode(c) {
    return `<div class="comment">${ui.avatar({ name: c.userName, avatar: c.userAvatar }, 'avatar-sm')}
      <div style="min-width:0"><b>${ui.esc(c.userName || '家人')}</b>：${ui.esc(c.content)}
      <span class="muted" style="font-size:11px"> · ${ui.esc(ui.relTime(c.createdAt))}</span></div></div>`;
  }

  function card(item) {
    const cover = ui.safeUrl((item.mediaUrls || [])[0]);
    const comments = item.comments || [];
    return `
      <article class="feed-card" data-record-id="${item.recordId}">
        ${cover ? `<img src="${ui.esc(cover)}" alt="${ui.esc(item.title)}" loading="lazy">` : ''}
        <div class="feed-body">
          <div class="feed-author">
            ${ui.avatar({ name: item.authorName, avatar: item.authorAvatar })}
            <div>
              <b>${ui.esc(item.authorName || '家人')}</b>
              <span>${ui.esc(item.authorRelation || '')} · ${ui.esc(item.familyName || '')}</span>
            </div>
            <div class="spacer"></div>
            ${item.mine ? '<span class="tag tag-red">我的家庭</span>' : ''}
          </div>

          <h4 data-act="open" style="cursor:pointer">${ui.esc(item.title)}</h4>
          ${item.content ? `<p>${ui.esc(item.content)}</p>` : ''}
          <div class="row-tight wrap" style="gap:7px">
            ${ui.catTag(item.category)}
            <span class="muted" style="font-size:11.5px">${ui.esc(ui.dateSmart(item.recordDate))}</span>
          </div>

          <div class="feed-actions">
            <button class="act ${item.liked ? 'on' : ''}" type="button" data-act="like">
              ${ui.icon('heart', 16)}<span data-role="likes">${item.likeCount}</span>
            </button>
            <button class="act" type="button" data-act="comment">
              ${ui.icon('comment', 16)}<span>${comments.length}</span>
            </button>
            <div class="spacer"></div>
            <button class="act" type="button" data-act="open">${ui.icon('chevronRight', 15)}详情</button>
          </div>

          <div class="comment-list ${comments.length ? '' : 'hidden'}" data-role="comments">
            ${comments.map(commentNode).join('')}
            <div class="comment-box">
              <input class="input" placeholder="说点什么…" data-role="input">
              <button class="btn btn-sm btn-primary" type="button" data-act="send">发送</button>
            </div>
          </div>
        </div>
      </article>`;
  }

  function render() {
    if (!state.items.length) {
      feedBox.innerHTML = `<div class="card">${ui.emptyState('广场上暂时没有动态，去时间线把记录设为「公开到广场」吧', 'globe')}</div>`;
      return;
    }
    const more = state.page + 1 < state.totalPages
      ? `<div class="center mt-4" style="grid-column:1/-1"><button class="btn btn-ghost" data-act="more">加载更多</button></div>`
      : '';
    feedBox.innerHTML = `<div class="feed fade-in">${state.items.map(card).join('')}${more}</div>`;

    feedBox.querySelectorAll('.feed-card').forEach((node) => {
      const id = node.dataset.recordId;

      node.querySelector('[data-act="like"]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        try {
          const res = await api.like(id);
          btn.classList.toggle('on', res.liked);
          btn.querySelector('[data-role="likes"]').textContent = res.count;
        } catch (err) {
          ui.toast(err.message || '操作失败', 'err');
        }
      });

      node.querySelector('[data-act="comment"]').addEventListener('click', () => {
        node.querySelector('[data-role="comments"]').classList.toggle('hidden');
      });

      node.querySelector('[data-act="send"]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const input = node.querySelector('[data-role="input"]');
        const content = input.value.trim();
        if (!content) {
          ui.toast('先写点什么吧', 'err');
          return;
        }
        btn.disabled = true;
        try {
          const list = await api.addComment(id, content);
          input.value = '';
          const box = node.querySelector('[data-role="comments"]');
          box.classList.remove('hidden');
          box.innerHTML = `${list.map(commentNode).join('')}
            <div class="comment-box">
              <input class="input" placeholder="说点什么…" data-role="input">
              <button class="btn btn-sm btn-primary" type="button" data-act="send">发送</button>
            </div>`;
          bindComment(node, id);
          node.querySelector('[data-act="comment"] span').textContent = list.length;
          ui.toast('评论已发布');
        } catch (err) {
          ui.toast(err.message || '评论失败', 'err');
        } finally {
          btn.disabled = false;
        }
      });

      node.querySelectorAll('[data-act="open"]').forEach((b) => b.addEventListener('click', async () => {
        try {
          openRecordDetail({
            record: await api.record(id),
            members,
            tasks,
            onChanged: () => load(true),
            isChild,
          });
        } catch (err) {
          ui.toast(err.message || '加载失败', 'err');
        }
      }));
    });
  }

  function bindComment(node, id) {
    node.querySelector('[data-act="send"]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const input = node.querySelector('[data-role="input"]');
      const content = input.value.trim();
      if (!content) {
        ui.toast('先写点什么吧', 'err');
        return;
      }
      btn.disabled = true;
      try {
        const list = await api.addComment(id, content);
        input.value = '';
        const box = node.querySelector('[data-role="comments"]');
        box.classList.remove('hidden');
        box.innerHTML = `${list.map(commentNode).join('')}
          <div class="comment-box">
            <input class="input" placeholder="说点什么…" data-role="input">
            <button class="btn btn-sm btn-primary" type="button" data-act="send">发送</button>
          </div>`;
        bindComment(node, id);
        node.querySelector('[data-act="comment"] span').textContent = list.length;
        ui.toast('评论已发布');
      } catch (err) {
        ui.toast(err.message || '评论失败', 'err');
      } finally {
        btn.disabled = false;
      }
    });
  }

  async function load(reset) {
    if (reset) {
      state.page = 0;
      state.items = [];
    }
    try {
      const data = await api.feed({ category: state.category || undefined, page: state.page, size: state.size });
      state.items = reset ? data.items : state.items.concat(data.items);
      state.total = data.total;
      state.totalPages = data.totalPages;
      render();
    } catch (e) {
      feedBox.innerHTML = `<div class="card">${ui.emptyState(e.message || '加载失败', 'x')}</div>`;
    }
  }

  feedBox.addEventListener('click', (e) => {
    if (e.target.closest('[data-act="more"]')) {
      state.page += 1;
      load(false);
    }
  });

  catBox.querySelectorAll('.chip').forEach((c) => {
    c.addEventListener('click', () => {
      state.category = c.dataset.value;
      catBox.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
      load(true);
    });
  });

  host.querySelector('[data-act="to-timeline"]').addEventListener('click', () => ctx.navigate('/timeline'));

  await load(true);
}
