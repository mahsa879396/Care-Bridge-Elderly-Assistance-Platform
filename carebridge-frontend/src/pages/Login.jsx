// Login.jsx: the "Log in" page (/login). Only email and password:
// the server already knows the user's role, so we do not ask for it.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveSession, homePathForRole } from "../services/api";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    // Simple checks before we bother the server
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) found.email = "Please enter a valid email address.";
    if (!password) found.password = "Please enter your password.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const result = await login(email, password); // { token, user }
      saveSession(result);
      navigate(homePathForRole(result.user.role));
    } catch (error) {
      setServerError(error.message); // e.g. "Invalid email or password"
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-card auth-card--narrow">
        <h1>Log in</h1>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`auth-input ${errors.email ? "auth-input--error" : ""}`}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && <span id="email-error" className="auth-error-text">{errors.email}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`auth-input ${errors.password ? "auth-input--error" : ""}`}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <span id="password-error" className="auth-error-text">{errors.password}</span>
            )}
            {/* No function yet: password reset is future work */}
            <span className="auth-text-link">Forgot password?</span>
          </div>

          {serverError && <div className="auth-server-error" role="alert">{serverError}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "Please wait…" : "Log in"}
          </button>

          <p className="auth-link-row">
            New to CareBridge? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
