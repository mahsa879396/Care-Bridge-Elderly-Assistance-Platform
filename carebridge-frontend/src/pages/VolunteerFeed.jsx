// VolunteerFeed.jsx: the volunteer's main page (/volunteer).
// Shows open (Pending) help requests near the volunteer, with filters,
// and an "Accept" button on each request.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getOpenRequests, acceptRequest } from "../services/api";
import "./VolunteerFeed.css";

const CATEGORY_LABELS = {
  grocery: "Grocery shopping",
  mobility: "Getting around",
  companionship: "Company",
  other: "Other help",
};
const CITIES = ["", "Lahti", "Helsinki", "Espoo", "Tampere"];
const LANGUAGES = ["", "Finnish", "Swedish", "English"];

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

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

export default function VolunteerFeed() {
  const token = localStorage.getItem("token");
  const user = getSavedUser();

  // Start the filters with the volunteer's own city and first language.
  const [filters, setFilters] = useState({
    city: user.city || "",
    language: (user.languages && user.languages[0]) || "",
    category: "",
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null); // which card is being accepted
  const [successMessage, setSuccessMessage] = useState("");

  // Load the list again every time a filter changes.
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    getOpenRequests(filters)
      .then((data) => setRequests(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, filters]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  function handleFilterChange(event) {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  }

  async function handleAccept(request) {
    setAcceptingId(request._id);
    setError("");
    setSuccessMessage("");
    try {
      await acceptRequest(request._id);
      // Remove the accepted request from the list: it is no longer open.
      setRequests(requests.filter((r) => r._id !== request._id));
      setSuccessMessage(
        `Thank you! You accepted "${CATEGORY_LABELS[request.category] || request.category}" for ${request.senior?.firstName || "a senior"}. Their phone number is now in My tasks.`
      );
    } catch (err) {
      setError(err.message); // e.g. "Request already accepted"
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <div className="vf-page">
      <div className="vf-heading">
        <h1 className="vf-title">Requests near you</h1>
        <Link to="/volunteer/tasks" className="vf-tasks-link">My tasks →</Link>
      </div>

      <div className="vf-layout">
        {/* Filters on the left (on top on phones) */}
        <form className="vf-filters" aria-label="Filters" onSubmit={(e) => e.preventDefault()}>
          <h2 className="vf-filters-title">Filter</h2>

          <div className="vf-field">
            <label htmlFor="city">City</label>
            <select id="city" name="city" value={filters.city} onChange={handleFilterChange} className="vf-input">
              {CITIES.map((c) => (
                <option key={c} value={c}>{c || "All cities"}</option>
              ))}
            </select>
          </div>

          <div className="vf-field">
            <label htmlFor="language">Language</label>
            <select id="language" name="language" value={filters.language} onChange={handleFilterChange} className="vf-input">
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l || "All languages"}</option>
              ))}
            </select>
          </div>

          <div className="vf-field">
            <label htmlFor="category">Type of help</label>
            <select id="category" name="category" value={filters.category} onChange={handleFilterChange} className="vf-input">
              <option value="">All types</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </form>

        {/* The list of open requests */}
        <section className="vf-list" aria-label="Open requests" aria-live="polite">
          {successMessage && <p className="vf-success" role="status">{successMessage}</p>}
          {error && <p className="vf-error" role="alert">{error}</p>}
          {loading && <p className="vf-info">Loading…</p>}
          {!loading && !error && requests.length === 0 && (
            <p className="vf-info">No open requests match these filters right now. Try other filters or check again later.</p>
          )}

          <div className="vf-grid">
            {requests.map((request) => (
              <article key={request._id} className="vf-card">
                <h3 className="vf-card-title">{CATEGORY_LABELS[request.category] || request.category}</h3>
                <p className="vf-card-meta">
                  {request.senior?.firstName || "Senior"} · {request.city} · {request.language}
                </p>
                <p className="vf-card-text">
                  <b>{formatDate(request.date)}</b>
                  <br />
                  {request.description}
                </p>
                <button
                  type="button"
                  className="vf-accept"
                  onClick={() => handleAccept(request)}
                  disabled={acceptingId === request._id}
                >
                  {acceptingId === request._id ? "Please wait…" : "Accept"}
                </button>
              </article>
            ))}
          </div>

          <p className="vf-info">Contact details appear after you accept.</p>
        </section>
      </div>
    </div>
  );
}
