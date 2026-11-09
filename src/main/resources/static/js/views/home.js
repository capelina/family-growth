/* ==========================================================================
   首页：家庭概览
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';
import { openRecordForm } from './record-form.js';
import { openRecordDetail } from './record-detail.js';

function skeleton() {
  return `
    <div class="stat-grid">
      ${Array.from({ length: 4 }).map(() => `
        <div class="stat">
          <div class="skeleton" style="height:12px;width:56px"></div>
          <div class="skeleton" style="height:30px;width:96px;margin-top:6px"></div>
          <div class="skeleton" style="height:11px;width:120px"></div>
        </div>`).join('')}
    </div>
    <div class="cols-2">
      <div class="card" style="height:340px"><div class="skeleton" style="height:100%;border-radius:18px"></div></div>
      <div class="card" style="height:340px"><div class="skeleton" style="height:100%;border-radius:18px"></div></div>
    </div>`;
}

export default async function HomeView(host, ctx) {
  host.innerHTML = skeleton();

  let dash;
  try {
    dash = await api.dashboard();
  } catch (e) {
    host.innerHTML = `<div class="card">${ui.emptyState(e.message || '加载失败', 'x')}</div>`;
    return;
  }

  const members = dash.family?.members || [];
  const isChild = (ctx.store.user?.role || 'PARENT') === 'CHILD';
  const tasks = dash.tasks || [];
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const ov = dash.overview || {};
  const today = new Date();

  const stats = [
    { label: '本月记录', value: ov.monthRecords ?? 0, unit: '条', hint: '这个月一起留下的瞬间' },
    { label: '本周记录', value: ov.weekRecords ?? 0, unit: '条', hint: `连续记录 ${ov.streakDays ?? 0} 天` },
    { label: '已完成任务', value: ov.doneTasks ?? 0, unit: '个', hint: `${ov.pendingTasks ?? 0} 个任务进行中` },
    { label: '家庭积分', value: ov.totalPoints ?? 0, unit: '分', hint: `${members.length} 位家人共同累计` },
  ];

  const trend = (dash.trend || []).map((p) => ({ label: p.date, count: p.count }));

  const pending = dash.pendingSubmissions || [];
  const pendingRecords = dash.pendingRecords || [];
  const milestones = dash.recentMilestones || [];

  // 待审核窗口：任务完成凭证 + 亲子提交的记录，按提交时间合并排序
  const reviewItems = [
    ...pending.map((s) => ({ kind: 'task', at: s.submittedAt, sub: s })),
    ...pendingRecords.map((r) => ({ kind: 'record', at: r.createdAt, rec: r })),
  ].sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  const ranked = [...(dash.memberStats || [])].sort((a, b) => a.rank - b.rank);

  host.innerHTML = `
    <div class="page-head fade-in">
      <div>
        <h1 class="page-title">家庭概览</h1>
        <p class="page-sub">${ui.esc(ui.dateFull(ui.isoDate(today)))} · ${ui.esc(ui.weekday(ui.isoDate(today)))}，${ui.esc(dash.family?.motto || '一起把日子过成故事')}</p>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-ghost" data-act="tasks">${ui.icon('list', 16)}查看任务看板</button>
      <button class="btn btn-primary" data-act="new-record">${ui.icon('plus', 16)}记录这一刻</button>
    </div>

    <div class="stat-grid fade-in">
      ${stats.map((s) => `
        <div class="stat">
          <span class="stat-label">${ui.esc(s.label)}</span>
          <span class="stat-value num">${s.value}<small class="stat-unit">${ui.esc(s.unit)}</small></span>
          <span class="stat-hint">${ui.esc(s.hint)}</span>
        </div>`).join('')}
    </div>

    <div class="cols-2 fade-in">
      <div class="card">
        <div class="card-head">
          <h3>近期亲子记录</h3>
          <div class="spacer"></div>
          <span class="more" data-act="more-records">查看全部 ${ui.icon('chevronRight', 13)}</span>
        </div>
        <div class="record-list">
          ${(dash.recentRecords || []).length
            ? dash.recentRecords.map((r) => ui.recordRow(r)).join('')
            : ui.emptyState('还没有记录，点右上角写下第一条吧', 'pen')}
        </div>
      </div>

      <div class="stack">
        <div class="card">
          <div class="card-head">
            <h3>近 30 天记录趋势</h3>
            <div class="spacer"></div>
            <span class="muted" style="font-size:12px">每天新增记录数</span>
          </div>
          <div class="card-body" style="padding-top:0">
            ${ui.barChart(trend)}
          </div>
        </div>

        ${isChild ? '' : `<div class="card">
          <div class="card-head">
            <h3>待审核</h3>
            <div class="spacer"></div>
            ${reviewItems.length ? `<span class="tag tag-red">${reviewItems.length} 条待处理</span>` : ''}
          </div>
          <div class="card-body" style="padding-top:0">
            ${reviewItems.length ? reviewItems.map((item) => {
              if (item.kind === 'task') {
                const s = item.sub;
                const task = taskMap.get(s.taskId);
                const cover = ui.safeUrl((s.mediaUrls || [])[0]);
                return `
                  <div class="record-row" style="border-top:1px solid var(--line);padding-left:0;padding-right:0;cursor:default">
                    ${ui.avatar({ name: s.memberName, avatar: s.memberAvatar }, 'avatar-sm')}
                    <div class="record-main">
                      <div class="record-title" style="font-size:13.5px">${ui.esc(task?.title || '任务提交')}</div>
                      <div class="record-meta">
                        <span>${ui.esc(s.memberName || '家人')}</span>
                        <span class="muted">·</span>
                        <span>${ui.esc(ui.relTime(s.submittedAt))}</span>
                      </div>
                      ${s.note ? `<div class="record-snippet">${ui.esc(s.note)}</div>` : ''}
                      <div class="row-tight mt-2">
                        ${cover ? `<img src="${ui.esc(cover)}" alt="" style="width:40px;height:40px;border-radius:9px;object-fit:cover" loading="lazy">` : ''}
                        <button class="btn btn-sm btn-primary" data-review="ok" data-task="${s.taskId}" data-sub="${s.id}">通过</button>
                        <button class="btn btn-sm btn-danger" data-review="no" data-task="${s.taskId}" data-sub="${s.id}">退回</button>
                      </div>
                    </div>
                  </div>`;
              }
              const r = item.rec;
              const cover = ui.safeUrl((r.mediaUrls || [])[0]);
              return `
                <div class="record-row" data-record-id="${r.id}" role="button" tabindex="0" style="padding-left:0;padding-right:0">
                  ${cover
                    ? `<img class="record-thumb" src="${ui.esc(cover)}" alt="" loading="lazy">`
                    : `<div class="record-thumb" style="display:grid;place-items:center;color:#D6C9BC">${ui.icon('image', 24)}</div>`}
                  <div class="record-main">
                    <div class="row wrap" style="gap:8px">
                      <span class="record-title truncate">${ui.esc(r.title)}</span>
                      <span class="tag tag-amber">记录待审核</span>
                    </div>
                    <div class="record-meta">
                      <span>${ui.esc(r.authorName || '家人')}</span>
                      <span class="muted">·</span>
                      <span>${ui.esc(ui.relTime(r.createdAt))}提交</span>
                      ${r.points ? `<span class="muted">·</span><span style="color:var(--primary);font-weight:700">+${r.points} 积分</span>` : ''}
                    </div>
                    ${r.content ? `<div class="record-snippet">${ui.esc(r.content)}</div>` : ''}
                    <div class="row-tight mt-2">
                      <button class="btn btn-sm btn-primary" data-recreview="ok" data-record="${r.id}">通过</button>
                      <button class="btn btn-sm btn-danger" data-recreview="no" data-record="${r.id}">退回</button>
                      <span class="muted" style="font-size:11.5px">点开可「通过并公开到广场」</span>
                    </div>
                  </div>
                </div>`;
            }).join('') : ui.emptyState('暂时没有需要审核的提交', 'check')}
          </div>
        </div>`}

        <div class="card">
          <div class="card-head">
            <h3>最近的成长里程碑</h3>
            <div class="spacer"></div>
            <span class="more" data-act="more-growth">成长档案 ${ui.icon('chevronRight', 13)}</span>
          </div>
          <div class="card-body" style="padding-top:0">
            ${milestones.length ? `<div class="milestone-list">${milestones.map((m) => {
              const child = members.find((x) => x.id === m.memberId);
              return `
                <div class="milestone-row">
                  <div class="milestone-icon">${ui.icon('award', 19)}</div>
                  <div class="milestone-main">
                    <b>${ui.esc(m.title)}</b>
                    <p>${ui.esc(child?.name || '孩子')}${m.description ? ` · ${ui.esc(m.description)}` : ''}</p>
                  </div>
                  <span class="milestone-date">${ui.esc(ui.dateSmart(m.date))}</span>
                </div>`;
            }).join('')}</div>` : ui.emptyState('还没有里程碑，去成长档案添加吧', 'award')}
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3>家人记录排行</h3></div>
          <div class="card-body" style="padding-top:0;display:flex;flex-direction:column;gap:12px">
            ${ranked.map((m) => `
              <div class="row" style="gap:10px">
                ${ui.avatar(m, 'avatar-sm')}
                <div style="min-width:0;flex:1">
                  <div class="row-tight">
                    <span style="font-size:13px;font-weight:650">${ui.esc(m.name)}</span>
                    <span class="muted" style="font-size:11.5px">${ui.esc(m.relation || '')}</span>
                    <span class="spacer"></span>
                    <span class="num" style="font-size:12.5px;font-weight:700;color:var(--primary)">${m.points} 分</span>
                  </div>
                  <div style="height:6px;border-radius:999px;background:var(--surface-soft);margin-top:5px;overflow:hidden">
                    <div style="height:100%;width:${Math.min(100, ranked[0]?.records ? (m.records / ranked[0].records) * 100 : 0)}%;background:var(--primary);border-radius:999px"></div>
                  </div>
                </div>
                <span class="muted num" style="font-size:11.5px">${m.records} 条</span>
              </div>`).join('') || ui.emptyState('还没有家人数据', 'users')}
          </div>
        </div>
      </div>
    </div>`;

  const openRecord = (record) => openRecordDetail({
    record,
    members,
    tasks,
    onChanged: () => ctx.reload(),
    isChild,
  });

  host.querySelectorAll('.record-row[data-record-id], .wall-card[data-record-id]').forEach((row) => {
    row.addEventListener('click', async (e) => {
      if (e.target.closest('[data-review], [data-recreview]')) return;
      const id = row.dataset.recordId;
      const cached = (dash.recentRecords || []).find((r) => String(r.id) === String(id));
      if (cached) {
        openRecord(cached);
        return;
      }
      try {
        openRecord(await api.record(id));
      } catch (err) {
        ui.toast(err.message || '加载失败', 'err');
      }
    });
  });

  host.querySelector('[data-act="new-record"]')?.addEventListener('click', () => {
    openRecordForm({ members, isChild, onSaved: () => ctx.reload() });
  });

  host.querySelector('[data-act="tasks"]')?.addEventListener('click', () => ctx.navigate('/tasks'));
  host.querySelector('[data-act="more-records"]')?.addEventListener('click', () => ctx.navigate('/timeline'));
  host.querySelector('[data-act="more-growth"]')?.addEventListener('click', () => ctx.navigate('/growth'));

  host.querySelectorAll('[data-recreview]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.record);
      const approve = btn.dataset.recreview === 'ok';

      if (approve) {
        const ok = await ui.confirmDialog({
          title: '通过这条亲子记录？',
          message: '通过后孩子提交的记录会对全家可见；如需公开到广场，可点开记录选择「通过并公开」。',
          okText: '通过',
        });
        if (!ok) return;
        try {
          await api.reviewRecord(id, { approve: true });
          ui.toast('已通过');
          ctx.reload();
        } catch (err) {
          ui.toast(err.message || '操作失败', 'err');
        }
        return;
      }

      const ok = await ui.confirmDialog({
        title: '退回这条记录？',
        message: '退回后孩子可以修改内容并重新提交审核。',
        okText: '退回',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.reviewRecord(id, { approve: false });
        ui.toast('已退回');
        ctx.reload();
      } catch (err) {
        ui.toast(err.message || '操作失败', 'err');
      }
    });
  });

  host.querySelectorAll('[data-review]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const approve = btn.dataset.review === 'ok';
      const taskId = Number(btn.dataset.task);
      const submissionId = Number(btn.dataset.sub);

      if (approve) {
        const ok = await ui.confirmDialog({
          title: '确认通过这次提交？',
          message: '通过后会自动生成一条任务记录，并给孩子加上对应积分。',
          okText: '通过',
        });
        if (!ok) return;
        try {
          await api.reviewTask(taskId, { submissionId, approve: true, comment: '做得很好，继续保持！' });
          ui.toast('已通过，积分已发放');
          ctx.reload();
        } catch (e) {
          ui.toast(e.message || '操作失败', 'err');
        }
        return;
      }

      const foot = ui.el(`
        <div class="row gap-lg">
          <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
          <button class="btn btn-danger" type="button" data-act="ok">退回</button>
        </div>`);
      const modal = ui.openModal({
        title: '退回这次提交',
        sub: '给孩子留一句鼓励或改进的建议',
        body: `<div class="field"><label for="rv-comment">审核意见</label>
          <textarea id="rv-comment" class="textarea" placeholder="例如：照片不够清楚，再拍一张给我看看～"></textarea></div>`,
        foot,
      });
      foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
      foot.querySelector('[data-act="ok"]').addEventListener('click', async () => {
        const comment = modal.modal.querySelector('#rv-comment').value.trim();
        if (!comment) {
          ui.toast('请填写退回原因', 'err');
          return;
        }
        try {
          await api.reviewTask(taskId, { submissionId, approve: false, comment });
          ui.toast('已退回');
          modal.close();
          ctx.reload();
        } catch (e) {
          ui.toast(e.message || '操作失败', 'err');
        }
      });
    });
  });
}
