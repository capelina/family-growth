/* ==========================================================================
   记录详情弹窗（首页 / 时间线 / 照片墙共用）
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';
import { openRecordForm } from './record-form.js';

export function openRecordDetail({ record, members = [], onChanged, isChild = false } = {}) {
  const media = (record.mediaUrls || []).filter(Boolean);
  const participants = record.participants || [];

  const body = ui.el(`
    <div class="stack" style="gap:16px">
      <div class="row wrap" style="gap:8px">
        ${record.type === 'TASK' ? '<span class="tag tag-teal">任务记录</span>' : '<span class="tag">自由记录</span>'}
        ${ui.catTag(record.category)}
        ${record.visibility === 'PUBLIC'
          ? `<span class="tag tag-green">${ui.icon('globe', 12)}公开</span>`
          : `<span class="tag tag-amber">${ui.icon('lock', 12)}仅家庭</span>`}
        ${record.status === 'PENDING' ? '<span class="tag tag-red">待家长审核</span>' : ''}
        ${record.status === 'REJECTED' ? '<span class="tag tag-red">已被退回</span>' : ''}
      </div>
      <h3 style="font-size:19px;font-weight:750;letter-spacing:-.3px">${ui.esc(record.title)}</h3>
      <div class="row wrap" style="gap:14px;font-size:12.5px;color:var(--muted)">
        <span class="row-tight">${ui.icon('calendar', 14)}${ui.esc(ui.dateFull(record.recordDate))} ${ui.esc(ui.weekday(record.recordDate))}</span>
        ${record.location ? `<span class="row-tight">${ui.icon('globe', 14)}${ui.esc(record.location)}</span>` : ''}
        ${record.points ? `<span class="row-tight">${ui.icon('star', 14)}+${record.points} 积分</span>` : ''}
      </div>
      ${record.content ? `<p style="font-size:14px;color:var(--text-2);line-height:1.8;white-space:pre-wrap">${ui.esc(record.content)}</p>` : ''}
      ${media.length ? `<div class="media-grid" style="gap:10px">${media.map((u) => `
        <a class="media-item" style="width:calc(50% - 5px);height:auto;aspect-ratio:4/3" href="${ui.esc(ui.safeUrl(u))}" target="_blank" rel="noopener">
          <img src="${ui.esc(ui.safeUrl(u))}" alt="记录配图" loading="lazy" style="object-fit:cover">
        </a>`).join('')}</div>` : ''}
      <div class="row" style="gap:10px;border-top:1px solid var(--line);padding-top:14px">
        ${ui.avatar(record, 'avatar-sm')}
        <div>
          <div style="font-size:13px;font-weight:650">${ui.esc(record.authorName || '家人')}${record.authorRelation ? ` · ${ui.esc(record.authorRelation)}` : ''}</div>
          <div style="font-size:11.5px;color:var(--muted)">${ui.esc(ui.relTime(record.createdAt))}记录</div>
        </div>
        ${participants.length ? `<div class="spacer"></div><div class="row-tight"><span style="font-size:11.5px;color:var(--muted)">参与者</span>${ui.avatarStack(participants, 5)}</div>` : ''}
      </div>
    </div>`);

  // 家长审核入口（待审核记录）；编辑/删除：家长随意，亲子仅限自己未通过的记录
  const needReview = !isChild && record.status === 'PENDING';
  const canEdit = record.isMine && (!isChild || record.status !== 'APPROVED');

  const foot = ui.el(`
    <div class="row gap-lg">
      <button class="btn btn-ghost" type="button" data-act="close">关闭</button>
      <div class="spacer"></div>
      ${needReview ? `<button class="btn btn-danger" type="button" data-act="reject">退回</button>
      <button class="btn btn-soft" type="button" data-act="approve">${ui.icon('check', 15)}通过</button>
      <button class="btn btn-primary" type="button" data-act="approve-public">${ui.icon('globe', 15)}通过并公开到广场</button>` : ''}
      ${!needReview && canEdit ? `<button class="btn btn-soft" type="button" data-act="edit">${ui.icon('pen', 15)}编辑</button>` : ''}
      ${!needReview && canEdit ? `<button class="btn btn-danger" type="button" data-act="delete">${ui.icon('trash', 15)}删除</button>` : ''}
    </div>`);

  const modal = ui.openModal({
    title: record.type === 'TASK' ? '任务记录详情' : '亲子记录详情',
    sub: record.taskTitle ? `来源任务：${record.taskTitle}` : ' ',
    body,
    foot,
    wide: true,
  });

  foot.querySelector('[data-act="close"]').addEventListener('click', () => modal.close());

  const doReview = async (approve, toPublic) => {
    try {
      await api.reviewRecord(record.id, { approve, toPublic });
      ui.toast(approve ? (toPublic ? '已通过并公开到广场' : '已通过') : '已退回');
      modal.close();
      onChanged && onChanged();
    } catch (e) {
      ui.toast(e.message || '操作失败', 'err');
    }
  };
  foot.querySelector('[data-act="approve"]')?.addEventListener('click', () => doReview(true, false));
  foot.querySelector('[data-act="approve-public"]')?.addEventListener('click', () => doReview(true, true));
  foot.querySelector('[data-act="reject"]')?.addEventListener('click', () => doReview(false, false));

  foot.querySelector('[data-act="edit"]')?.addEventListener('click', () => {
    modal.close();
    openRecordForm({
      members,
      record,
      isChild,
      onSaved: () => {
        onChanged && onChanged();
      },
    });
  });

  foot.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
    const ok = await ui.confirmDialog({
      title: '删除这条记录？',
      message: '删除后无法恢复，关联的图片也会一并移除。',
      okText: '删除',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteRecord(record.id);
      ui.toast('记录已删除');
      modal.close();
      onChanged && onChanged();
    } catch (e) {
      ui.toast(e.message || '删除失败', 'err');
    }
  });

  return modal;
}
