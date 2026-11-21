// api.js
// All calls from the frontend to the backend live in this one file.
// Pages import these functions instead of calling fetch() themselves.

// The backend address comes from the .env file (VITE_API_URL=http://localhost:5000).
// If it is empty, we use MOCK MODE: no network calls, just fake answers,
// so the pages can be tested before the backend is ready.
const API_URL = import.meta.env.VITE_API_URL || "";
const USE_MOCK = API_URL === "";

if (USE_MOCK) {
  console.log("MOCK MODE: VITE_API_URL is empty, so no real server is called.");
}

// Small helper: wait a number of milliseconds (used to imitate a slow server).
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Header with the login "ID card" for protected routes.
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// Sends a POST request with a JSON body and returns the JSON answer.
// If the server answers with an error (400, 401, 409...), we throw an Error
// that carries the server's "message", so the page can show it.
async function postJson(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    // The server sent no JSON. We keep data as an empty object.
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
}

// Create a new account. Field names follow the API contract exactly.
// userData = { firstName, lastName, email, phone, password, role, languages, city }
export async function register(userData) {
  if (USE_MOCK) {
    console.log("MOCK MODE: register", { ...userData, password: "********" });
    await wait(500);
    return {
      token: "mock-token",
      user: { firstName: userData.firstName, lastName: userData.lastName, role: userData.role },
    };
  }
  return postJson("/api/auth/register", userData);
}

// Log in with email and password. The server decides the role, not the user.
export async function login(email, password) {
  if (USE_MOCK) {
    console.log("MOCK MODE: login", email);
    await wait(500);
    return { token: "mock-token", user: { firstName: "Test", lastName: "User", role: "senior" } };
  }
  return postJson("/api/auth/login", { email, password });
}

// The logged-in user's own requests (senior: created, volunteer: accepted).
export async function getMyRequests() {
  if (USE_MOCK) {
    console.log("MOCK MODE: getMyRequests");
    await wait(500);
    const sara = { firstName: "Sara", lastName: "Nieminen", phone: "040 111 2233" };
    return [
      { _id: "1", category: "grocery", description: "Bread, milk and coffee", date: "2026-11-26T10:00:00Z", status: "Accepted", volunteer: sara, rating: null },
      { _id: "2", category: "companionship", description: "A short walk in the park", date: "2026-11-28T14:00:00Z", status: "Pending", volunteer: null, rating: null },
      { _id: "3", category: "mobility", description: "Ride to the doctor", date: "2026-11-12T09:00:00Z", status: "Completed", volunteer: sara, rating: null },
    ];
  }
  const response = await fetch(`${API_URL}/api/requests/mine`, { headers: authHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Could not load your requests.");
  return data;
}

// Save the login "ID card" (token) and the user in the browser.
export function saveSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

// Which page each role goes to after logging in.
export function homePathForRole(role) {
  const paths = {
    senior: "/senior",
    family: "/family",
    volunteer: "/volunteer",
    admin: "/admin",
  };
  return paths[role] || "/";
}