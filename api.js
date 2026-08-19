const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('foleni_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me', { auth: true }),

  // business queue management
  createQueue: (payload) => request('/api/queues', { method: 'POST', body: payload, auth: true }),
  listMyQueues: () => request('/api/queues', { auth: true }),
  getQueueDetail: (id) => request(`/api/queues/${id}`, { auth: true }),
  updateQueueStatus: (id, status) =>
    request(`/api/queues/${id}/status`, { method: 'PATCH', body: { status }, auth: true }),
  callNext: (id) => request(`/api/queues/${id}/call-next`, { method: 'POST', auth: true }),
  markEntryStatus: (queueId, entryId, status) =>
    request(`/api/queues/${queueId}/entries/${entryId}`, { method: 'PATCH', body: { status }, auth: true }),

  // public / customer
  getQueueByJoinCode: (joinCode) => request(`/api/public/queues/${joinCode}`),
  joinQueue: (joinCode, payload) =>
    request(`/api/public/queues/${joinCode}/join`, { method: 'POST', body: payload }),
  getMyStatus: (sessionToken) => request(`/api/public/entries/${sessionToken}`),
  leaveQueue: (sessionToken) => request(`/api/public/entries/${sessionToken}/leave`, { method: 'POST' }),
  getChatHistory: (joinCode) => request(`/api/public/queues/${joinCode}/chat`),
};

export { getToken, API_URL };
