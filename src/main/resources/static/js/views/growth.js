/* ==========================================================================
   成长档案：身高体重曲线、技能发展、成长里程碑、作品集
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';
import { openRecordDetail } from './record-detail.js';

const MILESTONE_ICONS = [
  { value: 'award', label: '荣誉' },
  { value: 'bike', label: '运动' },
  { value: 'music', label: '音乐' },
  { value: 'book', label: '阅读' },
  { value: 'swim', label: '游泳' },
  { value: 'star', label: '星星' },
  { value: 'heart', label: '爱心' },
  { value: 'sprout', label: '成长' },
];

const ICON_ALIAS = { shoe: 'star', heart: 'heart', bike: 'bike', swim: 'swim', book: 'book', music: 'music' };

function milestoneIcon(name) {
  return ui.icon(ICON_ALIAS[name] || name || 'award', 19);
}

function dotRow(level) {
  const lv = Number(level) || 0;
  return `<div class="skill-dots">${Array.from({ length: 5 }).map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>`;
}

export default async function GrowthView(host, ctx) {
  const members = ctx.store.family?.members || [];
  const children = members.filter((m) => m.role === 'CHILD');
  const isChild = (ctx.store.user?.role || 'PARENT') === 'CHILD';

  if (!children.length) {
    host.innerHTML = `
      <div class="page-head"><div><h1 class="page-title">成长档案</h1>
        <p class="page-sub">为孩子建立专属的生长曲线、技能与里程碑档案</p></div></div>
      <div class="card">${ui.emptyState('还没有孩子成员，先到「家庭设置」里添加一个吧', 'smile')}</div>`;
    return;
  }

  let currentId = children[0].id;
  let profile = null;
  let photos = [];

  host.innerHTML = `
    <div class="page-head fade-in">
      <div>
        <h1 class="page-title">成长档案</h1>
        <p class="page-sub">身高体重曲线、技能发展、里程碑与作品集，都在这里沉淀</p>
      </div>
    </div>
    <div class="child-tabs fade-in" style="margin-bottom:20px" data-role="tabs"></div>
    <div data-role="body"></div>`;

  const tabsBox = host.querySelector('[data-role="tabs"]');
  const bodyBox = host.querySelector('[data-role="body"]');

  function renderTabs() {
    tabsBox.innerHTML = children.map((m) => `
      <button type="button" class="child-tab ${m.id === currentId ? 'on' : ''}" data-id="${m.id}">
        ${ui.avatar(m, 'avatar-sm')}
        <span style="display:flex;flex-direction:column;align-items:flex-start">
          <b>${ui.esc(m.name)}</b>
          <span>${ui.esc(ui.ageText(m.birthday) || m.relation || '')} · ${m.points || 0} 积分</span>
        </span>
      </button>`).join('');

    tabsBox.querySelectorAll('.child-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        currentId = Number(tab.dataset.id);
        renderTabs();
        load();
      });
    });
  }

  function render() {
    const p = profile;
    const member = p.member || {};
    const measurements = [...(p.measurements || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const skills = p.skills || [];
    const milestones = [...(p.milestones || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const stats = [
      { label: '年龄', value: ui.ageText(member.birthday) || `${Math.floor((p.ageMonths || 0) / 12)} 岁`, plain: true, hint: member.birthday ? `生日 ${ui.dateFull(member.birthday)}` : '' },
      { label: '最新身高', value: p.latestHeight || '—', unit: 'cm', hint: measurements.length ? `${measurements.length} 次测量记录` : '还没有测量数据' },
      { label: '最新体重', value: p.latestWeight || '—', unit: 'kg', hint: `比上次记录更有进步` },
      { label: '成长记录', value: p.recordCount ?? 0, unit: '条', hint: `完成任务 ${p.taskDoneCount ?? 0} 个 · 照片 ${p.photoCount ?? 0} 张` },
    ];

    const points = measurements.map((m) => ({
      label: ui.dateShort(m.date),
      heightCm: m.heightCm,
      weightKg: m.weightKg,
    }));

    bodyBox.innerHTML = `
      <div class="stat-grid fade-in">
        ${stats.map((s) => `
          <div class="stat">
            <span class="stat-label">${ui.esc(s.label)}</span>
            <span class="stat-value num" style="${s.plain ? 'font-size:26px' : ''}">${ui.esc(String(s.value))}${s.unit ? `<small class="stat-unit">${ui.esc(s.unit)}</small>` : ''}</span>
            <span class="stat-hint">${ui.esc(s.hint)}</span>
          </div>`).join('')}
      </div>

      <div class="cols-2 fade-in">
        <div class="stack">
          <div class="card">
            <div class="card-head">
              <h3>身高 / 体重曲线</h3>
              <div class="spacer"></div>
              <button class="btn btn-sm btn-ghost" data-act="add-measure"${isChild ? ' hidden' : ''}>${ui.icon('plus', 14)}记录测量</button>
            </div>
            <div class="card-body" style="padding-top:0">
              <div class="chart-legend">
                <span><i style="background:#F4573B"></i>身高 cm</span>
                <span><i style="background:#2E9E8F"></i>体重 kg</span>
              </div>
              ${ui.lineChart(points, [
                { value: 'heightCm', color: '#F4573B' },
                { value: 'weightKg', color: '#2E9E8F' },
              ])}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3>历史测量</h3>
              <div class="spacer"></div>
              <span class="muted" style="font-size:12px">${measurements.length} 条</span>
            </div>
            <div class="record-list">
              ${measurements.length ? [...measurements].reverse().map((m) => `
                <div class="record-row" style="cursor:default">
                  <div class="record-main">
                    <div class="record-title" style="font-size:14px">${ui.esc(ui.dateFull(m.date))}</div>
                    <div class="record-meta">
                      ${m.heightCm ? `<span>身高 <b class="num">${m.heightCm} cm</b></span>` : ''}
                      ${m.weightKg ? `<span class="muted">·</span><span>体重 <b class="num">${m.weightKg} kg</b></span>` : ''}
                      ${m.note ? `<span class="muted">·</span><span>${ui.esc(m.note)}</span>` : ''}
                    </div>
                  </div>
                  ${isChild ? '' : `<button class="btn btn-quiet btn-sm" data-del-measure="${m.id}">${ui.icon('trash', 14)}</button>`}
                </div>`).join('') : ui.emptyState('还没有测量数据', 'trend')}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3>作品集</h3>
              <div class="spacer"></div>
              <span class="muted" style="font-size:12px">${photos.length} 张</span>
            </div>
            <div class="card-body" style="padding-top:0">
              ${photos.length
                ? `<div class="wall" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${photos.map((r) => ui.wallCard(r)).join('')}</div>`
                : ui.emptyState('还没有带照片的记录', 'image')}
            </div>
          </div>
        </div>

        <div class="stack">
          <div class="card">
            <div class="card-head">
              <h3>技能发展</h3>
              <div class="spacer"></div>
              <button class="btn btn-sm btn-ghost" data-act="add-skill"${isChild ? ' hidden' : ''}>${ui.icon('plus', 14)}新增技能</button>
            </div>
            <div class="card-body" style="padding-top:0">
              ${skills.length ? skills.map((s) => `
                <div class="skill-row">
                  <span class="skill-name">${ui.esc(s.name)}</span>
                  ${dotRow(s.level)}
                  <span class="skill-note">${ui.esc(s.note || s.category || '')}</span>
                  <button class="btn btn-quiet btn-sm" data-edit-skill="${s.id}"${isChild ? ' hidden' : ''}>${ui.icon('pen', 13)}</button>
                  <button class="btn btn-quiet btn-sm" data-del-skill="${s.id}"${isChild ? ' hidden' : ''}>${ui.icon('trash', 13)}</button>
                </div>`).join('') : ui.emptyState('还没有技能记录', 'star')}
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3>成长里程碑</h3>
              <div class="spacer"></div>
              <button class="btn btn-sm btn-ghost" data-act="add-milestone"${isChild ? ' hidden' : ''}>${ui.icon('plus', 14)}新增里程碑</button>
            </div>
            <div class="card-body" style="padding-top:0">
              ${milestones.length ? `<div class="milestone-list">${milestones.map((m) => `
                <div class="milestone-row">
                  <div class="milestone-icon">${milestoneIcon(m.icon)}</div>
                  <div class="milestone-main">
                    <b>${ui.esc(m.title)}</b>
                    <p>${ui.esc(m.description || '')}</p>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                    <span class="milestone-date">${ui.esc(ui.dateSmart(m.date))}</span>
                    <button class="btn btn-quiet btn-sm" data-del-milestone="${m.id}"${isChild ? ' hidden' : ''}>${ui.icon('trash', 13)}</button>
                  </div>
                </div>`).join('')}</div>` : ui.emptyState('还没有里程碑', 'award')}
            </div>
          </div>
        </div>
      </div>`;

    bind();
  }

  function bind() {
    bodyBox.querySelector('[data-act="add-measure"]')?.addEventListener('click', openMeasureForm);
    bodyBox.querySelector('[data-act="add-skill"]')?.addEventListener('click', () => openSkillForm(null));
    bodyBox.querySelector('[data-act="add-milestone"]')?.addEventListener('click', openMilestoneForm);

    bodyBox.querySelectorAll('[data-del-measure]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await ui.confirmDialog({ title: '删除这条测量记录？', message: '删除后曲线会自动更新。', okText: '删除', danger: true });
      if (!ok) return;
      try {
        await api.deleteMeasurement(b.dataset.delMeasure);
        ui.toast('已删除');
        load();
      } catch (e) {
        ui.toast(e.message || '删除失败', 'err');
      }
    }));

    bodyBox.querySelectorAll('[data-del-milestone]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await ui.confirmDialog({ title: '删除这个里程碑？', message: '删除后无法恢复。', okText: '删除', danger: true });
      if (!ok) return;
      try {
        await api.deleteMilestone(b.dataset.delMilestone);
        ui.toast('已删除');
        load();
      } catch (e) {
        ui.toast(e.message || '删除失败', 'err');
      }
    }));

    bodyBox.querySelectorAll('[data-del-skill]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await ui.confirmDialog({ title: '删除这项技能？', message: '删除后无法恢复。', okText: '删除', danger: true });
      if (!ok) return;
      try {
        await api.deleteSkill(b.dataset.delSkill);
        ui.toast('已删除');
        load();
      } catch (e) {
        ui.toast(e.message || '删除失败', 'err');
      }
    }));

    bodyBox.querySelectorAll('[data-edit-skill]').forEach((b) => b.addEventListener('click', () => {
      const skill = (profile.skills || []).find((s) => String(s.id) === b.dataset.editSkill);
      if (skill) openSkillForm(skill);
    }));

    bodyBox.querySelectorAll('.wall-card[data-record-id]').forEach((card) => card.addEventListener('click', async () => {
      const record = photos.find((r) => String(r.id) === card.dataset.recordId);
      if (record) {
        openRecordDetail({ record, members, onChanged: load, isChild });
      }
    }));
  }

  function openMeasureForm() {
    const body = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="form-grid">
          <div class="field"><label for="gm-date">测量日期</label>
            <input id="gm-date" class="input" type="date" value="${ui.todayISO()}"></div>
          <div class="field"><label for="gm-height">身高（cm）</label>
            <input id="gm-height" class="input" type="number" step="0.5" placeholder="例如：138.5"></div>
        </div>
        <div class="form-grid">
          <div class="field"><label for="gm-weight">体重（kg）</label>
            <input id="gm-weight" class="input" type="number" step="0.1" placeholder="例如：33.2"></div>
          <div class="field"><label for="gm-note">备注</label>
            <input id="gm-note" class="input" placeholder="例如：小学体检"></div>
        </div>
      </div>`);
    const foot = ui.el(`<div class="row gap-lg">
      <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
      <button class="btn btn-primary" type="button" data-act="save">保存</button></div>`);
    const modal = ui.openModal({ title: '记录身高体重', sub: '每月记录一次，曲线更能看出成长节奏', body, foot });
    foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
    foot.querySelector('[data-act="save"]').addEventListener('click', async () => {
      const height = Number(modal.modal.querySelector('#gm-height').value);
      const weight = Number(modal.modal.querySelector('#gm-weight').value);
      if (!height && !weight) {
        ui.toast('请至少填写身高或体重', 'err');
        return;
      }
      try {
        await api.addMeasurement(currentId, {
          date: modal.modal.querySelector('#gm-date').value || ui.todayISO(),
          heightCm: height || null,
          weightKg: weight || null,
          note: modal.modal.querySelector('#gm-note').value.trim() || null,
        });
        ui.toast('测量记录已保存');
        modal.close();
        load();
      } catch (e) {
        ui.toast(e.message || '保存失败', 'err');
      }
    });
  }

  function openSkillForm(skill) {
    let level = skill?.level || 3;
    const node = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="field"><label for="sk-name">技能名称</label>
          <input id="sk-name" class="input" placeholder="例如：钢琴" value="${ui.esc(skill?.name || '')}"></div>
        <div class="form-grid">
          <div class="field"><label for="sk-cat">类别</label>
            <select id="sk-cat" class="select">
              ${['艺术', '运动', '学习', '生活', '社交', '其他'].map((c) => `<option ${c === skill?.category ? 'selected' : ''}>${c}</option>`).join('')}
            </select></div>
          <div class="field"><label>掌握程度</label>
            <div class="row" style="gap:8px" data-role="level"></div></div>
        </div>
        <div class="field"><label for="sk-note">备注</label>
          <input id="sk-note" class="input" placeholder="例如：能完整弹奏《小星星变奏曲》" value="${ui.esc(skill?.note || '')}"></div>
      </div>`);

    const levelBox = node.querySelector('[data-role="level"]');
    function renderLevel() {
      levelBox.innerHTML = Array.from({ length: 5 }).map((_, i) => `
        <button type="button" class="chip ${i < level ? 'on' : ''}" data-lv="${i + 1}">${i + 1}</button>`).join('');
      levelBox.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => {
        level = Number(b.dataset.lv);
        renderLevel();
      }));
    }
    renderLevel();

    const foot = ui.el(`<div class="row gap-lg">
      <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
      <button class="btn btn-primary" type="button" data-act="save">保存</button></div>`);
    const modal = ui.openModal({
      title: skill ? '编辑技能' : '新增技能',
      sub: '用 1-5 档记录孩子当前掌握程度，过段时间再更新一次',
      body: node,
      foot,
    });
    foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
    foot.querySelector('[data-act="save"]').addEventListener('click', async () => {
      const name = modal.modal.querySelector('#sk-name').value.trim();
      if (!name) {
        ui.toast('请填写技能名称', 'err');
        return;
      }
      const payload = {
        name,
        category: modal.modal.querySelector('#sk-cat').value,
        level,
        note: modal.modal.querySelector('#sk-note').value.trim() || null,
      };
      try {
        if (skill) await api.updateSkill(skill.id, payload);
        else await api.addSkill(currentId, payload);
        ui.toast(skill ? '已保存' : '技能已添加');
        modal.close();
        load();
      } catch (e) {
        ui.toast(e.message || '保存失败', 'err');
      }
    });
  }

  function openMilestoneForm() {
    let iconValue = 'award';
    const node = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="field"><label for="ms-title">里程碑</label>
          <input id="ms-title" class="input" placeholder="例如：学会骑自行车"></div>
        <div class="form-grid">
          <div class="field"><label for="ms-date">达成日期</label>
            <input id="ms-date" class="input" type="date" value="${ui.todayISO()}"></div>
          <div class="field"><label>图标</label><div class="pick-row" data-role="icon"></div></div>
        </div>
        <div class="field"><label for="ms-desc">说明</label>
          <textarea id="ms-desc" class="textarea" placeholder="记录一下当时的细节吧"></textarea></div>
      </div>`);

    const iconBox = node.querySelector('[data-role="icon"]');
    function renderIcons() {
      iconBox.innerHTML = MILESTONE_ICONS.map((i) => `
        <button type="button" class="pick ${i.value === iconValue ? 'on' : ''}" data-value="${i.value}">
          ${ui.icon(i.value, 15)}<span>${ui.esc(i.label)}</span></button>`).join('');
      iconBox.querySelectorAll('.pick').forEach((b) => b.addEventListener('click', () => {
        iconValue = b.dataset.value;
        renderIcons();
      }));
    }
    renderIcons();

    const foot = ui.el(`<div class="row gap-lg">
      <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
      <button class="btn btn-primary" type="button" data-act="save">${ui.icon('award', 16)}记录里程碑</button></div>`);
    const modal = ui.openModal({ title: '新增成长里程碑', sub: '第一次、学会了、戒掉了…都值得被记住', body: node, foot });
    foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
    foot.querySelector('[data-act="save"]').addEventListener('click', async () => {
      const title = modal.modal.querySelector('#ms-title').value.trim();
      if (!title) {
        ui.toast('请填写里程碑名称', 'err');
        return;
      }
      try {
        await api.addMilestone(currentId, {
          title,
          date: modal.modal.querySelector('#ms-date').value || ui.todayISO(),
          description: modal.modal.querySelector('#ms-desc').value.trim() || null,
          icon: iconValue,
        });
        ui.toast('里程碑已记录');
        modal.close();
        load();
      } catch (e) {
        ui.toast(e.message || '保存失败', 'err');
      }
    });
  }

  async function load() {
    bodyBox.innerHTML = `<div class="card" style="height:260px"><div class="skeleton" style="height:100%;border-radius:18px"></div></div>`;
    try {
      const [p, records] = await Promise.all([
        api.growth(currentId),
        api.records({ memberId: currentId, size: 100 }).catch(() => ({ items: [] })),
      ]);
      profile = p;
      photos = (records.items || []).filter((r) => (r.mediaUrls || []).length);
      render();
    } catch (e) {
      bodyBox.innerHTML = `<div class="card">${ui.emptyState(e.message || '加载失败', 'x')}</div>`;
    }
  }

  renderTabs();
  await load();
}
