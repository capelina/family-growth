/* ==========================================================================
   积分商城：家长设置商品，亲子用积分兑换奖励
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';

export default async function ShopView(host, ctx) {
  const isChild = (ctx.store.user?.role || 'PARENT') === 'CHILD';
  const myMemberId = ctx.store.member?.id;

  let rewards = [];
  let redemptions = [];

  host.innerHTML = `
    <div class="page-head fade-in">
      <div>
        <h1 class="page-title">积分商城</h1>
        <p class="page-sub">完成任务赚积分，兑换家庭奖励</p>
      </div>
      <div class="spacer"></div>
      <span class="tag tag-amber" style="font-size:13.5px;padding:7px 14px" data-role="my-points"></span>
      ${isChild ? '' : `<button class="btn btn-primary" data-act="new-reward">${ui.icon('plus', 16)}新增商品</button>`}
    </div>

    <div class="fade-in" data-role="reward-area"></div>

    <div class="card fade-in" style="margin-top:22px">
      <div class="card-head">
        <h3>兑换记录</h3>
        <div class="spacer"></div>
        <span class="muted" style="font-size:12px" data-role="redemption-count"></span>
      </div>
      <div data-role="redemption-area"></div>
    </div>`;

  const rewardArea = host.querySelector('[data-role="reward-area"]');
  const redemptionArea = host.querySelector('[data-role="redemption-area"]');

  function myPoints() {
    const m = (ctx.store.family?.members || []).find((x) => x.id === myMemberId);
    return m?.points ?? 0;
  }

  function renderPoints() {
    host.querySelector('[data-role="my-points"]').innerHTML = `${ui.icon('star', 14)} 我的积分：<b>${myPoints()}</b>`;
  }

  function renderRewards() {
    if (!rewards.length) {
      rewardArea.innerHTML = `<div class="card">${ui.emptyState(
        isChild ? '商城还没有商品，等爸爸妈妈上架吧' : '还没有商品，点击右上角「新增商品」设置奖励', 'star')}</div>`;
      return;
    }
    const balance = myPoints();
    rewardArea.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px">
        ${rewards.map((r) => {
          const off = r.status === 'OFF';
          const afford = balance >= (r.costPoints || 0);
          return `
          <div class="card" style="padding:0;overflow:hidden;${off ? 'opacity:.6' : ''}">
            ${r.image
              ? `<img src="${ui.esc(ui.safeUrl(r.image))}" alt="${ui.esc(r.name)}" style="width:100%;aspect-ratio:4/3;object-fit:cover">`
              : `<div style="aspect-ratio:4/3;display:grid;place-items:center;background:#FBF4EC;color:#E3B78F">${ui.icon('star', 34)}</div>`}
            <div class="stack" style="gap:8px;padding:14px 16px 16px">
              <div class="row" style="gap:8px">
                <b style="font-size:14.5px" class="truncate">${ui.esc(r.name)}</b>
                ${off ? '<span class="tag">已下架</span>' : ''}
              </div>
              ${r.description ? `<p class="muted" style="font-size:12.5px;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${ui.esc(r.description)}</p>` : ''}
              <div class="row" style="gap:8px">
                <span style="color:var(--primary);font-weight:750;font-size:14px">${ui.icon('star', 14)} ${r.costPoints} 积分</span>
                <div class="spacer"></div>
                ${isChild
                  ? `<button class="btn btn-primary btn-sm" data-act="redeem" data-id="${r.id}" ${off || !afford ? 'disabled' : ''}>${off ? '已下架' : (afford ? '兑换' : '积分不足')}</button>`
                  : `<button class="btn btn-quiet btn-icon btn-sm" data-act="edit" data-id="${r.id}" title="编辑">${ui.icon('pen', 15)}</button>
                     <button class="btn btn-quiet btn-icon btn-sm" data-act="del" data-id="${r.id}" title="删除">${ui.icon('trash', 15)}</button>`}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function renderRedemptions() {
    host.querySelector('[data-role="redemption-count"]').textContent = `${redemptions.length} 条`;
    if (!redemptions.length) {
      redemptionArea.innerHTML = ui.emptyState('还没有兑换记录', 'star');
      return;
    }
    redemptionArea.innerHTML = redemptions.map((d) => `
      <div class="row" style="gap:12px;padding:12px 0;border-top:1px solid var(--line)">
        ${ui.avatar({ name: d.memberName, avatar: d.memberAvatar }, 'avatar-sm')}
        <div style="flex:1;min-width:0">
          <div style="font-size:13.5px;font-weight:650">${ui.esc(d.rewardName)}</div>
          <div class="muted" style="font-size:12px">${ui.esc(d.memberName || '家人')} · ${ui.esc(ui.relTime(d.createdAt))}兑换 · 花费 ${d.costPoints} 积分</div>
        </div>
        ${d.status === 'DONE'
          ? '<span class="tag tag-green">已兑现</span>'
          : `<span class="tag tag-amber">待兑现</span>
             ${isChild ? '' : `<button class="btn btn-soft btn-sm" data-act="done" data-id="${d.id}">${ui.icon('check', 14)}标记已兑现</button>`}`}
      </div>`).join('');
  }

  function openRewardForm(reward = null) {
    const body = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="field">
          <label for="rw-name">商品名称</label>
          <input id="rw-name" class="input" maxlength="40" placeholder="例如：周末电影之夜">
        </div>
        <div class="field">
          <label for="rw-desc">商品描述</label>
          <textarea id="rw-desc" class="textarea" maxlength="200" placeholder="奖励内容、使用规则等"></textarea>
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="rw-cost">所需积分</label>
            <input id="rw-cost" class="input" type="number" min="1" max="99999" value="50">
          </div>
          <div class="field">
            <label for="rw-status">状态</label>
            <select id="rw-status" class="select">
              <option value="ON">上架中</option>
              <option value="OFF">下架</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>商品图片</label>
          <div data-role="image"></div>
        </div>
      </div>`);

    const media = ui.mediaPicker({ urls: reward?.image ? [reward.image] : [], multiple: false });
    body.querySelector('[data-role="image"]').appendChild(media);
    if (reward) {
      body.querySelector('#rw-name').value = reward.name || '';
      body.querySelector('#rw-desc').value = reward.description || '';
      body.querySelector('#rw-cost').value = reward.costPoints ?? 50;
      body.querySelector('#rw-status').value = reward.status || 'ON';
    }

    const foot = ui.el(`
      <div class="row gap-lg">
        <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
        <button class="btn btn-primary" type="button" data-act="save">${ui.icon('check', 16)}${reward ? '保存修改' : '上架商品'}</button>
      </div>`);

    const modal = ui.openModal({
      title: reward ? '编辑商品' : '新增商品',
      sub: '设置亲子可以用积分兑换的家庭奖励',
      body,
      foot,
    });

    foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
    const saveBtn = foot.querySelector('[data-act="save"]');
    saveBtn.addEventListener('click', async () => {
      const payload = {
        name: body.querySelector('#rw-name').value.trim(),
        description: body.querySelector('#rw-desc').value.trim() || null,
        costPoints: Number(body.querySelector('#rw-cost').value || 0),
        status: body.querySelector('#rw-status').value,
        image: media.urls()[0] || null,
      };
      if (!payload.name) {
        ui.toast('请填写商品名称', 'err');
        return;
      }
      if (!payload.costPoints || payload.costPoints < 1) {
        ui.toast('请设置所需积分（至少 1 分）', 'err');
        return;
      }
      saveBtn.disabled = true;
      try {
        if (reward) await api.updateReward(reward.id, payload);
        else await api.createReward(payload);
        ui.toast(reward ? '已保存' : '商品已上架');
        modal.close();
        await load();
      } catch (e) {
        ui.toast(e.message || '保存失败', 'err');
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  async function refreshSession() {
    try {
      ctx.setSession(await api.me());
    } catch {
      /* 忽略会话刷新失败 */
    }
  }

  async function load() {
    [rewards, redemptions] = await Promise.all([
      api.rewards().catch(() => []),
      api.rewardRedemptions().catch(() => []),
    ]);
    renderPoints();
    renderRewards();
    renderRedemptions();
  }

  host.querySelector('[data-act="new-reward"]')?.addEventListener('click', () => openRewardForm());

  rewardArea.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const reward = rewards.find((r) => r.id === id);
    if (!reward) return;

    if (btn.dataset.act === 'edit') {
      openRewardForm(reward);
      return;
    }
    if (btn.dataset.act === 'del') {
      const ok = await ui.confirmDialog({
        title: '删除这个商品？',
        message: `「${reward.name}」将被移除，已产生的兑换记录不受影响。`,
        okText: '删除',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteReward(id);
        ui.toast('商品已删除');
        await load();
      } catch (err) {
        ui.toast(err.message || '删除失败', 'err');
      }
      return;
    }
    if (btn.dataset.act === 'redeem') {
      const ok = await ui.confirmDialog({
        title: '确认兑换？',
        message: `用 ${reward.costPoints} 积分兑换「${reward.name}」，兑换后家长会收到兑现提醒。`,
        okText: '确认兑换',
      });
      if (!ok) return;
      btn.disabled = true;
      try {
        await api.redeemReward(id);
        ui.toast(`兑换成功，已扣除 ${reward.costPoints} 积分`);
        await refreshSession();
        await load();
      } catch (err) {
        ui.toast(err.message || '兑换失败', 'err');
      } finally {
        btn.disabled = false;
      }
    }
  });

  redemptionArea.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act="done"]');
    if (!btn) return;
    btn.disabled = true;
    try {
      await api.markRedemptionDone(Number(btn.dataset.id));
      ui.toast('已标记为兑现');
      await load();
    } catch (err) {
      ui.toast(err.message || '操作失败', 'err');
    } finally {
      btn.disabled = false;
    }
  });

  await load();
}
