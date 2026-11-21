// api.js
// All calls from the frontend to the backend live in this one file.
// Pages import these functions instead of calling fetch() themselves.

// The backend address comes from .env.local (VITE_API_URL=http://localhost:5000).
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

// One helper for every real server call.
// method: "GET", "POST", "PATCH" or "DELETE"; body is optional.
// If the server answers with an error (400, 401, 403, 404, 409...), we throw
// an Error carrying the server's "message", so the page can show it.
async function request(method, path, body) {
  const headers = { ...authHeaders() };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

// ---------- Mock data (only used in MOCK MODE) ----------
const MOCK_SARA = { firstName: "Sara", lastName: "Nieminen", phone: "040 111 2233" };
const MOCK_AINO = { firstName: "Aino", lastName: "Virtanen", phone: "03 123 4567" };

// ---------- Auth ----------

// Create a new account. Field names follow the API contract exactly.
// userData = { firstName, lastName, email, phone, password, role, languages, city }
export async function register(userData) {
  if (USE_MOCK) {
    console.log("MOCK MODE: register", { ...userData, password: "********" });
    await wait(500);
    const { password, ...user } = userData;
    return { token: "mock-token", user };
  }
  return request("POST", "/api/auth/register", userData);
}

// Log in with email and password. The server decides the role, not the user.
export async function login(email, password) {
  if (USE_MOCK) {
    console.log("MOCK MODE: login", email);
    await wait(500);
    return {
      token: "mock-token",
      user: { firstName: "Test", lastName: "User",role: email.startsWith("admin") ? "admin" : email.startsWith("family") ? "family" : "senior", city: "Lahti", languages: ["Finnish"] },
    };
  }
  return request("POST", "/api/auth/login", { email, password });
}

// ---------- Help requests ----------

// The logged-in user's own requests (senior: created, volunteer: accepted).
export async function getMyRequests() {
  if (USE_MOCK) {
    console.log("MOCK MODE: getMyRequests");
    await wait(500);
    return [
      { _id: "1", category: "grocery", description: "Bread, milk and coffee", city: "Lahti", date: "2026-11-26T10:00:00Z", status: "Accepted", senior: MOCK_AINO, volunteer: MOCK_SARA, rating: null },
      { _id: "2", category: "companionship", description: "A short walk in the park", city: "Lahti", date: "2026-11-28T14:00:00Z", status: "Pending", senior: MOCK_AINO, volunteer: null, rating: null },
      { _id: "3", category: "mobility", description: "Ride to the doctor", city: "Lahti", date: "2026-11-12T09:00:00Z", status: "Completed", senior: MOCK_AINO, volunteer: MOCK_SARA, rating: 5, review: "Very kind and on time" },
    ];
  }
  return request("GET", "/api/requests/mine");
}

// Create a new help request.
// data = { category, description, language, city, date }
export async function createRequest(data) {
  if (USE_MOCK) {
    console.log("MOCK MODE: createRequest", data);
    await wait(500);
    return { _id: "mock-new", ...data, status: "Pending", volunteer: null, rating: null };
  }
  return request("POST", "/api/requests", data);
}

// Open (Pending) requests for volunteers, with optional filters.
// filters = { city, language, category } (empty values are ignored)
export async function getOpenRequests(filters = {}) {
  if (USE_MOCK) {
    console.log("MOCK MODE: getOpenRequests", filters);
    await wait(500);
    const all = [
      { _id: "11", category: "grocery", description: "Bread, milk and coffee from the shop nearby.", date: "2026-11-26T10:00:00Z", city: "Lahti", language: "Finnish", senior: { firstName: "Aino" } },
      { _id: "12", category: "companionship", description: "A short walk in the park and a coffee.", date: "2026-11-28T14:00:00Z", city: "Lahti", language: "Finnish", senior: { firstName: "Aino" } },
      { _id: "13", category: "mobility", description: "Needs a car and help with the stairs.", date: "2026-11-29T12:30:00Z", city: "Lahti", language: "Finnish", senior: { firstName: "Pentti" } },
      { _id: "14", category: "grocery", description: "Weekly shopping, list ready.", date: "2026-11-27T11:00:00Z", city: "Helsinki", language: "Swedish", senior: { firstName: "Greta" } },
    ];
    // Imitate the server's filtering
    return all.filter(
      (r) =>
        (!filters.city || r.city === filters.city) &&
        (!filters.language || r.language === filters.language) &&
        (!filters.category || r.category === filters.category)
    );
  }
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value && params.append(key, value));
  return request("GET", `/api/requests?${params}`);
}

// A volunteer accepts a request.
export async function acceptRequest(id) {
  if (USE_MOCK) {
    console.log("MOCK MODE: acceptRequest", id);
    await wait(500);
    return { _id: id, status: "Accepted" };
  }
  return request("PATCH", `/api/requests/${id}/accept`);
}

