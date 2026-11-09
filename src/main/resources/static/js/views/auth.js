/* ==========================================================================
   登录 / 注册
   ========================================================================== */

import { api, setToken } from '../api.js';
import * as ui from '../ui.js';

const VISUAL_PHOTO = '/img/login-hero.jpg';

export default async function AuthView(host, ctx) {
  let mode = 'login';
  let busy = false;

  host.innerHTML = `
    <div class="auth">
      <section class="auth-visual">
        <img class="auth-photo" src="${ui.esc(VISUAL_PHOTO)}" alt="一家三代人牵手走过阳光林荫道的背影">
        <div class="auth-brand">
          <div class="brand-mark">${ui.icon('brand', 20)}</div>
          <div class="brand-text">
            <span class="brand-name">成长家</span>
            <span class="brand-sub">FAMILY GROWTH</span>
          </div>
        </div>
      </section>

      <div class="auth-copy">
        <h2>把每一段陪伴<br>都留成看得见的成长</h2>
        <p>记录亲子时光、布置成长任务、沉淀孩子的成长档案，还可以把温暖的瞬间分享到家庭广场。</p>
      </div>

      <section class="auth-form-wrap">
        <form class="auth-card" id="auth-form" novalidate>
          <div>
            <h1 id="auth-title">欢迎回来</h1>
            <p class="sub" id="auth-sub">登录后继续记录你们的家庭故事</p>
          </div>

          <div class="auth-switch" id="auth-switch">
            <button type="button" data-mode="login" class="on">登录</button>
            <button type="button" data-mode="register">注册账号</button>
          </div>

          <div class="stack" id="auth-fields" style="gap:14px">
            <div class="field">
              <label for="f-username">用户名</label>
              <input id="f-username" class="input" name="username" autocomplete="username" placeholder="请输入用户名" required>
            </div>
            <div class="field">
              <label for="f-password">密码</label>
              <input id="f-password" class="input" name="password" type="password" autocomplete="current-password" placeholder="请输入密码" required>
            </div>
            <div class="field" data-register hidden>
              <label for="f-nickname">你的昵称</label>
              <input id="f-nickname" class="input" name="nickname" placeholder="例如：涵涵妈妈 / 小乐乐">
            </div>
            <div class="field" data-register hidden>
              <label>选择身份</label>
              <div class="pick-row" id="f-role">
                <button type="button" class="pick on" data-role-val="PARENT">我是家长</button>
                <button type="button" class="pick" data-role-val="CHILD">我是亲子成员</button>
              </div>
              <p class="muted" id="f-role-hint" style="font-size:11.5px;margin-top:6px">家长可创建家庭、发布任务、审核孩子的提交</p>
            </div>
            <div class="field" data-register data-role-field="PARENT" hidden>
              <label for="f-family">家庭名称</label>
              <input id="f-family" class="input" name="familyName" placeholder="例如：陈家小院">
            </div>
            <div class="field" data-register data-role-field="CHILD" hidden>
              <label for="f-invite">家庭邀请码</label>
              <input id="f-invite" class="input" name="inviteCode" placeholder="请输入家长分享的 6 位邀请码" maxlength="12">
            </div>
          </div>

          <div class="auth-error hidden" id="auth-error"></div>

          <button class="btn btn-primary btn-block" id="auth-submit" type="submit">登录</button>

          <div class="auth-demo">
            ${ui.icon('sparkles', 16)}
            <div>体验账号 <code>demo</code> / <code>123456</code>（家长视角），里面已经准备好了一个四口之家的演示数据。</div>
          </div>
        </form>
      </section>
    </div>`;

  const form = host.querySelector('#auth-form');
  const title = host.querySelector('#auth-title');
  const sub = host.querySelector('#auth-sub');
  const switchBox = host.querySelector('#auth-switch');
  const registerFields = [...host.querySelectorAll('[data-register]')];
  const roleBox = host.querySelector('#f-role');
  const roleHint = host.querySelector('#f-role-hint');
  const errorBox = host.querySelector('#auth-error');
  const submit = host.querySelector('#auth-submit');

  let role = 'PARENT';

  const ROLE_COPY = {
    PARENT: {
      title: '创建一个家庭',
      sub: '注册后即可添加家人、发布任务和亲子记录',
      submit: '创建并进入',
      hint: '家长可创建家庭、发布任务、审核孩子的提交',
    },
    CHILD: {
      title: '加入家庭',
      sub: '输入家长分享的邀请码，加入他们的家庭',
      submit: '加入并进入',
      hint: '亲子成员只能查看家长发布的任务并提交完成凭证',
    },
  };

  function syncMode() {
    switchBox.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
    registerFields.forEach((f) => { f.hidden = mode !== 'register'; });
    const copy = ROLE_COPY[role];
    if (mode === 'login') {
      title.textContent = '欢迎回来';
      sub.textContent = '登录后继续记录你们的家庭故事';
      submit.textContent = '登录';
    } else {
      title.textContent = copy.title;
      sub.textContent = copy.sub;
      submit.textContent = copy.submit;
    }
    // 身份相关字段只在注册时按所选身份展示
    host.querySelectorAll('[data-role-field]').forEach((f) => {
      f.hidden = !(mode === 'register' && f.dataset.roleField === role);
    });
    roleHint.textContent = copy.hint;
    errorBox.classList.add('hidden');
  }

  switchBox.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      mode = b.dataset.mode;
      syncMode();
    });
  });

  roleBox.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      role = b.dataset.roleVal;
      roleBox.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      syncMode();
    });
  });

  function fail(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const username = host.querySelector('#f-username').value.trim();
    const password = host.querySelector('#f-password').value;
    if (!username || !password) {
      fail('请填写用户名和密码');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      fail('密码至少 6 位');
      return;
    }
    if (mode === 'register' && role === 'CHILD' && !host.querySelector('#f-invite').value.trim()) {
      fail('请输入家长分享的邀请码');
      return;
    }

    busy = true;
    submit.disabled = true;
    submit.textContent = mode === 'login' ? '登录中…' : '提交中…';

    try {
      let data;
      if (mode === 'login') {
        data = await api.login({ username, password });
      } else {
        data = await api.register({
          username,
          password,
          nickname: host.querySelector('#f-nickname').value.trim() || username,
          role,
          familyName: role === 'CHILD' ? null : (host.querySelector('#f-family').value.trim() || `${username} 的家`),
          inviteCode: role === 'CHILD' ? host.querySelector('#f-invite').value.trim() : null,
        });
      }
      setToken(data.token);
      ctx.setSession(data);
      ui.toast(mode === 'login' ? '欢迎回来' : (role === 'CHILD' ? '已加入家庭' : '家庭创建成功'));
      ctx.navigate('/home');
    } catch (err) {
      fail(err.message || '操作失败，请稍后再试');
      busy = false;
      submit.disabled = false;
      syncMode();
    }
  });

  syncMode();
  host.querySelector('#f-username').focus();
}
