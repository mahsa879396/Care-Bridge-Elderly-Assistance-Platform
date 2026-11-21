import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

/*
  Layout wraps every page with a shared header and renders the matched route
  inside <Outlet />. This keeps the header consistent across all pages.

  The header changes depending on whether someone is logged in:
    - logged out: "How it works", "Log in", "Create account"
    - logged in:  the user's name and a "Log out" button
*/

// Read the saved user from localStorage (returns null if missing/invalid).
function readStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function Layout() {
  const navigate = useNavigate();
  // useLocation makes Layout re-render on every navigation, so reading
  // localStorage fresh during render picks up a login from another page.
  useLocation();

  // A tiny counter we bump only when localStorage changes in another tab,
  // forcing a re-render so the header reflects the new session.
  const [, setTick] = useState(0);

  useEffect(() => {
    function handleStorage() {
      setTick((t) => t + 1);
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Read the user fresh on every render.
  const user = readStoredUser();

  // Log out: clear the saved session and send the user back to the home page.
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  // A user is "logged in" when both a token and a user object exist.
  const isLoggedIn = !!localStorage.getItem("token") && !!user;
  const fullName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "";

  return (
    <>
      {/* ===== Site header ===== */}
      <header className="site-header">
        <div className="site-header__inner">
          {/* Logo: a green dot + "CareBridge", links back to the home page */}
          <Link to="/" className="logo" aria-label="CareBridge home">
            <span className="logo__dot" aria-hidden="true" />
            CareBridge
          </Link>

          {/* Right side of the header changes based on login state */}
          <nav className="site-header__nav" aria-label="Main">
            {!isLoggedIn && (
              <>
                <a href="/#how-it-works" className="nav-link">
                  How it works
                </a>
                <Link to="/login" className="btn btn--outline">
                  Log in
                </Link>
                <Link to="/register" className="btn btn--primary">
                  Create account
                </Link>
              </>
            )}

            {isLoggedIn && (
              <>
                <span className="nav-link" style={{ color: "var(--color-text)" }}>
                  {fullName}
                </span>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/*
        <Outlet /> is where the matched child route (Landing, Login, etc.)
        gets rendered.
      */}
      <main>
        <Outlet />
      </main>
    </>
  );
}

export default Layout;
