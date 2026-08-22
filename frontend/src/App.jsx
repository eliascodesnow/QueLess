import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import QueueDetail from './pages/QueueDetail.jsx';
import Join from './pages/Join.jsx';
import CustomerStatus from './pages/CustomerStatus.jsx';

function isLoggedIn() {
  return !!localStorage.getItem('foleni_token');
}

function RequireAuth({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/dashboard/queues/:id"
        element={
          <RequireAuth>
            <QueueDetail />
          </RequireAuth>
        }
      />
      <Route path="/join/:joinCode" element={<Join />} />
      <Route path="/status/:joinCode/:sessionToken" element={<CustomerStatus />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
