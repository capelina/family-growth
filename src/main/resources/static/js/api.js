/* ==========================================================================
   接口封装：统一 fetch、Token 管理、错误处理
   ========================================================================== */

const TOKEN_KEY = 'fg.token';
const PROFILE_KEY = 'fg.profile';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function qs(params) {
  if (!params) return '';
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(path, { method, headers, body: payload });
  } catch (e) {
    throw new ApiError('网络连接失败，请确认服务已启动', 0, null);
  }

  const text = await res.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (res.status === 401) {
    clearToken();
    if (unauthorizedHandler) unauthorizedHandler();
    throw new ApiError(json?.message || '登录状态已失效，请重新登录', 401, json);
  }

  if (!res.ok || (json && json.code !== 0)) {
    throw new ApiError(json?.message || `请求失败（${res.status}）`, res.status, json);
  }

  return json ? json.data : null;
}

const get = (path, params) => request(path + qs(params));
const post = (path, body) => request(path, { method: 'POST', body });
const put = (path, body) => request(path, { method: 'PUT', body });
const del = (path) => request(path, { method: 'DELETE' });

export const api = {
  /* ---------- 认证 ---------- */
  login: (data) => post('/api/auth/login', data),
  register: (data) => post('/api/auth/register', data),
  logout: () => post('/api/auth/logout'),
  me: () => get('/api/auth/me'),

  /* ---------- 家庭与成员 ---------- */
  family: () => get('/api/family'),
  updateFamily: (data) => put('/api/family', data),
  regenerateInvite: () => post('/api/family/invite/regenerate'),
  joinFamily: (inviteCode) => post('/api/family/join', { inviteCode }),
  addMember: (data) => post('/api/family/members', data),
  updateMember: (id, data) => put(`/api/family/members/${id}`, data),
  deleteMember: (id) => del(`/api/family/members/${id}`),

  /* ---------- 亲子记录 ---------- */
  records: (params) => get('/api/records', params),
  record: (id) => get(`/api/records/${id}`),
  createRecord: (data) => post('/api/records', data),
  updateRecord: (id, data) => put(`/api/records/${id}`, data),
  deleteRecord: (id) => del(`/api/records/${id}`),
  reviewRecord: (id, data) => post(`/api/records/${id}/review`, data),
  categories: () => get('/api/records/categories'),
  photoWall: (limit = 24) => get('/api/records/photo-wall', { limit }),

  /* ---------- 任务 ---------- */
  tasks: (params) => get('/api/tasks', params),
  createTask: (data) => post('/api/tasks', data),
  updateTask: (id, data) => put(`/api/tasks/${id}`, data),
  deleteTask: (id) => del(`/api/tasks/${id}`),
  startTask: (id) => post(`/api/tasks/${id}/start`),
  submitTask: (id, data) => post(`/api/tasks/${id}/submit`, data),
  reviewTask: (id, data) => post(`/api/tasks/${id}/review`, data),
  taskSubmissions: (id) => get(`/api/tasks/${id}/submissions`),
  pendingSubmissions: () => get('/api/tasks/pending-submissions'),

  /* ---------- 成长档案 ---------- */
  growth: (memberId) => get(`/api/growth/${memberId}`),
  addMeasurement: (memberId, data) => post(`/api/growth/${memberId}/measurements`, data),
  deleteMeasurement: (id) => del(`/api/growth/measurements/${id}`),
  addMilestone: (memberId, data) => post(`/api/growth/${memberId}/milestones`, data),
  deleteMilestone: (id) => del(`/api/growth/milestones/${id}`),
  addSkill: (memberId, data) => post(`/api/growth/${memberId}/skills`, data),
  updateSkill: (id, data) => put(`/api/growth/skills/${id}`, data),
  deleteSkill: (id) => del(`/api/growth/skills/${id}`),

  /* ---------- 互动广场 ---------- */
  feed: (params) => get('/api/plaza/feed', params),
  plazaCategories: () => get('/api/plaza/categories'),
  like: (recordId) => post(`/api/plaza/${recordId}/like`),
  comments: (recordId) => get(`/api/plaza/${recordId}/comments`),
  addComment: (recordId, content) => post(`/api/plaza/${recordId}/comments`, { content }),

  /* ---------- 积分商城 ---------- */
  rewards: () => get('/api/rewards'),
  createReward: (data) => post('/api/rewards', data),
  updateReward: (id, data) => put(`/api/rewards/${id}`, data),
  deleteReward: (id) => del(`/api/rewards/${id}`),
  redeemReward: (id) => post(`/api/rewards/${id}/redeem`),
  rewardRedemptions: () => get('/api/rewards/redemptions'),
  markRedemptionDone: (id) => post(`/api/rewards/redemptions/${id}/done`),

  /* ---------- 概览 ---------- */
  dashboard: () => get('/api/dashboard'),
  stats: (days = 30) => get('/api/stats', { days }),

  /* ---------- 文件 ---------- */
  upload: async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const data = await request('/api/files/upload', { method: 'POST', form: fd });
    return data.url;
  },
};
