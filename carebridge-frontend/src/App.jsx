import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SeniorHome from './pages/SeniorHome';
import FamilyHome from './pages/FamilyHome';
import VolunteerFeed from './pages/VolunteerFeed';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

/*
  Placeholder for the "New request" page (/senior/new).
  The real page will be built in part 2 of this task series.
*/
function SeniorNewPlaceholder() {
  return (
    <div className="page">
      <h1>New request</h1>
      <p>This page will be built in the next part.</p>
    </div>
  );
}

/*
  App sets up the router. The Layout component wraps every page so the
  header is always visible, and <Outlet /> inside Layout renders the
  matched page.
*/
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout is the parent route; all child routes render inside it */}
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/senior" element={<SeniorHome />} />
          <Route path="/senior/new" element={<SeniorNewPlaceholder />} />
          <Route path="/family" element={<FamilyHome />} />
          <Route path="/volunteer" element={<VolunteerFeed />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Catch-all for unknown URLs */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
