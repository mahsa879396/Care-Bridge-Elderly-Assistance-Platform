// SeniorHome.jsx: the senior's home page (/senior).
// Shows a big "Ask for help" button and the list of the senior's own requests.
// The senior can cancel a waiting request, mark accepted help as done,
// and rate the volunteer afterwards.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getMyRequests, cancelRequest, completeRequest, rateRequest } from "../services/api";
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

// A small star icon. "filled" decides the look.
function Star({ filled }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"
      fill={filled ? "#B45309" : "none"} stroke="#B45309" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  );
}

export default function SeniorHome() {
  const token = localStorage.getItem("token");
  const user = getSavedUser();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null); // which card is waiting for the server

  // The rating form: only one open at a time.
  const [ratingFor, setRatingFor] = useState(null); // request id, or null when closed
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");

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

  // Replace one request in the list with changed fields.
  function updateRequest(id, changes) {
    setRequests((list) => list.map((r) => (r._id === id ? { ...r, ...changes } : r)));
  }

  // Runs a server action for one card, showing "Please wait…" meanwhile.
  async function runAction(id, action) {
    setBusyId(id);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleCancel(request) {
    // Ask first: cancelling cannot be undone.
    if (!window.confirm("Cancel this request? Volunteers will no longer see it.")) return;
    runAction(request._id, async () => {
      await cancelRequest(request._id);
      setRequests((list) => list.filter((r) => r._id !== request._id));
    });
  }

  function handleDone(request) {
    runAction(request._id, async () => {
      await completeRequest(request._id);
      updateRequest(request._id, { status: "Completed" });
    });
  }

  function openRating(request) {
    setRatingFor(request._id);
    setStars(0);
    setReview("");
  }

  function handleRate(request) {
    if (stars < 1) {
      setError("Please choose 1 to 5 stars.");
      return;
    }
    runAction(request._id, async () => {
      await rateRequest(request._id, stars, review.trim());
      updateRequest(request._id, { rating: stars, review: review.trim() });
      setRatingFor(null);
    });
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
        {!loading && requests.length === 0 && (
          <p className="sh-info">You have no requests yet. Press "Ask for help" to make your first one.</p>
        )}

        {requests.map((request) => {
          const badge = STATUS_BADGES[request.status] || STATUS_BADGES.Pending;
          const volunteerName = request.volunteer?.firstName;
          const busy = busyId === request._id;

          return (
            <article key={request._id} className="sh-card">
              <div className="sh-card-row">
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
                  {request.status === "Completed" && request.rating != null && (
                    <p className="sh-card-meta">
                      You rated {volunteerName || "the volunteer"} {request.rating} / 5
                      {request.review ? ` · "${request.review}"` : ""}
                    </p>
                  )}
                </div>

                <div className="sh-card-actions">
                  <span className={badge.className}>{badge.text}</span>

                  {request.status === "Pending" && (
                    <button type="button" className="sh-btn sh-btn--outline" disabled={busy}
                      onClick={() => handleCancel(request)}>
                      {busy ? "Please wait…" : "Cancel"}
                    </button>
                  )}
                  {request.status === "Accepted" && (
                    <button type="button" className="sh-btn" disabled={busy}
                      onClick={() => handleDone(request)}>
                      {busy ? "Please wait…" : "The help is done"}
                    </button>
                  )}
                  {request.status === "Completed" && request.rating == null && ratingFor !== request._id && (
                    <button type="button" className="sh-btn" onClick={() => openRating(request)}>
                      Rate {volunteerName || "volunteer"}
                    </button>
                  )}
                </div>
              </div>

              {/* Rating form: opens under the card */}
              {ratingFor === request._id && (
                <div className="sh-rate">
                  <fieldset className="sh-rate-stars">
                    <legend className="sh-rate-legend">How was the help from {volunteerName || "the volunteer"}?</legend>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="sh-star"
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        aria-pressed={stars === n}
                        onClick={() => setStars(n)}
                      >
                        <Star filled={n <= stars} />
                      </button>
                    ))}
                  </fieldset>

                  <label htmlFor={`review-${request._id}`} className="sh-rate-label">
                    A few words (optional)
                  </label>
                  <textarea
                    id={`review-${request._id}`}
                    className="sh-rate-text"
                    rows="2"
                    maxLength={300}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />

                  <div className="sh-rate-buttons">
                    <button type="button" className="sh-btn" disabled={busy} onClick={() => handleRate(request)}>
                      {busy ? "Please wait…" : "Send rating"}
                    </button>
                    <button type="button" className="sh-btn sh-btn--outline" onClick={() => setRatingFor(null)}>
                      Not now
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
