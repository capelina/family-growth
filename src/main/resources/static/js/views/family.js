/* ==========================================================================
   家庭设置：家庭信息、成员管理、邀请家人
   ========================================================================== */

import { api } from '../api.js';
import * as ui from '../ui.js';

const COLORS = ['#F4573B', '#5B8DEF', '#E8A33D', '#2E9E8F', '#A768D6', '#3FA06A'];

export default async function FamilyView(host, ctx) {
  let family = ctx.store.family;

  async function refresh() {
    family = await api.family();
    ctx.store.family = family;
    render();
  }

  function render() {
    const members = family?.members || [];
    const me = members.find((m) => m.isMe);
    const isChild = (ctx.store.user?.role || 'PARENT') === 'CHILD';

    host.innerHTML = `
      <div class="page-head fade-in">
        <div>
          <h1 class="page-title">家庭设置</h1>
          <p class="page-sub">${isChild
            ? '查看家庭信息与成员，家长负责发布任务、管理成员'
            : '管理家庭信息、添加家人，也可以把邀请码发给配偶一起记录'}</p>
        </div>
        <div class="spacer"></div>
        <span class="tag">${isChild ? '亲子成员' : '家长'} · ${members.length} 位家人 · ${family?.recordCount ?? 0} 条记录</span>
      </div>

      <div class="cols-2 fade-in">
        <div class="stack">
          <div class="card">
            <div class="card-head">
              <h3>家庭信息</h3>
              <div class="spacer"></div>
              ${isChild ? '' : `<button class="btn btn-sm btn-ghost" data-act="save-family">${ui.icon('check', 14)}保存</button>`}
            </div>
            <div class="card-body" style="padding-top:0">
              <div class="row" style="gap:14px;align-items:flex-start">
                <div style="width:132px;height:96px;border-radius:var(--radius-sm);overflow:hidden;background:var(--surface-soft);flex:none;display:grid;place-items:center;color:#D6C9BC" data-role="cover">
                  ${family?.cover ? `<img src="${ui.esc(ui.safeUrl(family.cover))}" alt="家庭封面" style="width:100%;height:100%;object-fit:cover">` : ui.icon('image', 28)}
                </div>
                <div style="flex:1;min-width:0">
                  <div class="field">
                    <label for="fm-name">家庭名称</label>
                    <input id="fm-name" class="input" value="${ui.esc(family?.name || '')}"${isChild ? ' readonly' : ''}>
                  </div>
                  <div class="field mt-2">
                    <label for="fm-motto">家庭座右铭</label>
                    <input id="fm-motto" class="input" value="${ui.esc(family?.motto || '')}" placeholder="例如：慢慢来，一起长大"${isChild ? ' readonly' : ''}>
                  </div>
                </div>
              </div>
              ${isChild ? '' : `<div class="row mt-3" style="gap:10px">
                <button class="btn btn-soft btn-sm" data-act="change-cover">${ui.icon('image', 14)}更换封面</button>
                <span class="muted" style="font-size:11.5px">支持上传本地图片</span>
              </div>`}

              <div class="row mt-4" style="gap:10px;border-top:1px solid var(--line);padding-top:16px">
                ${ui.avatar(me || { name: ctx.store.user?.nickname })}
                <div style="min-width:0">
                  <div style="font-size:13.5px;font-weight:650">${ui.esc(ctx.store.user?.nickname || '我')}</div>
                  <div style="font-size:11.5px;color:var(--muted)">账号 ${ui.esc(ctx.store.user?.username || '')}${isChild ? ' · 亲子成员' : ''}${me ? ` · 家庭身份「${ui.esc(me.relation || me.name)}」` : ''}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head">
              <h3>家庭成员</h3>
              <div class="spacer"></div>
              ${isChild ? '' : `<button class="btn btn-sm btn-ghost" data-act="add-member">${ui.icon('plus', 14)}添加成员</button>`}
            </div>
            <div class="record-list">
              ${members.map((m) => `
                <div class="record-row" style="cursor:default">
                  ${ui.avatar(m)}
                  <div class="record-main">
                    <div class="row-tight" style="gap:8px">
                      <span class="record-title" style="font-size:14px">${ui.esc(m.name)}</span>
                      ${m.role === 'CHILD' ? '<span class="tag tag-amber">孩子</span>' : '<span class="tag tag-blue">家长</span>'}
                      ${m.isMe ? '<span class="tag tag-red">自己</span>' : ''}
                    </div>
                    <div class="record-meta">
                      ${m.relation ? `<span>${ui.esc(m.relation)}</span>` : ''}
                      ${m.birthday ? `<span class="muted">·</span><span>${ui.esc(ui.dateFull(m.birthday))}（${ui.esc(ui.ageText(m.birthday))}）</span>` : ''}
                      <span class="muted">·</span>
                      <span style="color:var(--primary);font-weight:700">${m.points || 0} 积分</span>
                    </div>
                  </div>
                  ${isChild ? '' : `<div class="row-tight">
                    <button class="btn btn-quiet btn-sm" data-edit-member="${m.id}">${ui.icon('pen', 14)}</button>
                    <button class="btn btn-quiet btn-sm" data-del-member="${m.id}">${ui.icon('trash', 14)}</button>
                  </div>`}
                </div>`).join('')}
            </div>
          </div>
        </div>

        <div class="stack">
          ${isChild ? '' : `<div class="card">
            <div class="card-head"><h3>邀请家人加入</h3></div>
            <div class="card-body" style="padding-top:0">
              <p class="text-2" style="font-size:12.5px">把邀请码发给配偶或其他家人，对方注册或登录后输入邀请码，就会加入同一个家庭，看到全部记录。</p>
              <div class="row mt-3" style="gap:10px">
                <div class="input num" style="display:flex;align-items:center;letter-spacing:3px;font-weight:700;font-size:17px">${ui.esc(family?.inviteCode || '——')}</div>
                <button class="btn btn-soft nowrap" data-act="copy-code">${ui.icon('copy', 16)}复制</button>
              </div>
              <div class="row mt-3" style="gap:10px">
                <button class="btn btn-ghost btn-sm" data-act="regenerate">${ui.icon('sparkles', 14)}重新生成邀请码</button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>加入其他家庭</h3></div>
            <div class="card-body" style="padding-top:0">
              <p class="text-2" style="font-size:12.5px">如果你是被邀请的一方，输入对方发来的邀请码即可加入。</p>
              <div class="row mt-3" style="gap:10px">
                <input class="input" placeholder="输入 6 位邀请码" maxlength="12" data-role="join-input">
                <button class="btn btn-primary nowrap" data-act="join">加入</button>
              </div>
            </div>
          </div>`}

          <div class="card">
            <div class="card-head"><h3>身份说明</h3></div>
            <div class="card-body" style="padding-top:0">
              <div class="stack" style="gap:12px">
                ${isChild
                  ? `<div class="row" style="gap:10px">${ui.icon('eye', 16)}<span style="font-size:12.5px;color:var(--text-2)">可以查看家长发布的全部任务与亲子记录</span></div>
                     <div class="row" style="gap:10px">${ui.icon('camera', 16)}<span style="font-size:12.5px;color:var(--text-2)">完成任务后提交照片 / 短视频，等待家长审核</span></div>
                     <div class="row" style="gap:10px">${ui.icon('star', 16)}<span style="font-size:12.5px;color:var(--text-2)">审核通过后获得成长积分，并计入成长档案</span></div>`
                  : `<div class="row" style="gap:10px">${ui.icon('lock', 16)}<span style="font-size:12.5px;color:var(--text-2)">只有本家庭成员可以查看未公开的记录</span></div>
                     <div class="row" style="gap:10px">${ui.icon('globe', 16)}<span style="font-size:12.5px;color:var(--text-2)">标记为「公开」的记录会出现在互动广场，其他家庭可以点赞评论</span></div>
                     <div class="row" style="gap:10px">${ui.icon('star', 16)}<span style="font-size:12.5px;color:var(--text-2)">任务审核通过后自动发放积分并生成成长记录</span></div>`}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    bind();
  }

  /* ------------------------------------------------ 成员表单 */
  function openMemberForm(member) {
    const d = member || {};
    let color = d.color || COLORS[0];
    const media = ui.mediaPicker({ urls: d.avatar ? [d.avatar] : [], multiple: false });

    const node = ui.el(`
      <div class="stack" style="gap:14px">
        <div class="form-grid">
          <div class="field"><label for="mb-name">姓名</label>
            <input id="mb-name" class="input" value="${ui.esc(d.name || '')}" placeholder="例如：涵涵"></div>
          <div class="field"><label for="mb-relation">家庭身份</label>
            <input id="mb-relation" class="input" value="${ui.esc(d.relation || '')}" placeholder="例如：女儿 / 妈妈"></div>
        </div>
        <div class="form-grid">
          <div class="field"><label for="mb-role">成员类型</label>
            <select id="mb-role" class="select">
              <option value="CHILD" ${d.role !== 'PARENT' ? 'selected' : ''}>孩子</option>
              <option value="PARENT" ${d.role === 'PARENT' ? 'selected' : ''}>家长</option>
            </select></div>
          <div class="field"><label for="mb-birthday">生日</label>
            <input id="mb-birthday" class="input" type="date" value="${d.birthday || ''}"></div>
        </div>
        <div class="field">
          <label>主题色</label>
          <div class="pick-row" data-role="colors">
            ${COLORS.map((c) => `<button type="button" class="pick ${c === color ? 'on' : ''}" data-color="${c}" style="padding:6px 12px">
              <i style="width:14px;height:14px;border-radius:50%;background:${c};display:inline-block"></i><span>${c}</span></button>`).join('')}
          </div>
        </div>
        <div class="field"><label>头像</label><div data-role="avatar"></div></div>
      </div>`);

    node.querySelector('[data-role="avatar"]').appendChild(media);

    const colorBox = node.querySelector('[data-role="colors"]');
    colorBox.querySelectorAll('.pick').forEach((b) => b.addEventListener('click', () => {
      color = b.dataset.color;
      colorBox.querySelectorAll('.pick').forEach((x) => x.classList.toggle('on', x === b));
    }));

    const foot = ui.el(`<div class="row gap-lg">
      <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
      <button class="btn btn-primary" type="button" data-act="save">${member ? '保存修改' : '添加成员'}</button></div>`);

    const modal = ui.openModal({
      title: member ? '编辑成员' : '添加家庭成员',
      sub: member ? '' : '孩子可以提交任务凭证，家长负责审核',
      body: node,
      foot,
      wide: true,
    });

    foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
    foot.querySelector('[data-act="save"]').addEventListener('click', async () => {
      const name = modal.modal.querySelector('#mb-name').value.trim();
      if (!name) {
        ui.toast('请填写成员姓名', 'err');
        return;
      }
      const payload = {
        name,
        role: modal.modal.querySelector('#mb-role').value,
        relation: modal.modal.querySelector('#mb-relation').value.trim() || null,
        birthday: modal.modal.querySelector('#mb-birthday').value || null,
        color,
        avatar: media.urls()[0] || null,
      };
      try {
        if (member) await api.updateMember(member.id, payload);
        else await api.addMember(payload);
        ui.toast(member ? '已保存' : '成员已添加');
        modal.close();
        await refresh();
      } catch (e) {
        ui.toast(e.message || '保存失败', 'err');
      }
    });
  }

  function bind() {
    host.querySelector('[data-act="save-family"]')?.addEventListener('click', async () => {
      const name = host.querySelector('#fm-name').value.trim();
      if (!name) {
        ui.toast('家庭名称不能为空', 'err');
        return;
      }
      try {
        await api.updateFamily({
          name,
          motto: host.querySelector('#fm-motto').value.trim() || null,
          cover: family.cover || null,
        });
        ui.toast('家庭信息已更新');
        await refresh();
      } catch (e) {
        ui.toast(e.message || '保存失败', 'err');
      }
    });

    host.querySelector('[data-act="change-cover"]')?.addEventListener('click', () => {
      const media = ui.mediaPicker({ urls: family.cover ? [family.cover] : [], multiple: false });
      const foot = ui.el(`<div class="row gap-lg">
        <button class="btn btn-ghost" type="button" data-act="cancel">取消</button>
        <button class="btn btn-primary" type="button" data-act="save">保存封面</button></div>`);
      const modal = ui.openModal({ title: '更换家庭封面', sub: '上传一张家里的照片，或让 AI 生成一张', body: media, foot, wide: true });
      foot.querySelector('[data-act="cancel"]').addEventListener('click', () => modal.close());
      foot.querySelector('[data-act="save"]').addEventListener('click', async () => {
        try {
          await api.updateFamily({ name: family.name, motto: family.motto, cover: media.urls()[0] || null });
          ui.toast('封面已更新');
          modal.close();
          await refresh();
        } catch (e) {
          ui.toast(e.message || '保存失败', 'err');
        }
      });
    });

    host.querySelector('[data-act="add-member"]')?.addEventListener('click', () => openMemberForm(null));
    host.querySelectorAll('[data-edit-member]').forEach((b) => b.addEventListener('click', () => {
      const m = (family.members || []).find((x) => String(x.id) === b.dataset.editMember);
      if (m) openMemberForm(m);
    }));

    host.querySelectorAll('[data-del-member]').forEach((b) => b.addEventListener('click', async () => {
      const m = (family.members || []).find((x) => String(x.id) === b.dataset.delMember);
      const ok = await ui.confirmDialog({
        title: `删除成员「${m?.name || ''}」？`,
        message: '删除后该成员的任务与成长档案将不再显示。',
        okText: '删除',
        danger: true,
      });
      if (!ok) return;
      try {
        await api.deleteMember(b.dataset.delMember);
        ui.toast('成员已删除');
        await refresh();
      } catch (e) {
        ui.toast(e.message || '删除失败', 'err');
      }
    }));

    host.querySelector('[data-act="copy-code"]')?.addEventListener('click', async () => {
      const code = family.inviteCode || '';
      try {
        await navigator.clipboard.writeText(code);
        ui.toast('邀请码已复制');
      } catch {
        const input = host.querySelector('[data-role="join-input"]');
        if (input) {
          input.value = code;
          ui.toast('邀请码已填入下方输入框');
        }
      }
    });

    host.querySelector('[data-act="regenerate"]')?.addEventListener('click', async () => {
      const ok = await ui.confirmDialog({
        title: '重新生成邀请码？',
        message: '旧邀请码会立即失效，已经加入的家人不受影响。',
        okText: '重新生成',
      });
      if (!ok) return;
      try {
        await api.regenerateInvite();
        ui.toast('邀请码已更新');
        await refresh();
      } catch (e) {
        ui.toast(e.message || '操作失败', 'err');
      }
    });

    host.querySelector('[data-act="join"]')?.addEventListener('click', async () => {
      const input = host.querySelector('[data-role="join-input"]');
      const code = input.value.trim();
      if (!code) {
        ui.toast('请输入邀请码', 'err');
        return;
      }
      try {
        const data = await api.joinFamily(code);
        ctx.setSession(data);
        ui.toast('已加入新家庭');
        ctx.navigate('/home');
      } catch (e) {
        ui.toast(e.message || '邀请码无效', 'err');
      }
    });
  }

  render();
}
