import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { analyticsService } from '../services/api';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import './Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartsRes] = await Promise.all([
          analyticsService.getStats(),
          analyticsService.getCharts()
        ]);
        setStats(statsRes.data.data);

        const raw = chartsRes.data.data;
        setCharts({
          topEmployers: {
            labels: raw.topEmployers.map(e => e.name),
            datasets: [{
              label: 'Alumni Employed',
              data: raw.topEmployers.map(e => e.count),
              backgroundColor: 'rgba(79, 70, 229, 0.7)',
            }]
          },
          skillsDistribution: {
            labels: raw.skillsDistribution.map(s => s.name),
            datasets: [{
              data: raw.skillsDistribution.map(s => s.count),
              backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
            }]
          }
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = () => {
    if (!stats) return;
    exportToCSV([
      { Metric: 'Total Alumni', Value: stats.alumni },
      { Metric: 'Active Bids', Value: stats.activeBids },
      { Metric: 'Total Donations ($)', Value: stats.totalDonations },
      { Metric: 'Events Hosted', Value: stats.eventsHosted }
    ], 'dashboard_metrics.csv');
  };

  const handleExportPDF = () => {
    if (!stats) return;
    exportToPDF(
      'Alumni Platform - Executive Summary',
      ['Metric', 'Value'],
      [
        ['Total Alumni', String(stats.alumni)],
        ['Active Bids', String(stats.activeBids)],
        ['Total Donations', `$${stats.totalDonations}`],
        ['Events Hosted', String(stats.eventsHosted)]
      ],
      'executive_summary.pdf'
    );
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading dashboard from API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-state">
        <p style={{ color: 'var(--danger-color)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>University Intelligence Dashboard</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleExportPDF}>Export Report (PDF)</button>
          <button className="btn btn-outline" onClick={handleExportCSV}>Export Data (CSV)</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Alumni</h3>
          <div className="stat-value">{stats.alumni.toLocaleString()}</div>
          <div className="stat-trend positive">Registered users</div>
        </div>
        <div className="stat-card">
          <h3>Active Bids</h3>
          <div className="stat-value">{stats.activeBids.toLocaleString()}</div>
          <div className="stat-trend positive">Current bids</div>
        </div>
        <div className="stat-card">
          <h3>Total Donations</h3>
          <div className="stat-value">${Number(stats.totalDonations).toLocaleString()}</div>
          <div className="stat-trend positive">All time</div>
        </div>
        <div className="stat-card">
          <h3>Events Hosted</h3>
          <div className="stat-value">{stats.eventsHosted.toLocaleString()}</div>
          <div className="stat-trend neutral">Total events</div>
        </div>
      </div>

      {charts && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Top Employers</h3>
            <div style={{ height: '300px' }}>
              <Bar data={charts.topEmployers} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>
          <div className="chart-card">
            <h3>Skills Distribution</h3>
            <div style={{ height: '300px' }}>
              <Doughnut data={charts.skillsDistribution} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
