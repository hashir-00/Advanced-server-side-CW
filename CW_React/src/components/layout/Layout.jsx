import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BarChart3, Settings, Menu, LogOut, Bell } from 'lucide-react';
import { authService } from '../../services/api';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = `${(user.firstName || 'A')[0]}${(user.lastName || 'U')[0]}`.toUpperCase();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BarChart3 color="var(--primary-color)" size={28} />
            <h2>Alumni Intel</h2>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/analytics" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setSidebarOpen(false)}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/alumni" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setSidebarOpen(false)}>
            <Users size={20} />
            <span>Alumni Directory</span>
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'} onClick={() => setSidebarOpen(false)}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu size={24} color="var(--text-primary)" />
            </button>
          </div>
          <div className="topbar-right">
            <button className="icon-btn">
              <Bell size={20} />
            </button>
            <div className="user-profile">
              <div className="avatar">{initials}</div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.firstName || 'User'}</span>
            </div>
            <button className="icon-btn" onClick={handleLogout} title="Logout" style={{ marginLeft: '10px' }}>
              <LogOut size={20} color="var(--danger-color)" />
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
