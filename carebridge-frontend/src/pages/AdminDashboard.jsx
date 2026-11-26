// AdminDashboard.jsx: the admin page (/admin).
// The admin sees numbers for the whole platform, verifies new volunteers once,
// and can see every help request. The admin never approves or changes requests.
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getAdminStats,
  getVolunteers,
  verifyVolunteer,
  rejectVolunteer,
  getAdminRequests,
} from "../services/api";
import "./AdminDashboard.css";

const CATEGORY_LABELS = {
  grocery: "Grocery shopping",
  mobility: "Getting around",
  companionship: "Company",
  other: "Other help",
};
const STATUS_TABS = [
  { value: "pending", label: "Waiting" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];
const REQUEST_BADGES = {
  Pending: "ad-badge ad-badge--waiting",
  Accepted: "ad-badge ad-badge--accepted",
  Completed: "ad-badge ad-badge--done",
};
const REQUEST_LABELS = {
  Pending: "Waiting",
  Accepted: "Accepted",
  Completed: "Done",
};

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

// "Mikko Virtanen" from a populated user, or "-" if missing.
function fullName(person) {
  return person ? `${person.firstName} ${person.lastName || ""}`.trim() : "-";
}

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const user = getSavedUser();

  const [stats, setStats] = useState(null);
  const [volunteerTab, setVolunteerTab] = useState("pending");
  const [volunteers, setVolunteers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Load the numbers and the latest requests once when the page opens.
  useEffect(() => {
    if (!token || user.role !== "admin") return;
    getAdminStats().then(setStats).catch((err) => setError(err.message));
    getAdminRequests().then(setRequests).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Load the volunteer list again whenever the admin switches tab.
  useEffect(() => {
    if (!token || user.role !== "admin") return;
    getVolunteers(volunteerTab).then(setVolunteers).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, volunteerTab]);

  // Only a logged-in admin may see this page.
  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  // Verify or reject one volunteer, then remove them from the current tab.
  async function decide(volunteer, action) {
    setBusyId(volunteer._id);
    setError("");
    try {
      if (action === "verify") await verifyVolunteer(volunteer._id);
      else await rejectVolunteer(volunteer._id);
      setVolunteers(volunteers.filter((v) => v._id !== volunteer._id));
      // Refresh the numbers at the top
      getAdminStats().then(setStats).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // The number cards at the top
  const statCards = stats
    ? [
        { label: "Seniors", value: stats.seniors },
        { label: "Family members", value: stats.families },
        { label: "Volunteers", value: stats.volunteers, note: `${stats.pendingVolunteers} waiting for verification` },
        { label: "Open requests", value: stats.openRequests, note: `${stats.acceptedRequests} accepted · ${stats.completedRequests} done` },
      ]
    : [];

  return (
    <div className="ad-page">
      <div className="ad-heading">
        <h1 className="ad-title">Admin</h1>
        <span className="ad-tag">Signed in as {fullName(user)}</span>
      </div>

      {error && <p className="ad-error" role="alert">{error}</p>}

      {/* Numbers */}
      <section aria-label="Overview" className="ad-stats">
        {stats === null && <p className="ad-info">Loading…</p>}
        {statCards.map((card) => (
          <div key={card.label} className="ad-stat">
            <span className="ad-stat-label">{card.label}</span>
            <span className="ad-stat-value">{card.value}</span>
            {card.note && <span className="ad-stat-note">{card.note}</span>}
          </div>
        ))}
      </section>

      {/* Volunteer verification */}
      <section className="ad-section" aria-labelledby="vol-title">
        <h2 id="vol-title" className="ad-section-title">Volunteer verification</h2>
        <p className="ad-info">Each volunteer is checked once. Verified volunteers can accept requests without further checks.</p>

        <div className="ad-tabs" role="group" aria-label="Verification status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`ad-tab ${volunteerTab === tab.value ? "ad-tab--active" : ""}`}
              aria-pressed={volunteerTab === tab.value}
              onClick={() => setVolunteerTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ad-table-box">
          <table className="ad-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Contact</th>
                <th scope="col">City</th>
                <th scope="col">Languages</th>
                <th scope="col">Signed up</th>
                {volunteerTab === "pending" && <th scope="col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {volunteers.length === 0 && (
                <tr>
                  <td colSpan="6" className="ad-empty">No volunteers here.</td>
                </tr>
              )}
              {volunteers.map((v) => (
                <tr key={v._id}>
                  <td><b>{fullName(v)}</b></td>
                  <td>{v.email}<br />{v.phone}</td>
                  <td>{v.city}</td>
                  <td>{(v.languages || []).join(", ")}</td>
                  <td>{formatDate(v.createdAt)}</td>
                  {volunteerTab === "pending" && (
                    <td>
                      <span className="ad-actions">
                        <button type="button" className="ad-btn" disabled={busyId === v._id}
                          onClick={() => decide(v, "verify")}>Verify</button>
                        <button type="button" className="ad-btn ad-btn--danger" disabled={busyId === v._id}
                          onClick={() => decide(v, "reject")}>Reject</button>
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All requests (read only) */}
      <section className="ad-section" aria-labelledby="req-title">
        <h2 id="req-title" className="ad-section-title">All requests</h2>
        <div className="ad-table-box">
          <table className="ad-table">
            <thead>
              <tr>
                <th scope="col">Request</th>
                <th scope="col">For</th>
                <th scope="col">Posted by</th>
                <th scope="col">When</th>
                <th scope="col">Status</th>
                <th scope="col">Volunteer</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan="6" className="ad-empty">No requests yet.</td>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r._id}>
                  <td><b>{CATEGORY_LABELS[r.category] || r.category}</b></td>
                  <td>{fullName(r.senior)}</td>
                  <td>{fullName(r.createdBy)}</td>
                  <td>{formatDate(r.date)}</td>
                  <td><span className={REQUEST_BADGES[r.status]}>{REQUEST_LABELS[r.status] || r.status}</span></td>
                  <td>{fullName(r.volunteer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ad-info">Admins can see every request but do not approve them. Seniors and volunteers arrange help directly.</p>
      </section>
    </div>
  );
}
