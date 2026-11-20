import { Link, Outlet } from 'react-router-dom';

/*
  Layout wraps every page with a shared header and renders the matched route
  inside <Outlet />. This keeps the header consistent across all pages.
*/
function Layout() {
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

          {/* Right side: "How it works" link, Log in button, Create account button */}
          <nav className="site-header__nav" aria-label="Main">
            <a href="/#how-it-works" className="nav-link">
              How it works
            </a>
            <Link to="/login" className="btn btn--outline">
              Log in
            </Link>
            <Link to="/register" className="btn btn--primary">
              Create account
            </Link>
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
