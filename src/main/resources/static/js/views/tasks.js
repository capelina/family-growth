/* ==========================================================================
   任务看板：家长发布任务 → 孩子提交凭证或亲子记录 → 家长审核
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';
import { CATEGORIES, openRecordForm } from './record-form.js';

const COLUMNS = [
  { key: 'todo', label: '待开始', color: '#C9BDB1' },
  { key: 'doing', label: '进行中', color: '#E8A33D' },
  { key: 'review', label: '待审核', color: '#F4573B' },
  { key: 'done', label: '已完成', color: '#3FA06A' },
];

const STATUS_LABEL = {
  PENDING: { text: '待审核', cls: 'tag-red' },
  APPROVED: { text: '已通过', cls: 'tag-green' },
  REJECTED: { text: '已退回', cls: 'tag-amber' },
};

function stageOf(task) {
  const latest = task.latestStatus;
  if (task.status === 'CLOSED' || latest === 'APPROVED') return 'done';
  if (latest === 'PENDING') return 'review';
  if (latest === 'REJECTED') return 'doing';
  if (task.status === 'IN_PROGRESS') return 'doing';
  if ((task.submissionCount || 0) > 0) return 'doing';
  return 'todo';
}

function fmtDuration(mins) {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} 小时 ${m} 分钟`;
  if (h) return `${h} 小时`;
  return `${m} 分钟`;
}

function remainText(t) {
  if (!t.expiresAt) return '';
  const ms = new Date(t.expiresAt).getTime() - Date.now();
  if (ms <= 0) return '已超时';
  const totalSec = Math.floor(ms / 1000);
  const p = (n) => String(n).padStart(2, '0');
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h ? `剩 ${h}:${p(m)}:${p(s)}` : `剩 ${p(m)}:${p(s)}`;
}

function isDurExpired(t) {
  return t.taskMode === 'DURATION' && !!t.expiresAt && new Date(t.expiresAt).getTime() < Date.now();
}

function clearTaskTimer() {
  if (window.__fgTaskTimer) {
    clearInterval(window.__fgTaskTimer);
    window.__fgTaskTimer = null;
  }
}

export default async function TasksView(host, ctx) {
  const members = ctx.store.family?.members || [];
  const me = ctx.store.member;
  const isChild = (ctx.store.user?.role || 'PARENT') === 'CHILD';
  let assigneeFilter = '';
  let tasks = [];

  host.innerHTML = `
    <div class="page-head fade-in">
      <div>
        <h1 class="page-title">任务看板</h1>
        <p class="page-sub">${isChild
          ? '查看家长发布的任务，完成后提交凭证或亲子记录，等待家长审核通过'
          : '给孩子布置成长任务，支持「看板提交凭证」或「提交亲子记录」两种方式，审核通过即可获得积分'}</p>
      </div>
      <div class="spacer"></div>
      <select class="select" style="width:auto;min-width:150px" data-role="assignee">
        <option value="">全部成员</option>
        ${members.map((m) => `<option value="${m.id}">${ui.esc(m.name)}</option>`).join('')}
      </select>
      ${isChild ? '' : `<button class="btn btn-primary" data-act="new-task">${ui.icon('plus', 16)}发布任务</button>`}
    </div>
    <div data-role="board"></div>`;

  const board = host.querySelector('[data-role="board"]');

  function timeCell(t) {
    if (t.taskMode === 'DURATION') {
      if (t.startedAt) {
        const expired = isDurExpired(t);
        return `<span class="nowrap" data-countdown="${t.id}" style="${expired ? 'color:var(--primary);font-weight:650' : ''}">${expired ? '已超时' : remainText(t)}</span>`;
      }
      if (isChild && t.status !== 'CLOSED') {
        return `<button class="btn btn-sm btn-primary" type="button" data-start="${t.id}">开始 ${ui.esc(fmtDuration(t.durationMinutes))}</button>`;
      }
      return `<span class="nowrap">限时 ${ui.esc(fmtDuration(t.durationMinutes))}</span>`;
    }
    if (t.deadline) {
      const overdue = ui.isOverdue(t.deadline) && stageOf(t) !== 'done';
      return `<span class="nowrap" style="${overdue ? 'color:var(--primary);font-weight:650' : ''}">${ui.esc(ui.dateTimeShort(t.deadline))} 截止</span>`;
    }
    return '';
  }

  function render() {
    clearTaskTimer();
    const groups = { todo: [], doing: [], review: [], done: [] };
    tasks.forEach((t) => groups[stageOf(t)].push(t));

    board.innerHTML = `
      <div class="board fade-in">
        ${COLUMNS.map((col) => `
          <section class="column">
            <div class="column-head">
              <span class="dot" style="background:${col.color}"></span>
              <span>${ui.esc(col.label)}</span>
              <span class="count">${groups[col.key].length}</span>
            </div>
            <div class="column-body">
              ${groups[col.key].length
                ? groups[col.key].map((t) => {
                  const cover = ui.safeUrl((t.submissions?.[0]?.mediaUrls || [])[0]);
                  const badge = t.latestStatus ? STATUS_LABEL[t.latestStatus] : null;
                  return `
                    <article class="task-card" data-task-id="${t.id}" role="button" tabindex="0">
                      <h4>${ui.esc(t.title)}</h4>
                      ${t.description ? `<p>${ui.esc(t.description)}</p>` : ''}
                      <div class="row-tight" style="gap:8px">
                        ${badge ? `<span class="tag ${badge.cls}">${ui.esc(badge.text)}</span>` : ''}
                        ${t.category ? ui.catTag(t.category) : ''}
                        ${t.submitMode === 'RECORD'
                          ? '<span class="tag tag-teal">提交亲子记录</span>'
                          : (t.requireProof ? '<span class="tag tag-amber">需照片/视频凭证</span>' : '')}
                      </div>
                      ${cover ? `<div class="submission-strip"><img src="${ui.esc(cover)}" alt="完成凭证" loading="lazy"></div>` : ''}
                      <div class="task-card-foot">
                        ${t.assigneeName ? ui.avatar({ name: t.assigneeName, avatar: t.assigneeAvatar }, 'avatar-sm') : ''}
                        <span class="truncate">${ui.esc(t.assigneeName || '未指派')}</span>
                        ${timeCell(t)}
                        <span class="task-points">+${t.points || 0}</span>
                      </div>
                    </article>`;
                }).join('')
                : `<div class="empty" style="padding:22px 10px">${ui.icon('check', 22)}<span>暂无任务</span></div>`}
            </div>
          </section>`).join('')}
      </div>`;

    board.querySelectorAll('[data-task-id]').forEach((card) => {
      card.addEventListener('click', () => {
        const task = tasks.find((t) => String(t.id) === card.dataset.taskId);
        if (task) openTaskDetail(task);
      });
    });
    board.querySelectorAll('[data-start]').forEach((b) => {
      b.addEventListener('click', async (e) => {
        e.stopPropagation();
        b.disabled = true;
        try {
          await api.startTask(b.dataset.start);
          ui.toast('计时开始，加油！');
          reload();
        } catch (err) {
          b.disabled = false;
          ui.toast(err.message || '操作失败', 'err');
        }
      });
    });
    if (document.querySelector('[data-countdown]')) {
      window.__fgTaskTimer = setInterval(() => {
        if (!document.body.contains(host)) {
          clearTaskTimer();
          return;
        }
        document.querySelectorAll('[data-countdown]').forEach((el) => {
          const t = tasks.find((x) => String(x.id) === el.dataset.countdown);
          if (t) el.textContent = remainText(t);
        });
      }, 1000);
    }
  }

  async function reload() {
    try {
      tasks = await api.tasks({ assigneeMemberId: assigneeFilter || undefined });
    } catch (e) {
      ui.toast(e.message || '加载失败', 'err');
      tasks = [];
    }
    render();
  }

  /* ------------------------------------------------ 任务表单 */
  function taskForm(task) {
    const d = task || {};
    let curMode = d.taskMode === 'DURATION' ? 'DURATION' : 'DEADLINE';
    let curSubmit = d.submitMode === 'RECORD' ? 'RECORD' : 'PROOF';
    const deadlineVal = d.deadline ? String(d.deadline).slice(0, 16) : `${ui.todayISO()}T21:00`;
    const durH = d.durationMinutes ? Math.floor(d.durationMinutes / 60) : 0;
    const durM = d.durationMinutes ? d.durationMinutes % 60 : 30;
    const picker = ui.memberPicker(members, d.assigneeMemberId ? [d.assigneeMemberId] : [], { multiple: false, allowEmpty: true });
    const node = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="field">
          <label for="tf-title">任务标题</label>
          <input id="tf-title" class="input" maxlength="60" placeholder="例如：每天练琴 20 分钟" value="${ui.esc(d.title || '')}">
        </div>
        <div class="form-grid">
          <div class="field">
            <label for="tf-category">任务分类</label>
            <select id="tf-category" class="select">
              ${CATEGORIES.map((c) => `<option value="${ui.esc(c)}" ${c === d.category ? 'selected' : ''}>${ui.esc(c)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label for="tf-points">完成积分</label>
            <input id="tf-points" class="input" type="number" min="0" max="999" value="${d.points ?? 10}">
          </div>
        </div>
        <div class="field">
          <label>完成方式</label>
          <div class="row-tight" style="gap:8px">
            <button type="button" class="btn btn-sm ${curMode === 'DEADLINE' ? 'btn-primary' : 'btn-soft'}" data-mode="DEADLINE">截止时间</button>
            <button type="button" class="btn btn-sm ${curMode === 'DURATION' ? 'btn-primary' : 'btn-soft'}" data-mode="DURATION">限时时长</button>
          </div>
        </div>
        <div class="field" data-role="deadline-field" ${curMode === 'DURATION' ? 'hidden' : ''}>
          <label for="tf-deadline">截止时间（精确到几点几分）</label>
          <input id="tf-deadline" class="input" type="datetime-local" value="${ui.esc(deadlineVal)}">
        </div>
        <div class="field" data-role="duration-field" ${curMode === 'DURATION' ? '' : 'hidden'}>
          <label>限时时长（孩子点击「开始」后倒计时）</label>
          <div class="row-tight" style="gap:8px;align-items:center">
            <input id="tf-dur-h" class="input" style="width:90px" type="number" min="0" max="72" value="${durH}">
            <span>小时</span>
            <input id="tf-dur-m" class="input" style="width:90px" type="number" min="0" max="59" value="${durM}">
            <span>分钟</span>
          </div>
        </div>
        <div class="field">
          <label>提交方式</label>
          <div class="row-tight" style="gap:8px">
            <button type="button" class="btn btn-sm ${curSubmit === 'PROOF' ? 'btn-primary' : 'btn-soft'}" data-smode="PROOF">看板提交凭证</button>
            <button type="button" class="btn btn-sm ${curSubmit === 'RECORD' ? 'btn-primary' : 'btn-soft'}" data-smode="RECORD">提交亲子记录</button>
          </div>
          <span class="hint">提交亲子记录：孩子在任务中写一篇亲子记录并自动关联本任务，家长审核通过后获得积分，普通记录不加分。</span>
        </div>
        <label class="row-tight" data-role="proof-field" style="gap:8px;cursor:pointer;align-items:center" ${curSubmit === 'RECORD' ? 'hidden' : ''}>
          <input id="tf-proof" type="checkbox" ${d.requireProof ? 'checked' : ''}>
          <span style="font-size:13.5px">完成后必须上传任务期间的照片 / 视频凭证</span>
        </label>
        <div class="field">
          <label for="tf-desc">任务说明</label>
          <textarea id="tf-desc" class="textarea" maxlength="500" placeholder="写清楚完成标准，孩子更容易做到">${ui.esc(d.description || '')}</textarea>
        </div>
        <div class="field">
          <label>指派给</label>
          <div data-role="assignee"></div>
        </div>
      </div>`);
    node.querySelector('[data-role="assignee"]').appendChild(picker);

    node.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        curMode = btn.dataset.mode;
        node.querySelectorAll('[data-mode]').forEach((b) => {
          b.classList.toggle('btn-primary', b.dataset.mode === curMode);
          b.classList.toggle('btn-soft', b.dataset.mode !== curMode);
        });
        node.querySelector('[data-role="deadline-field"]').hidden = curMode !== 'DEADLINE';
        node.querySelector('[data-role="duration-field"]').hidden = curMode !== 'DURATION';
      });
    });

    node.querySelectorAll('[data-smode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        curSubmit = btn.dataset.smode;
        node.querySelectorAll('[data-smode]').forEach((b) => {
          b.classList.toggle('btn-primary', b.dataset.smode === curSubmit);
          b.classList.toggle('btn-soft', b.dataset.smode !== curSubmit);
        });
        node.querySelector('[data-role="proof-field"]').hidden = curSubmit === 'RECORD';
      });
    });

    return {
      node,
      values: () => ({
        title: node.querySelector('#tf-title').value.trim(),
        category: node.querySelector('#tf-category').value,
        points: Number(node.querySelector('#tf-points').value || 0),
        taskMode: curMode,
        deadline: curMode === 'DEADLINE' ? (node.querySelector('#tf-deadline').value || null) : null,
        durationMinutes: curMode === 'DURATION'
          ? Number(node.querySelector('#tf-dur-h').value || 0) * 60 + Number(node.querySelector('#tf-dur-m').value || 0)
          : null,
        submitMode: curSubmit,
        requireProof: curSubmit === 'RECORD' ? false : node.querySelector('#tf-proof').checked,
        description: node.querySelector('#tf-desc').value.trim() || null,
        assigneeMemberId: picker.value(),
      }),
    };
  }

  function openTaskForm(task) {
    const form = taskForm(task);
    const foot = ui.el(`
      <div class="row gap-lg">
        <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
        <button class="btn btn-primary" type="button" data-act="save">${task ? '保存修改' : '发布任务'}</button>
      </div>`);
    const modal = ui.openModal({
      title: task ? '编辑任务' : '发布新任务',
      sub: '支持看板提交凭证或提交亲子记录，家长审核通过自动加积分',
      body: form.node,
      foot,
      wide: true,
    });
    foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
    foot.querySelector('[data-act="save"]').addEventListener('click', async () => {
      const payload = form.values();
      if (!payload.title) {
        ui.toast('请填写任务标题', 'err');
        return;
      }
      if (payload.taskMode === 'DURATION' && (!payload.durationMinutes || payload.durationMinutes <= 0)) {
        ui.toast('请设置限时时长', 'err');
        return;
      }
      if (payload.taskMode === 'DEADLINE' && !payload.deadline) {
        ui.toast('请选择截止时间', 'err');
        return;
      }
      try {
        if (task) await api.updateTask(task.id, payload);
        else await api.createTask(payload);
        ui.toast(task ? '已保存' : '任务已发布');
        modal.close();
        reload();
      } catch (e) {
        ui.toast(e.message || '保存失败', 'err');
      }
    });
  }

  /* ------------------------------------------------ 提交凭证 */
  function openSubmit(task) {
    const selfOnly = isChild && me;
    const defaultChild = me?.role === 'CHILD' ? [me.id] : (members.find((m) => m.role === 'CHILD') ? [members.find((m) => m.role === 'CHILD').id] : []);
    const picker = selfOnly ? null : ui.memberPicker(members, defaultChild, { multiple: false });
    const media = ui.mediaPicker({ urls: [] });

    const body = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="card card-pad" style="background:var(--surface-soft);border-color:var(--line)">
          <div class="row" style="gap:10px">
            <div class="spacer"></div>
            <span class="tag tag-red">+${task.points || 0} 积分</span>
          </div>
          <b style="font-size:15px">${ui.esc(task.title)}</b>
          <p class="text-2" style="font-size:12.5px;margin-top:4px">${ui.esc(task.description || '')}</p>
        </div>
        <div class="field"><label>提交人</label>${selfOnly
          ? `<div class="row" style="gap:9px">${ui.avatar(me)}<b style="font-size:14px">${ui.esc(me.name)}</b></div>`
          : '<div data-role="who"></div>'}</div>
        <div class="field">
          <label for="sb-note">完成说明</label>
          <textarea id="sb-note" class="textarea" placeholder="说说这次是怎么完成的吧～"></textarea>
        </div>
        <div class="field"><label>照片 / 短视频凭证${task.requireProof ? '<b style="color:var(--primary)">（必传）</b>' : ''}</label><div data-role="media"></div></div>
      </div>`);
    if (picker) body.querySelector('[data-role="who"]').appendChild(picker);
    body.querySelector('[data-role="media"]').appendChild(media);

    const foot = ui.el(`
      <div class="row gap-lg">
        <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
        <button class="btn btn-primary" type="button" data-act="save">${ui.icon('check', 16)}提交给家长审核</button>
      </div>`);

    const modal = ui.openModal({ title: '提交完成凭证', sub: '提交后需要家长审核通过才会获得积分', body, foot, wide: true });
    foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
    foot.querySelector('[data-act="save"]').addEventListener('click', async () => {
      const memberId = selfOnly ? me.id : picker.value();
      if (!memberId) {
        ui.toast('请选择提交人', 'err');
        return;
      }
      if (task.requireProof && media.urls().filter(Boolean).length === 0) {
        ui.toast('该任务需要上传任务期间的照片或视频凭证', 'err');
        return;
      }
      try {
        await api.submitTask(task.id, {
          memberId,
          note: modal.modal.querySelector('#sb-note').value.trim() || null,
          mediaUrls: media.urls(),
        });
        ui.toast('已提交，等待家长审核');
        modal.close();
        reload();
      } catch (e) {
        ui.toast(e.message || '提交失败', 'err');
      }
    });
  }

  /* ------------------------------------------------ 审核 */
  function openReview(task, submission) {
    const foot = ui.el(`
      <div class="row gap-lg">
        <button class="btn btn-danger" type="button" data-act="reject">退回</button>
        <button class="btn btn-primary" type="button" data-act="approve">通过并加积分</button>
      </div>`);

    const media = (submission.mediaUrls || []).filter(Boolean);
    const body = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="row" style="gap:10px">
          ${ui.avatar({ name: submission.memberName, avatar: submission.memberAvatar })}
          <div>
            <div style="font-weight:650">${ui.esc(submission.memberName || '孩子')}</div>
            <div style="font-size:11.5px;color:var(--muted)">${ui.esc(ui.relTime(submission.submittedAt))}提交</div>
          </div>
          <div class="spacer"></div>
          <span class="tag tag-red">+${task.points || 0} 积分</span>
        </div>
        ${submission.note ? `<p class="text-2" style="font-size:13.5px;line-height:1.75">${ui.esc(submission.note)}</p>` : ''}
        ${media.length ? `<div class="media-grid">${media.map((u) => `
          <div class="media-item">${/\.(mp4|webm|mov)/i.test(u)
            ? `<video src="${ui.esc(ui.safeUrl(u))}" muted playsinline controls></video>`
            : `<img src="${ui.esc(ui.safeUrl(u))}" alt="凭证" loading="lazy">`}</div>`).join('')}</div>` : ''}
        <div class="field">
          <label for="rv-note">审核意见</label>
          <textarea id="rv-note" class="textarea" placeholder="通过时写句鼓励的话，退回时说明原因"></textarea>
        </div>
      </div>`);

    const modal = ui.openModal({ title: `审核：${task.title}`, sub: '通过后会自动生成一条任务记录', body, foot, wide: true });
    const commentValue = () => modal.modal.querySelector('#rv-note').value.trim();

    foot.querySelector('[data-act="approve"]').addEventListener('click', async () => {
      try {
        await api.reviewTask(task.id, {
          submissionId: submission.id,
          approve: true,
          comment: commentValue() || '做得很棒，继续保持！',
        });
        ui.toast('已通过，积分已发放');
        modal.close();
        reload();
      } catch (e) {
        ui.toast(e.message || '操作失败', 'err');
      }
    });

    foot.querySelector('[data-act="reject"]').addEventListener('click', async () => {
      if (!commentValue()) {
        ui.toast('退回时请填写原因', 'err');
        return;
      }
      try {
        await api.reviewTask(task.id, { submissionId: submission.id, approve: false, comment: commentValue() });
        ui.toast('已退回');
        modal.close();
        reload();
      } catch (e) {
        ui.toast(e.message || '操作失败', 'err');
      }
    });
  }

  /* ------------------------------------------------ 任务详情 */
  function openTaskDetail(task) {
    const isDur = task.taskMode === 'DURATION';
    const durNotStarted = isDur && !task.startedAt && task.status !== 'CLOSED';
    const durExpired = isDurExpired(task) && stageOf(task) !== 'done';
    const canSubmit = stageOf(task) !== 'done' && !durNotStarted && !durExpired;
    const submissions = task.submissions || [];

    const timeTag = isDur
      ? (task.startedAt
        ? `<span class="tag ${durExpired ? 'tag-red' : 'tag-amber'}" data-countdown="${task.id}">${durExpired ? '已超时' : remainText(task)}</span>`
        : `<span class="tag tag-teal">限时 ${ui.esc(fmtDuration(task.durationMinutes))}，点击「开始」后倒计时</span>`)
      : (task.deadline ? `<span class="tag ${ui.isOverdue(task.deadline) && stageOf(task) !== 'done' ? 'tag-red' : ''}">${ui.esc(ui.dateTimeShort(task.deadline))} 截止</span>` : '');

    const body = ui.el(`
      <div class="stack" style="gap:16px">
        <div class="row wrap" style="gap:8px">
          ${task.category ? ui.catTag(task.category) : ''}
          <span class="tag tag-red">+${task.points || 0} 积分</span>
          ${timeTag}
          ${task.submitMode === 'RECORD'
            ? '<span class="tag tag-teal">提交亲子记录完成</span>'
            : (task.requireProof ? '<span class="tag tag-amber">需上传照片/视频凭证</span>' : '')}
        </div>
        ${task.description ? `<p class="text-2" style="font-size:13.5px;line-height:1.75">${ui.esc(task.description)}</p>` : ''}
        <div class="row" style="gap:10px;border-top:1px solid var(--line);padding-top:14px">
          ${ui.avatar({ name: task.assigneeName, avatar: task.assigneeAvatar }, 'avatar-sm')}
          <span style="font-size:13px">指派给 <b>${ui.esc(task.assigneeName || '未指派')}</b></span>
        </div>
        <div>
          <div class="row" style="margin-bottom:8px">
            <b style="font-size:14px">提交记录</b>
            <div class="spacer"></div>
            <span class="muted" style="font-size:12px">${submissions.length} 次</span>
          </div>
          ${submissions.length ? submissions.map((s) => {
            const badge = STATUS_LABEL[s.status] || { text: s.status, cls: '' };
            const media = (s.mediaUrls || []).filter(Boolean);
            return `
              <div class="card card-pad" style="background:var(--surface-soft);margin-bottom:10px">
                <div class="row" style="gap:9px">
                  ${ui.avatar({ name: s.memberName, avatar: s.memberAvatar }, 'avatar-sm')}
                  <div>
                    <div style="font-size:13px;font-weight:650">${ui.esc(s.memberName || '孩子')}</div>
                    <div style="font-size:11.5px;color:var(--muted)">${ui.esc(ui.relTime(s.submittedAt))}</div>
                  </div>
                  <div class="spacer"></div>
                  <span class="tag ${badge.cls}">${ui.esc(badge.text)}</span>
                </div>
                ${s.note ? `<p class="text-2 mt-2" style="font-size:12.5px">${ui.esc(s.note)}</p>` : ''}
                ${media.length ? `<div class="media-grid mt-2">${media.map((u) => `
                  <div class="media-item" style="width:64px;height:64px">${/\.(mp4|webm|mov)/i.test(u)
                    ? `<video src="${ui.esc(ui.safeUrl(u))}" muted playsinline controls></video>`
                    : `<img src="${ui.esc(ui.safeUrl(u))}" alt="凭证" loading="lazy">`}</div>`).join('')}</div>` : ''}
                ${s.reviewComment ? `<p class="mt-2" style="font-size:12px;color:var(--muted)">家长点评：${ui.esc(s.reviewComment)}</p>` : ''}
                ${s.status === 'PENDING' && !isChild ? (task.submitMode === 'RECORD'
                  ? '<p class="mt-2" style="font-size:12px;color:var(--muted)">该提交来自亲子记录，请在首页「待审核」或亲子记录中审核，通过后自动加积分</p>'
                  : `<div class="row-tight mt-3">
                  <button class="btn btn-sm btn-primary" data-approve="${s.id}">通过</button>
                  <button class="btn btn-sm btn-danger" data-reject="${s.id}">退回</button>
                </div>`) : ''}
              </div>`;
          }).join('') : ui.emptyState('还没有提交记录', 'camera')}
        </div>
      </div>`);

    const foot = ui.el(`
      <div class="row gap-lg">
        <button class="btn btn-quiet" type="button" data-act="close">关闭</button>
        <div class="spacer"></div>
        ${isChild ? '' : `<button class="btn btn-soft" type="button" data-act="edit">${ui.icon('pen', 15)}编辑</button>
        <button class="btn btn-danger" type="button" data-act="delete">${ui.icon('trash', 15)}删除</button>`}
        ${durNotStarted ? `<button class="btn btn-primary" type="button" data-act="start">${ui.icon('check', 15)}开始（${ui.esc(fmtDuration(task.durationMinutes))}）</button>` : ''}
        ${canSubmit ? (task.submitMode === 'RECORD'
          ? `<button class="btn btn-primary" type="button" data-act="submit-record">${ui.icon('pen', 15)}提交亲子记录</button>`
          : `<button class="btn btn-primary" type="button" data-act="submit">${ui.icon('camera', 15)}提交凭证</button>`) : ''}
      </div>`);

    const modal = ui.openModal({ title: task.title, sub: '任务详情与提交记录', body, foot, wide: true });

    foot.querySelector('[data-act="close"]').addEventListener('click', () => modal.close());
    foot.querySelector('[data-act="edit"]')?.addEventListener('click', () => {
      modal.close();
      openTaskForm(task);
    });
    foot.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
      const ok = await ui.confirmDialog({
        title: '删除这个任务？',
        message: '任务的提交记录与关联的任务记录都会一并删除。',
        okText: '删除',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteTask(task.id);
        ui.toast('任务已删除');
        modal.close();
        reload();
      } catch (e) {
        ui.toast(e.message || '删除失败', 'err');
      }
    });
    foot.querySelector('[data-act="start"]')?.addEventListener('click', async () => {
      try {
        await api.startTask(task.id);
        ui.toast('计时开始，加油！');
        modal.close();
        reload();
      } catch (e) {
        ui.toast(e.message || '操作失败', 'err');
      }
    });
    foot.querySelector('[data-act="submit"]')?.addEventListener('click', () => {
      modal.close();
      openSubmit(task);
    });
    foot.querySelector('[data-act="submit-record"]')?.addEventListener('click', () => {
      modal.close();
      openRecordForm({ members, task, isChild, onSaved: () => reload() });
    });

    modal.modal.querySelectorAll('[data-approve]').forEach((b) => {
      b.addEventListener('click', () => {
        const sub = submissions.find((s) => String(s.id) === b.dataset.approve);
        modal.close();
        if (sub) openReview(task, sub);
      });
    });
    modal.modal.querySelectorAll('[data-reject]').forEach((b) => {
      b.addEventListener('click', () => {
        const sub = submissions.find((s) => String(s.id) === b.dataset.reject);
        modal.close();
        if (sub) openReview(task, sub);
      });
    });
  }

  host.querySelector('[data-act="new-task"]')?.addEventListener('click', () => openTaskForm(null));
  host.querySelector('[data-role="assignee"]').addEventListener('change', (e) => {
    assigneeFilter = e.target.value;
    reload();
  });

  await reload();
}
