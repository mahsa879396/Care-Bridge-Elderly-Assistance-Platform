// NewRequest.jsx: the "Ask for help" form (/senior/new).
// A senior (or family member) chooses what kind of help, when, and where.
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createRequest } from "../services/api";
import "./NewRequest.css";

// The four kinds of help. "value" is what we send to the server (API contract).
// Each has a small inline SVG icon (no emoji: they look different on every device).
const CATEGORIES = [
  {
    value: "grocery",
    label: "Groceries",
    icon: (
      <>
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
      </>
    ),
  },
  {
    value: "mobility",
    label: "Getting around",
    icon: (
      <>
        <path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
  },
  {
    value: "companionship",
    label: "Company",
    icon: <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" />,
  },
  {
    value: "other",
    label: "Something else",
    icon: (
      <>
        <circle cx="5" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
      </>
    ),
  },
];
const LANGUAGES = ["Finnish", "Swedish", "English"];
const MAX_DESCRIPTION = 500;

// Read the logged-in user that Login/Register saved in the browser.
function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
}

// Checks the form. Returns an object of error texts; empty object = all good.
function validate(form) {
  const errors = {};
  if (!form.description.trim()) errors.description = "Please tell us what you need.";
  if (form.description.length > MAX_DESCRIPTION)
    errors.description = `Please use at most ${MAX_DESCRIPTION} characters.`;
  if (!form.day) errors.day = "Please choose a day.";
  if (!form.time) errors.time = "Please choose a time.";
  if (form.day && form.time && new Date(`${form.day}T${form.time}`) <= new Date())
    errors.day = "Please choose a day and time in the future.";
  if (!form.city.trim()) errors.city = "Please enter the city.";
  return errors;
}

export default function NewRequest() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = getSavedUser();

  // Start with the user's own language and city, so there is less to type.
  const [form, setForm] = useState({
    category: "grocery",
    description: "",
    day: "",
    time: "",
    language: (user.languages && user.languages[0]) || "Finnish",
    city: user.city || "Lahti",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Nobody logged in? Send them to the login page.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // One function for all inputs: uses each input's "name".
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      // Day + time -> one date the server understands (ISO format).
      const date = new Date(`${form.day}T${form.time}`).toISOString();
      await createRequest({
        category: form.category,
        description: form.description.trim(),
        language: form.language,
        city: form.city.trim(),
        date,
      });
      navigate("/senior"); // back to "My requests"
    } catch (error) {
      setServerError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Props that connect an input to its error text (for screen readers too).
  function errorProps(name) {
    return {
      "aria-invalid": errors[name] ? "true" : "false",
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      className: `nr-input ${errors[name] ? "nr-input--error" : ""}`,
    };
  }
  function errorText(name) {
    return errors[name] ? (
      <span id={`${name}-error`} className="nr-error-text">{errors[name]}</span>
    ) : null;
  }

  return (
    <div className="nr-page">
      <Link to="/senior" className="nr-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to my requests
      </Link>

      <form className="nr-card" onSubmit={handleSubmit} noValidate>
        <h1 className="nr-title">What do you need help with?</h1>

        {/* Category: real radio buttons shown as big tiles */}
        <fieldset className="nr-fieldset">
          <legend className="nr-visually-hidden">Type of help</legend>
          <div className="nr-categories">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`nr-category ${form.category === cat.value ? "nr-category--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={form.category === cat.value}
                  onChange={handleChange}
                  className="nr-visually-hidden"
                />
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {cat.icon}
                </svg>
                {cat.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="nr-field">
          <label htmlFor="description">Tell us more</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={form.description}
            onChange={handleChange}
            placeholder="For example: bread, milk and coffee from the shop nearby."
            {...errorProps("description")}
          />
          <span className="nr-hint">{form.description.length} / {MAX_DESCRIPTION}</span>
          {errorText("description")}
        </div>

        <div className="nr-grid">
          <div className="nr-field">
            <label htmlFor="day">Day</label>
            <input id="day" name="day" type="date" value={form.day} onChange={handleChange} {...errorProps("day")} />
            {errorText("day")}
          </div>
          <div className="nr-field">
            <label htmlFor="time">Time</label>
            <input id="time" name="time" type="time" value={form.time} onChange={handleChange} {...errorProps("time")} />
            {errorText("time")}
          </div>
          <div className="nr-field">
            <label htmlFor="language">Language</label>
            <select id="language" name="language" value={form.language} onChange={handleChange} className="nr-input">
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="nr-field">
            <label htmlFor="city">City</label>
            <input id="city" name="city" value={form.city} onChange={handleChange} {...errorProps("city")} />
            {errorText("city")}
          </div>
        </div>

        {serverError && <div className="nr-server-error" role="alert">{serverError}</div>}

        <div className="nr-submit-row">
          <button type="submit" className="nr-submit" disabled={loading}>
            {loading ? "Please wait…" : "Send request"}
          </button>
          <span className="nr-hint">Volunteers nearby who speak your language get a notification.</span>
        </div>
      </form>
    </div>
  );
}
