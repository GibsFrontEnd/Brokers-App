import axios from "axios";
import { getApiBaseUrl } from "./config";

// The sign-in token lives in an HttpOnly cookie that the API sets at login, so page scripts
// cannot read it. Requests only need to carry cookies (see installSessionTransport).
//
// A token returned by the login response is also held in memory, and sent as a Bearer header,
// for set-ups where the browser will not keep the cookie (for example the app on localhost
// talking to a deployed API). It is never written to localStorage, so a reload drops it and
// the cookie takes over.
let memoryToken = null;

export const setSessionToken = (token) => {
  memoryToken = token || null;
};

// Truthy while someone is signed in. Many callers still build an Authorization header from
// this; when the cookie is present the API ignores the header, so the placeholder is harmless.
export const getToken = () => {
  if (memoryToken) return memoryToken;
  try {
    return localStorage.getItem("user") ? "session" : null;
  } catch {
    return null;
  }
};

// Make axios and fetch send the session cookie to the API.
export const installSessionTransport = () => {
  axios.defaults.withCredentials = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (url && url.startsWith(getApiBaseUrl()) && !init?.credentials) {
      init = { ...init, credentials: "include" };
    }
    return nativeFetch(input, init);
  };
};

// Ask the API to clear the cookie. A failure is ignored: the local session is already gone.
export const endServerSession = () => {
  fetch(`${getApiBaseUrl()}/Auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
};

// False only when the API says the session is not valid (no cookie, expired, or revoked).
export const sessionIsValid = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/Auth/session`, {
      headers: memoryToken ? { Authorization: `Bearer ${memoryToken}` } : {},
      credentials: "include",
    });
    return response.status !== 401;
  } catch {
    // Offline or the API is down: keep the session; calls will fail on their own.
    return true;
  }
};
