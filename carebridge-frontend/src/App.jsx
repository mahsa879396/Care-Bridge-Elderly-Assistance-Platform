import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import SeniorHome from './pages/SeniorHome';
import NewRequest from './pages/NewRequest';
import FamilyHome from './pages/FamilyHome';
import VolunteerFeed from './pages/VolunteerFeed';
import MyTasks from './pages/MyTasks';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

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
          <Route path="/senior/new" element={<NewRequest />} />
          <Route path="/family" element={<FamilyHome />} />
          <Route path="/volunteer" element={<VolunteerFeed />} />
          <Route path="/volunteer/tasks" element={<MyTasks />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Catch-all for unknown URLs */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;