// The senior or the volunteer marks a request as done.
export async function completeRequest(id) {
  if (USE_MOCK) {
    console.log("MOCK MODE: completeRequest", id);
    await wait(500);
    return { _id: id, status: "Completed" };
  }
  return request("PATCH", `/api/requests/${id}/complete`);
}

// The senior rates the volunteer after the help is done.
export async function rateRequest(id, rating, review) {
  if (USE_MOCK) {
    console.log("MOCK MODE: rateRequest", id, rating, review);
    await wait(500);
    return { _id: id, rating, review };
  }
  return request("PATCH", `/api/requests/${id}/rate`, { rating, review });
}

// The senior cancels a request that nobody has accepted yet.
export async function cancelRequest(id) {
  if (USE_MOCK) {
    console.log("MOCK MODE: cancelRequest", id);
    await wait(500);
    return { message: "Request cancelled" };
  }
  return request("DELETE", `/api/requests/${id}`);
}

// ---------- Admin ----------

// Numbers for the admin overview.
export async function getAdminStats() {
  if (USE_MOCK) {
    console.log("MOCK MODE: getAdminStats");
    await wait(400);
    return { seniors: 38, families: 17, volunteers: 24, pendingVolunteers: 2, openRequests: 5, acceptedRequests: 4, completedRequests: 31 };
  }
  return request("GET", "/api/admin/stats");
}

// Volunteers by verification status: "pending", "verified" or "rejected".
export async function getVolunteers(status = "pending") {
  if (USE_MOCK) {
    console.log("MOCK MODE: getVolunteers", status);
    await wait(400);
    if (status !== "pending") return [];
    return [
      { _id: "v1", firstName: "Jukka", lastName: "Laine", email: "jukka.l@example.fi", phone: "050 222 3344", city: "Lahti", languages: ["Finnish", "Swedish"], createdAt: "2026-11-20T09:00:00Z" },
      { _id: "v2", firstName: "Elif", lastName: "Kaya", email: "elif.k@example.fi", phone: "044 333 4455", city: "Espoo", languages: ["Finnish", "English"], createdAt: "2026-11-21T12:00:00Z" },
    ];
  }
  return request("GET", `/api/admin/volunteers?status=${status}`);
}

// Admin approves a volunteer (one time identity check).
export async function verifyVolunteer(id) {
  if (USE_MOCK) {
    console.log("MOCK MODE: verifyVolunteer", id);
    await wait(400);
    return { _id: id, verificationStatus: "verified" };
  }
  return request("PATCH", `/api/admin/volunteers/${id}/verify`);
}

// Admin rejects a volunteer.
export async function rejectVolunteer(id) {
  if (USE_MOCK) {
    console.log("MOCK MODE: rejectVolunteer", id);
    await wait(400);
    return { _id: id, verificationStatus: "rejected" };
  }
  return request("PATCH", `/api/admin/volunteers/${id}/reject`);
}

// Every help request (read only for the admin).
export async function getAdminRequests(status = "") {
  if (USE_MOCK) {
    console.log("MOCK MODE: getAdminRequests", status);
    await wait(400);
    return [
      { _id: "r1", category: "grocery", date: "2026-11-26T10:00:00Z", status: "Accepted", senior: MOCK_AINO, createdBy: { firstName: "Mikko", lastName: "Virtanen" }, volunteer: MOCK_SARA },
      { _id: "r2", category: "companionship", date: "2026-11-28T14:00:00Z", status: "Pending", senior: MOCK_AINO, createdBy: MOCK_AINO, volunteer: null },
      { _id: "r3", category: "mobility", date: "2026-11-12T09:00:00Z", status: "Completed", senior: MOCK_AINO, createdBy: { firstName: "Mikko", lastName: "Virtanen" }, volunteer: MOCK_SARA },
    ];
  }
  return request("GET", `/api/admin/requests${status ? `?status=${status}` : ""}`);
}

// ---------- Family ----------

// The seniors this family member manages.
export async function getManagedSeniors() {
  if (USE_MOCK) {
    console.log("MOCK MODE: getManagedSeniors");
    await wait(400);
    return [
      { _id: "s1", firstName: "Aino", lastName: "Virtanen", phone: "03 123 4567", city: "Lahti", languages: ["Finnish"] },
    ];
  }
  return request("GET", "/api/family/seniors");
}

// Add a parent or relative who does not use the internet.
// data = { firstName, lastName, phone, city, languages, consent }
export async function addManagedSenior(data) {
  if (USE_MOCK) {
    console.log("MOCK MODE: addManagedSenior", data);
    await wait(400);
    return { _id: "mock-senior", ...data, role: "senior" };
  }
  return request("POST", "/api/family/seniors", data);
}

// ---------- Session helpers ----------

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
