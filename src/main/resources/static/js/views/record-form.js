/* ==========================================================================
   亲子记录表单，被顶栏「快速记录」、时间线与任务看板共用。
   积分规则：只有从任务看板「提交亲子记录」入口关联任务的记录才有积分，
   普通记录不加分，表单不再提供类型 / 关联任务 / 完成积分选择。
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';

export const CATEGORIES = ['家庭', '运动', '阅读', '艺术', '自然', '户外', '生活', '学习', '旅行', '节日', '美食', '任务'];

export const VISIBILITY = [
  { value: 'PUBLIC', label: '公开到广场', icon: 'globe', hint: '其他家庭可以看到并互动' },
  { value: 'PRIVATE', label: '仅本家庭可见', icon: 'lock', hint: '只有家里人能看到这条记录' },
];

/** 构建记录表单，返回 { node, values }；task 为关联任务（任务看板「提交亲子记录」入口） */
export function recordForm({ members = [], record = null, task = null } = {}) {
  const data = record || {};
  const linkedTaskId = data.taskId ?? task?.id ?? null;
  let visibility = data.visibility || 'PRIVATE';

  const node = ui.el(`
    <div class="stack" style="gap:14px">
      ${task ? `
      <div class="row-tight" style="gap:10px;padding:12px 14px;background:linear-gradient(135deg,#FFF4EF,#EFF8F6);border:1px solid var(--line);border-radius:14px">
        <span class="tag tag-teal">关联任务</span>
        <b style="font-size:13.5px">${ui.esc(task.title)}</b>
        <div class="spacer"></div>
        <span class="tag tag-red">+${task.points || 0} 积分</span>
      </div>
      <p class="muted" style="font-size:12.5px;margin-top:-6px">这篇记录会关联到任务「${ui.esc(task.title)}」，家长审核通过后自动获得任务积分。</p>` : ''}

      <div class="field">
        <label for="rf-title">标题</label>
        <input id="rf-title" class="input" maxlength="60" placeholder="例如：周末郊野徒步">
      </div>

      <div class="form-grid">
        <div class="field">
          <label for="rf-category">分类</label>
          <select id="rf-category" class="select">
            ${CATEGORIES.map((c) => `<option value="${ui.esc(c)}">${ui.esc(c)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="rf-date">记录日期</label>
          <input id="rf-date" class="input" type="date" value="${ui.todayISO()}">
        </div>
      </div>

      <div class="field">
        <label for="rf-location">地点</label>
        <input id="rf-location" class="input" maxlength="60" placeholder="例如：青龙湖绿道">
      </div>

      <div class="field">
        <label for="rf-content">记录内容</label>
        <textarea id="rf-content" class="textarea" maxlength="1000" placeholder="今天发生了什么？孩子的哪句话、哪个表情让你印象深刻…"></textarea>
      </div>

      <div class="field">
        <label>参与家人</label>
        <div data-role="members"></div>
      </div>

      <div class="field">
        <label>照片 / 短视频</label>
        <div data-role="media"></div>
      </div>

      <div class="field">
        <label>可见范围</label>
        <div class="pick-row" data-role="visibility">
          ${VISIBILITY.map((v) => `
            <button type="button" class="pick${v.value === visibility ? ' on' : ''}" data-value="${v.value}">
              ${ui.icon(v.icon, 15)}<span>${ui.esc(v.label)}</span>
            </button>`).join('')}
        </div>
        <span class="hint" data-role="visibility-hint"></span>
      </div>
    </div>`);

  const memberBox = node.querySelector('[data-role="members"]');
  const mediaBox = node.querySelector('[data-role="media"]');
  const visBox = node.querySelector('[data-role="visibility"]');
  const visHint = node.querySelector('[data-role="visibility-hint"]');

  const picker = ui.memberPicker(members, data.participants?.map((p) => p.id) || [], { multiple: true });
  memberBox.appendChild(picker);

  const media = ui.mediaPicker({ urls: data.mediaUrls || [] });
  mediaBox.appendChild(media);

  node.querySelector('#rf-title').value = data.title || '';
  node.querySelector('#rf-content').value = data.content || '';
  node.querySelector('#rf-location').value = data.location || '';
  if (data.category) node.querySelector('#rf-category').value = data.category;
  if (data.recordDate) node.querySelector('#rf-date').value = data.recordDate;

  function syncVisibility() {
    visBox.querySelectorAll('.pick').forEach((b) => b.classList.toggle('on', b.dataset.value === visibility));
    const cur = VISIBILITY.find((v) => v.value === visibility);
    visHint.textContent = cur ? cur.hint : '';
  }

  visBox.querySelectorAll('.pick').forEach((b) => {
    b.addEventListener('click', () => {
      visibility = b.dataset.value;
      syncVisibility();
    });
  });

  syncVisibility();

  return {
    node,
    values() {
      return {
        type: linkedTaskId ? 'TASK' : 'FREE',
        title: node.querySelector('#rf-title').value.trim(),
        content: node.querySelector('#rf-content').value.trim(),
        category: node.querySelector('#rf-category').value,
        recordDate: node.querySelector('#rf-date').value || ui.todayISO(),
        visibility,
        location: node.querySelector('#rf-location').value.trim() || null,
        participantIds: picker.values(),
        mediaUrls: media.urls(),
        taskId: linkedTaskId,
      };
    },
  };
}

/** 打开新增 / 编辑记录弹窗；task 为关联任务时表单顶部展示任务与积分信息 */
export function openRecordForm({ members = [], record = null, task = null, onSaved, redirect, isChild = false } = {}) {
  const form = recordForm({ members, record, task });
  if (isChild) {
    // 亲子记录一律仅家庭可见，待家长审核，不展示可见范围选择
    const visField = form.node.querySelector('[data-role="visibility"]')?.closest('.field');
    if (visField) visField.hidden = true;
  }
  const foot = ui.el(`
    <div class="row gap-lg">
      <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
      <button class="btn btn-primary" type="button" data-act="save">${ui.icon('check', 16)}${record ? '保存修改' : (isChild ? '提交审核' : '发布记录')}</button>
    </div>`);

  const modal = ui.openModal({
    title: record ? '编辑记录' : (task ? '完成任务·提交亲子记录' : '记录这一刻'),
    sub: isChild
      ? (record ? '修改后需家长重新审核' : (task ? `提交后需家长审核，通过即可获得 ${task.points || 0} 积分` : '提交后需家长审核通过才会展示'))
      : (record ? '修改后立即生效' : '写下今天的亲子时光，也可以随时改成公开分享'),
    body: form.node,
    foot,
    wide: true,
  });

  foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());

  const saveBtn = foot.querySelector('[data-act="save"]');
  saveBtn.addEventListener('click', async () => {
    const payload = form.values();
    if (!payload.title) {
      ui.toast('请填写记录标题', 'err');
      return;
    }
    saveBtn.disabled = true;
    try {
      const saved = record ? await api.updateRecord(record.id, payload) : await api.createRecord(payload);
      ui.toast(record ? (isChild ? '已保存，等待家长审核' : '已保存') : (isChild ? '已提交，等待家长审核' : '记录已发布'));
      modal.close();
      if (onSaved) onSaved(saved);
      if (redirect) redirect();
    } catch (e) {
      ui.toast(e.message || '保存失败', 'err');
    } finally {
      saveBtn.disabled = false;
    }
  });

  return modal;
}
