// MyTasks.jsx: the volunteer's accepted and finished tasks (/volunteer/tasks).
// After accepting a request, the senior's phone number appears here,
// so the volunteer can call and agree on the details.
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getMyRequests, completeRequest } from "../services/api";
import "./MyTasks.css";

const CATEGORY_LABELS = {
  grocery: "Grocery shopping",
  mobility: "Getting around",
  companionship: "Company",
  other: "Other help",
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

export default function MyTasks() {
  const token = localStorage.getItem("token");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false); // which tab is open
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!token) return;
    getMyRequests()
      .then((data) => setTasks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Split the list into the two tabs.
  const upcoming = tasks.filter((t) => t.status === "Accepted");
  const done = tasks.filter((t) => t.status === "Completed");
  const visible = showDone ? done : upcoming;

  async function handleComplete(task) {
    setBusyId(task._id);
    setError("");
    try {
      await completeRequest(task._id);
      // Update this one task in the list without loading everything again.
      setTasks(tasks.map((t) => (t._id === task._id ? { ...t, status: "Completed" } : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-page">
      <Link to="/volunteer" className="mt-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to requests
      </Link>

      <h1 className="mt-title">My tasks</h1>

      {/* Two tabs: real buttons, aria-pressed tells screen readers which is active */}
      <div className="mt-tabs" role="group" aria-label="Task status">
        <button type="button" className={`mt-tab ${!showDone ? "mt-tab--active" : ""}`}
          aria-pressed={!showDone} onClick={() => setShowDone(false)}>
          Upcoming ({upcoming.length})
        </button>
        <button type="button" className={`mt-tab ${showDone ? "mt-tab--active" : ""}`}
          aria-pressed={showDone} onClick={() => setShowDone(true)}>
          Done ({done.length})
        </button>
      </div>

      {error && <p className="mt-error" role="alert">{error}</p>}
      {loading && <p className="mt-info">Loading…</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="mt-info">
          {showDone ? "No finished tasks yet." : "No upcoming tasks. Accept a request to see it here."}
        </p>
      )}

      <div className="mt-list">
        {visible.map((task) => (
          <article key={task._id} className="mt-card">
            <div className="mt-card-top">
              <h2 className="mt-card-title">{CATEGORY_LABELS[task.category] || task.category}</h2>
              <span className={`mt-badge ${task.status === "Completed" ? "mt-badge--done" : "mt-badge--accepted"}`}>
                {task.status === "Completed" ? "Done" : "Accepted"}
              </span>
            </div>

            <p className="mt-card-text">
              <b>{formatDate(task.date)}</b> · {task.city}
              <br />
              {task.description}
            </p>

            {/* Contact box: only for upcoming tasks */}
            {task.status === "Accepted" && task.senior && (
              <div className="mt-contact">
                <span className="mt-contact-label">Contact</span>
                <div className="mt-contact-row">
                  <span>
                    <b>{task.senior.firstName} {task.senior.lastName}</b>
                    <br />
                    {task.senior.phone}
                  </span>
                  <a href={`tel:${task.senior.phone}`} className="mt-call"
                    aria-label={`Call ${task.senior.firstName}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                    </svg>
                  </a>
                </div>
                <span className="mt-info">Agree on the address and details when you call.</span>
              </div>
            )}

            {task.status === "Accepted" && (
              <button type="button" className="mt-done-btn" onClick={() => handleComplete(task)}
                disabled={busyId === task._id}>
                {busyId === task._id ? "Please wait…" : "Mark as done"}
              </button>
            )}

            {task.status === "Completed" && task.rating != null && (
              <p className="mt-card-text">
                Rated {task.rating} / 5{task.review ? ` · "${task.review}"` : ""}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
