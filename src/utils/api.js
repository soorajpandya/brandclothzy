import { auth } from '../firebase';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * Calls the BrandClothzy API with the signed-in user's Firebase ID token.
 * The server verifies the token; nothing here is trusted for authorization.
 */
export async function api(path, { method = 'GET', body, signal, auth: withAuth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (withAuth) {
    const user = auth.currentUser;
    if (!user) throw new ApiError('Please sign in to continue.', 401);
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok && res.status !== 202) throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status, data);
  return { status: res.status, data };
}
