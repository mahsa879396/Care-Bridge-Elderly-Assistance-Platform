// FamilyHome.jsx: the family member's home page (/family).
// Shows the seniors this family member helps, a button to ask for help for each,
// and all requests made for them with status and volunteer contact.
// The family member can cancel a waiting request, mark accepted help as done,
// and rate the volunteer afterwards, the same as a senior can.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  getManagedSeniors,
  getMyRequests,
  cancelRequest,
  completeRequest,
  rateRequest,
} from "../services/api";
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

// The star rating form shown under a finished request that has no rating yet.
function RatingForm({ request, busy, onRate }) {
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const volunteerName = request.volunteer?.firstName || "the volunteer";

  function handleSubmit(event) {
    event.preventDefault();
    if (stars === 0) return;
    onRate(request, stars, review.trim());
  }

  return (
    <form className="fm-rate" onSubmit={handleSubmit}>
      <fieldset className="fm-stars">
        <legend className="fm-rate-title">How was the help from {volunteerName}?</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= stars ? "fm-star fm-star--on" : "fm-star"}>
            <input
              type="radio"
              name={`stars-${request._id}`}
              value={n}
              checked={stars === n}
              onChange={() => setStars(n)}
              className="fm-visually-hidden"
            />
            <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
                fill="currentColor"
              />
            </svg>
            <span className="fm-visually-hidden">{n} {n === 1 ? "star" : "stars"}</span>
          </label>
        ))}
      </fieldset>

      <label htmlFor={`review-${request._id}`} className="fm-info">
        A few words (optional)
      </label>
      <textarea
        id={`review-${request._id}`}
        className="fm-textarea"
        maxLength={300}
        rows={2}
        value={review}
        onChange={(e) => setReview(e.target.value)}
      />

      <button type="submit" className="fm-action" disabled={busy || stars === 0}>
        {busy ? "Please wait…" : "Send rating"}
      </button>
    </form>
  );
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

  // Change one request in the list without reloading the page.
  function updateRequest(id, changes) {
    setRequests((list) => list.map((r) => (r._id === id ? { ...r, ...changes } : r)));
  }

  async function handleCancel(request) {
    if (!window.confirm("Cancel this request?")) return;
    setBusyId(request._id);
    setError("");
    try {
      await cancelRequest(request._id);
      setRequests((list) => list.filter((r) => r._id !== request._id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleComplete(request) {
    if (!window.confirm("Has the help been given?")) return;
    setBusyId(request._id);
    setError("");
    try {
      await completeRequest(request._id);
      updateRequest(request._id, { status: "Completed" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRate(request, rating, review) {
    setBusyId(request._id);
    setError("");
    try {
      await rateRequest(request._id, rating, review);
      updateRequest(request._id, { rating, review });
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
            const busy = busyId === request._id;
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

                {/* Waiting: can still be cancelled */}
                {request.status === "Pending" && (
                  <div className="fm-card-bottom">
                    <span className="fm-info">No volunteer yet. We have told people nearby.</span>
                    <button type="button" className="fm-outline" disabled={busy}
                      onClick={() => handleCancel(request)}>
                      {busy ? "Please wait…" : "Cancel"}
                    </button>
                  </div>
                )}

                {/* Accepted: the family member can say the help is done */}
                {request.status === "Accepted" && (
                  <div className="fm-card-bottom">
                    <span className="fm-info">Call the volunteer to agree on the details.</span>
                    <button type="button" className="fm-action" disabled={busy}
                      onClick={() => handleComplete(request)}>
                      {busy ? "Please wait…" : "The help is done"}
                    </button>
                  </div>
                )}

                {/* Done and not rated yet: show the star form */}
                {request.status === "Completed" && !request.rating && (
                  <RatingForm request={request} busy={busy} onRate={handleRate} />
                )}

                {/* Done and rated: show the rating */}
                {request.status === "Completed" && request.rating && (
                  <p className="fm-info">
                    You rated {request.volunteer?.firstName || "the volunteer"} {request.rating} / 5
                    {request.review ? ` · "${request.review}"` : ""}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
