// Register.jsx: the "Create account" page (/register).
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { register, saveSession, homePathForRole } from "../services/api";
import "./Auth.css";

// The three roles a person can choose. "value" is what we send to the server.
const ROLES = [
  { value: "senior", label: "A senior" },
  { value: "family", label: "Family member" },
  { value: "volunteer", label: "A volunteer" },
];
const CITIES = ["Lahti", "Helsinki", "Espoo", "Tampere"];
const LANGUAGES = ["Finnish", "Swedish", "English"];

// Checks the form and returns an object like { email: "Enter a valid email" }.
// An empty object means everything is fine.
function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Please enter your first name.";
  if (!form.lastName.trim()) errors.lastName = "Please enter your last name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Please enter a valid email address.";
  if (!form.phone.trim()) errors.phone = "Please enter your phone number.";
  if (form.password.length < 8) errors.password = "The password needs at least 8 characters.";
  if (form.languages.length === 0) errors.languages = "Choose at least one language.";
  return errors;
}

export default function Register() {
  const navigate = useNavigate();

  // If the address is /register?role=volunteer, start with that role selected.
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role");
  const startRole = ROLES.some((r) => r.value === roleFromUrl) ? roleFromUrl : "senior";

  // useState = the component's memory. "form" holds everything typed so far.
  const [form, setForm] = useState({
    role: startRole,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    city: "Lahti",
    languages: [],
  });
  const [errors, setErrors] = useState({}); // errors under each field
  const [serverError, setServerError] = useState(""); // error from the backend
  const [loading, setLoading] = useState(false); // true while waiting for the server

  // One function for all text inputs and selects: uses the input's "name".
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  // Add or remove a language when its checkbox is clicked.
  function toggleLanguage(language) {
    const has = form.languages.includes(language);
    const languages = has
      ? form.languages.filter((l) => l !== language)
      : [...form.languages, language];
    setForm({ ...form, languages });
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    setServerError("");

    const foundErrors = validate(form);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length > 0) return; // stop if something is wrong

    setLoading(true);
    try {
      const result = await register(form); // { token, user }
      saveSession(result);
      navigate(homePathForRole(result.user.role));
    } catch (error) {
      setServerError(error.message); // e.g. "Email already registered"
    } finally {
      setLoading(false);
    }
  }

  // Small helper so every text field looks and behaves the same.
  // aria-describedby connects the error text to the input for screen readers.
  function textField(name, label, type = "text", hint = "") {
    const errorId = `${name}-error`;
    return (
      <div className="auth-field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          className={`auth-input ${errors[name] ? "auth-input--error" : ""}`}
          aria-invalid={errors[name] ? "true" : "false"}
          aria-describedby={errors[name] ? errorId : undefined}
        />
        {hint && <span className="auth-hint">{hint}</span>}
        {errors[name] && <span id={errorId} className="auth-error-text">{errors[name]}</span>}
      </div>
    );
  }

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <h2>Who can join?</h2>
        <p><b>Seniors</b> post requests for themselves.</p>
        <p><b>Family members</b> post requests for a parent or relative, and see who accepted.</p>
        <p><b>Volunteers</b> help nearby. An admin checks your identity once, then you can accept requests.</p>
        <p>Your phone number is shown only to the person you work with.</p>
      </aside>

      <section className="auth-card">
        <h1>Create your account</h1>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Role choice: real radio buttons inside big cards */}
          <fieldset className="auth-fieldset">
            <legend className="auth-legend">I am…</legend>
            <div className="auth-roles">
              {ROLES.map((role) => (
                <label
                  key={role.value}
                  className={`auth-role ${form.role === role.value ? "auth-role--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={form.role === role.value}
                    onChange={handleChange}
                  />
                  {role.label}
                </label>
              ))}
            </div>
            <p className="auth-note">
              Volunteers: an admin checks your identity once. After that you can accept requests.
            </p>
          </fieldset>

          <div className="auth-grid">
            {textField("firstName", "First name")}
            {textField("lastName", "Last name")}
            {textField("email", "Email", "email")}
            {textField("phone", "Phone", "tel")}
            {textField("password", "Password", "password", "At least 8 characters")}

            <div className="auth-field">
              <label htmlFor="city">City</label>
              <select id="city" name="city" value={form.city} onChange={handleChange} className="auth-input">
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Languages: at least one must be checked */}
          <fieldset
            className="auth-fieldset"
            aria-describedby={errors.languages ? "languages-error" : undefined}
          >
            <legend className="auth-legend">Languages I speak</legend>
            <div className="auth-checks">
              {LANGUAGES.map((language) => (
                <label
                  key={language}
                  className={`auth-check ${form.languages.includes(language) ? "auth-check--selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.languages.includes(language)}
                    onChange={() => toggleLanguage(language)}
                  />
                  {language}
                </label>
              ))}
            </div>
            {errors.languages && (
              <span id="languages-error" className="auth-error-text">{errors.languages}</span>
            )}
          </fieldset>

          {/* Error from the server, e.g. "Email already registered" */}
          {serverError && <div className="auth-server-error" role="alert">{serverError}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait…" : "Create account"}
          </button>

          <p className="auth-link-row">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
