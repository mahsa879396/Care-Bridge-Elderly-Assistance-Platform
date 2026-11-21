// AddSenior.jsx: a family member adds a parent or relative (/family/add).
// The senior does not need their own account: the family member manages it.
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { addManagedSenior } from "../services/api";
import "./Family.css";

const CITIES = ["Lahti", "Helsinki", "Espoo", "Tampere"];
const LANGUAGES = ["Finnish", "Swedish", "English"];

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Please enter their first name.";
  if (!form.lastName.trim()) errors.lastName = "Please enter their last name.";
  if (!form.phone.trim()) errors.phone = "Please enter a phone number volunteers can call.";
  if (form.languages.length === 0) errors.languages = "Choose at least one language.";
  if (!form.consent) errors.consent = "Please confirm you have their permission.";
  return errors;
}

export default function AddSenior() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    city: "Lahti",
    languages: ["Finnish"],
    consent: false,
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) return <Navigate to="/login" replace />;

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function toggleLanguage(language) {
    const languages = form.languages.includes(language)
      ? form.languages.filter((l) => l !== language)
      : [...form.languages, language];
    setForm({ ...form, languages });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await addManagedSenior({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        city: form.city,
        languages: form.languages,
        consent: form.consent,
      });
      navigate("/family");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Connects an input to its error text (also for screen readers).
  function field(name, label, type = "text", hint = "") {
    return (
      <div className="fm-field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          className={`fm-input ${errors[name] ? "fm-input--error" : ""}`}
          aria-invalid={errors[name] ? "true" : "false"}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        {hint && <span className="fm-info">{hint}</span>}
        {errors[name] && <span id={`${name}-error`} className="fm-error-text">{errors[name]}</span>}
      </div>
    );
  }

  return (
    <div className="fm-page fm-page--narrow">
      <Link to="/family" className="fm-back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back
      </Link>

      <form className="fm-form" onSubmit={handleSubmit} noValidate>
        <h1 className="fm-title">Add a person you help</h1>
        <p className="fm-info">They do not need their own account. You post requests for them and volunteers call them directly.</p>

        <div className="fm-grid">
          {field("firstName", "First name")}
          {field("lastName", "Last name")}
        </div>
        {field("phone", "Their phone", "tel", "A landline is fine. Volunteers call this number.")}

        <div className="fm-field">
          <label htmlFor="city">City</label>
          <select id="city" name="city" value={form.city} onChange={handleChange} className="fm-input">
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <fieldset className="fm-fieldset" aria-describedby={errors.languages ? "languages-error" : undefined}>
          <legend className="fm-legend">Languages they speak</legend>
          <div className="fm-checks">
            {LANGUAGES.map((language) => (
              <label key={language}
                className={`fm-check ${form.languages.includes(language) ? "fm-check--selected" : ""}`}>
                <input type="checkbox" checked={form.languages.includes(language)}
                  onChange={() => toggleLanguage(language)} />
                {language}
              </label>
            ))}
          </div>
          {errors.languages && <span id="languages-error" className="fm-error-text">{errors.languages}</span>}
        </fieldset>

        {/* GDPR: consent from the senior before saving their details */}
        <div className="fm-field">
          <label className="fm-consent">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              aria-describedby={errors.consent ? "consent-error" : undefined}
            />
            I have their permission to save these details and ask for help on their behalf.
          </label>
          {errors.consent && <span id="consent-error" className="fm-error-text">{errors.consent}</span>}
        </div>

        {serverError && <div className="fm-error" role="alert">{serverError}</div>}

        <button type="submit" className="fm-submit" disabled={loading}>
          {loading ? "Please wait…" : "Save"}
        </button>
      </form>
    </div>
  );
}
