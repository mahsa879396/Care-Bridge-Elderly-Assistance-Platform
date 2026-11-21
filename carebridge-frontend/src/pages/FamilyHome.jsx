// FamilyHome.jsx: the family member's home page (/family).
// Shows the seniors this family member helps, a button to ask for help for each,
// and all requests made for them with status and volunteer contact.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getManagedSeniors, getMyRequests, cancelRequest } from "../services/api";
import "./Family.css";

const CATEGORY_LABELS = {
  grocery: "Grocery shopping",
  mobility: "Getting around",
  companionship: "Company",
  other: "Other help",
};
const STATUS_BADGES = {
  Pending: { text: "Waiting", className: "fm-badge fm-badge--waiting" },
  Accepted: { text: "Accepted", className: "fm-badge fm-badge--accepted" },
  Completed: { text: "Done", className: "fm-badge fm-badge--done" },
};

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("en-GB", {
    weekday: "short",
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

// "Aino Virtanen" -> "AV" for the round name badge
function initials(person) {
  return `${person.firstName?.[0] || ""}${person.lastName?.[0] || ""}`.toUpperCase();
}

export default function FamilyHome() {
  const token = localStorage.getItem("token");
  const user = getSavedUser();

  const [seniors, setSeniors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Load the seniors and the requests at the same time.
  useEffect(() => {
    if (!token) return;
    Promise.all([getManagedSeniors(), getMyRequests()])
      .then(([seniorList, requestList]) => {
        setSeniors(seniorList);
        setRequests(requestList);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  async function handleCancel(request) {
    setBusyId(request._id);
    setError("");
    try {
      await cancelRequest(request._id);
      setRequests(requests.filter((r) => r._id !== request._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fm-page">
      <h1 className="fm-title">Hello, {user.firstName || "there"}</h1>

      {error && <p className="fm-error" role="alert">{error}</p>}
      {loading && <p className="fm-info">Loading…</p>}

      <div className="fm-layout">
        {/* Left: the people this family member helps */}
        <aside className="fm-side" aria-labelledby="people-title">
          <h2 id="people-title" className="fm-section-title">People you help</h2>

          {!loading && seniors.length === 0 && (
            <p className="fm-info">Add a parent or relative to start asking for help for them.</p>
          )}

          {seniors.map((senior) => (
            <div key={senior._id} className="fm-person">
              <div className="fm-person-top">
                <span className="fm-avatar" aria-hidden="true">{initials(senior)}</span>
                <span className="fm-person-text">
                  <b className="fm-person-name">{senior.firstName} {senior.lastName}</b>
                  <span className="fm-info">{senior.city} · {(senior.languages || []).join(", ")}</span>
                  <span className="fm-info">{senior.phone}</span>
                </span>
              </div>
              <Link
                to={`/family/new?senior=${senior._id}&name=${encodeURIComponent(senior.firstName)}`}
                className="fm-primary"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New request for {senior.firstName}
              </Link>
            </div>
          ))}

          <Link to="/family/add" className="fm-text-link">+ Add a person you help</Link>
        </aside>

        {/* Right: all requests for those people */}
        <section className="fm-main" aria-labelledby="req-title">
          <h2 id="req-title" className="fm-section-title">Requests</h2>

          {!loading && requests.length === 0 && (
            <p className="fm-info">No requests yet.</p>
          )}

          {requests.map((request) => {
            const badge = STATUS_BADGES[request.status] || STATUS_BADGES.Pending;
            return (
              <article key={request._id} className="fm-card">
                <div className="fm-card-top">
                  <h3 className="fm-card-title">{CATEGORY_LABELS[request.category] || request.category}</h3>
                  <span className={badge.className}>{badge.text}</span>
                </div>
                <p className="fm-info">
                  For <b>{request.senior?.firstName} {request.senior?.lastName}</b> · {formatDate(request.date)}
                </p>
                {request.description && <p className="fm-card-text">{request.description}</p>}

                {request.status !== "Pending" && request.volunteer && (
                  <p className="fm-helper">
                    {request.volunteer.firstName} {request.volunteer.lastName} ·{" "}
                    <a href={`tel:${request.volunteer.phone}`}>{request.volunteer.phone}</a>
                  </p>
                )}
                {request.status === "Pending" && (
                  <div className="fm-card-bottom">
                    <span className="fm-info">No volunteer yet. We have told people nearby.</span>
                    <button type="button" className="fm-outline" disabled={busyId === request._id}
                      onClick={() => handleCancel(request)}>
                      {busyId === request._id ? "Please wait…" : "Cancel"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
