// SeniorHome.jsx: the senior's home page (/senior).
// Shows a big "Ask for help" button and the list of the senior's own requests.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getMyRequests } from "../services/api";
import "./SeniorHome.css";

// Turn the category value from the server into friendly text.
const CATEGORY_LABELS = {
  grocery: "Grocery shopping",
  mobility: "Getting around",
  companionship: "Company",
  other: "Other help",
};

// Text and color for each status badge.
const STATUS_BADGES = {
  Pending: { text: "Waiting", className: "sh-badge sh-badge--waiting" },
  Accepted: { text: "Accepted", className: "sh-badge sh-badge--accepted" },
  Completed: { text: "Done", className: "sh-badge sh-badge--done" },
};

// "2026-11-20T10:00:00Z" -> "Thu 20 Nov, 10:00"
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Read the logged-in user that Login/Register saved in the browser.
function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    return null;
  }
}

export default function SeniorHome() {
  const token = localStorage.getItem("token");
  const user = getSavedUser();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // useEffect runs once when the page opens: load the requests.
  useEffect(() => {
    if (!token) return;
    getMyRequests()
      .then((data) => setRequests(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Nobody logged in? Send them to the login page.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="sh-page">
      {/* Left column: greeting and the big button */}
      <div className="sh-side">
        <h1 className="sh-hello">Hello, {user?.firstName || "there"}</h1>

        <Link to="/senior/new" className="sh-ask">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="sh-ask-title">Ask for help</span>
          <span className="sh-ask-text">Shopping, getting around, company or something else.</span>
        </Link>
      </div>

      {/* Right column: the list of requests */}
      <section className="sh-list" aria-labelledby="my-requests-title">
        <h2 id="my-requests-title" className="sh-list-title">My requests</h2>

        {loading && <p className="sh-info">Loading…</p>}
        {error && <p className="sh-error" role="alert">{error}</p>}
        {!loading && !error && requests.length === 0 && (
          <p className="sh-info">You have no requests yet. Press "Ask for help" to make your first one.</p>
        )}

        {requests.map((request) => {
          const badge = STATUS_BADGES[request.status] || STATUS_BADGES.Pending;
          const volunteerName = request.volunteer?.firstName;

          return (
            <article key={request._id} className="sh-card">
              <div className="sh-card-text">
                <h3 className="sh-card-title">
                  {CATEGORY_LABELS[request.category] || request.category}
                </h3>
                <p className="sh-card-meta">
                  {formatDate(request.date)} · {request.description}
                </p>

                {request.status === "Accepted" && request.volunteer && (
                  <p className="sh-card-helper">
                    {request.volunteer.firstName} {request.volunteer.lastName} will help you ·{" "}
                    <a href={`tel:${request.volunteer.phone}`}>{request.volunteer.phone}</a>
                  </p>
                )}
                {request.status === "Pending" && (
                  <p className="sh-card-meta">No volunteer yet. We have told people nearby.</p>
                )}
              </div>

              <div className="sh-card-actions">
                <span className={badge.className}>{badge.text}</span>

                {/* Buttons get their real function in a later step */}
                {request.status === "Pending" && (
                  <button type="button" className="sh-btn sh-btn--outline">Cancel</button>
                )}
                {request.status === "Completed" && request.rating == null && volunteerName && (
                  <button type="button" className="sh-btn">Rate {volunteerName}</button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
