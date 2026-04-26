export const DEFAULT_BASE_URL = "http://localhost:5000";
const BASE_URL_KEY = "compilerhub:baseURL";
const TOKEN_KEY = "compilerhub:token";

export const getBaseURL = () => localStorage.getItem(BASE_URL_KEY) || DEFAULT_BASE_URL;

export const setBaseURL = (url) => {
  localStorage.setItem(BASE_URL_KEY, url);
};

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function apiFetch(endpoint, options = {}) {
  const url = `${getBaseURL()}${endpoint}`;
  const token = tokenStorage.get();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    
    // Auth error interceptor logic
    if (res.status === 401) {
      tokenStorage.clear();
      localStorage.removeItem("compilerhub:username");
      if (!window.location.hash.startsWith("#/auth")) {
        window.location.hash = "#/auth";
      }
      return Promise.reject(new Error("Unauthorized"));
    }

    // Try to parse json, if empty or invalid just return text
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = text;
    }

    if (!res.ok) {
      return Promise.reject({ response: { status: res.status, data } });
    }

    return { data, status: res.status };
  } catch (err) {
    return Promise.reject(err);
  }
}

export const api = {
  get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};
