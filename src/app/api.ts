export const API_BASE = 'https://tazalyk-api.vercel.app/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(r: Response) {
  if (r.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
    return { success: false, data: null, error: 'Unauthorized' };
  }
  return r.json();
}

export const api = {
  get: async (path: string) => {
    try {
      const r = await fetch(API_BASE + path, { headers: getHeaders() });
      return handleResponse(r);
    } catch (e) {
      console.error(e);
      return { success: false, data: null, error: String(e) };
    }
  },
  post: async (path: string, body: any) => {
    try {
      const r = await fetch(API_BASE + path, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      return handleResponse(r);
    } catch (e) {
      console.error(e);
      return { success: false, data: null, error: String(e) };
    }
  },
  patch: async (path: string, body: any) => {
    try {
      const r = await fetch(API_BASE + path, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      return handleResponse(r);
    } catch (e) {
      console.error(e);
      return { success: false, data: null, error: String(e) };
    }
  },
  delete: async (path: string) => {
    try {
      const r = await fetch(API_BASE + path, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return handleResponse(r);
    } catch (e) {
      console.error(e);
      return { success: false, data: null, error: String(e) };
    }
  },
};
