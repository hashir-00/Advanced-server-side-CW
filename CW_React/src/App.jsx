import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AlumniDirectory from './pages/AlumniDirectory';
import Profile from './pages/Profile';
import Bidding from './pages/Bidding';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />

          {/* Protected Routes with Layout */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alumni" element={<AlumniDirectory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bidding" element={<Bidding />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
