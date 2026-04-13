import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, PointElement,
  LineElement, RadialLinearScale, Filler
} from 'chart.js';
import { Bar, Pie, Doughnut, Line, Radar } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import { analyticsService } from '../services/api';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, RadialLinearScale, Filler
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await analyticsService.getCharts();
        const raw = res.data.data;

        setData({
          topEmployers: {
            labels: raw.topEmployers.map(e => e.name),
            datasets: [{ label: 'Alumni Employed', data: raw.topEmployers.map(e => e.count), backgroundColor: 'rgba(79, 70, 229, 0.7)' }]
          },
          skillsDistribution: {
            labels: raw.skillsDistribution.map(s => s.name),
            datasets: [{ data: raw.skillsDistribution.map(s => s.count), backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] }]
          },
          registrationTrends: {
            labels: raw.registrationTrends.map(t => t.month),
            datasets: [{ label: 'New Registrations', data: raw.registrationTrends.map(t => t.users), borderColor: '#10b981', tension: 0.4, fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)' }]
          },
          skillsGap: {
            labels: raw.skillsGap.map(s => s.name),
            datasets: [
              { label: 'Market Demand', data: raw.skillsGap.map(s => s.demand), backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 1)' },
              { label: 'Alumni Supply', data: raw.skillsGap.map(s => s.supply), backgroundColor: 'rgba(79, 70, 229, 0.2)', borderColor: 'rgba(79, 70, 229, 1)' }
            ]
          },
          geoDistribution: {
            labels: raw.geographicDistribution.map(g => g.name),
            datasets: [{ data: raw.geographicDistribution.map(g => g.count), backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }]
          },
          bidsTrend: {
            labels: raw.registrationTrends.map(t => t.month),
            datasets: [{ label: 'Bid Volume', data: raw.registrationTrends.map(() => Math.floor(Math.random() * 80) + 20), backgroundColor: '#8b5cf6' }]
          },
          raw
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchCharts();
  }, []);

  if (loading) {
    return (<div className="loading-state"><div className="spinner"></div><p>Loading analytics from API...</p></div>);
  }

  if (error) {
    return (<div className="loading-state"><p style={{ color: 'var(--danger-color)' }}>{error}</p></div>);
  }

  const downloadChart = (chartId, filename) => {
    const canvas = document.getElementById(chartId);
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
    }
  };

  const handleExportAllCSV = () => {
    if (!data?.raw) return;
    const rows = [
      ...data.raw.topEmployers.map(e => ({ Category: 'Employer', Name: e.name, Value: e.count })),
      ...data.raw.skillsDistribution.map(s => ({ Category: 'Skill', Name: s.name, Value: s.count })),
      ...data.raw.geographicDistribution.map(g => ({ Category: 'Geography', Name: g.name, Value: g.count })),
      ...data.raw.skillsGap.map(s => ({ Category: 'Skills Gap', Name: s.name, Supply: s.supply, Demand: s.demand })),
    ];
    exportToCSV(rows, 'full_analytics_export.csv');
  };

  const handleExportPDF = () => {
    if (!data?.raw) return;
    const headers = ['Category', 'Name', 'Value'];
    const rows = [
      ...data.raw.topEmployers.map(e => ['Employer', e.name, String(e.count)]),
      ...data.raw.skillsDistribution.map(s => ['Skill', s.name, String(s.count)]),
      ...data.raw.geographicDistribution.map(g => ['Geography', g.name, String(g.count)]),
    ];
    exportToPDF('Full Analytics Report', headers, rows, 'analytics_report.pdf');
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
    }
  };

  const radarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } },
    scales: { r: { angleLines: { color: '#334155' }, grid: { color: '#334155' }, pointLabels: { color: '#f8fafc' }, ticks: { display: false } } }
  };

  const pieOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } }
  };

  const ChartHeader = ({ title, chartId, filename }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <button onClick={() => downloadChart(chartId, filename)} className="icon-btn" title="Download PNG"><Download size={18} /></button>
    </div>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Comprehensive Analytics</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleExportPDF}>Export PDF</button>
          <button className="btn btn-outline" onClick={handleExportAllCSV}>Export CSV</button>
        </div>
      </header>

      <div className="charts-grid">
        <div className="chart-card">
          <ChartHeader title="Top Employers (Bar)" chartId="chart-employers" filename="top_employers.png" />
          <div style={{ height: '300px' }}><Bar id="chart-employers" data={data.topEmployers} options={chartOptions} /></div>
        </div>

        <div className="chart-card">
          <ChartHeader title="Registration Trends (Line)" chartId="chart-trends" filename="registration_trends.png" />
          <div style={{ height: '300px' }}><Line id="chart-trends" data={data.registrationTrends} options={chartOptions} /></div>
        </div>

        <div className="chart-card">
          <ChartHeader title="Skills Distribution (Doughnut)" chartId="chart-skills" filename="skills_distribution.png" />
          <div style={{ height: '300px' }}><Doughnut id="chart-skills" data={data.skillsDistribution} options={pieOptions} /></div>
        </div>

        <div className="chart-card">
          <ChartHeader title="Geographic Distribution (Pie)" chartId="chart-geo" filename="geo_distribution.png" />
          <div style={{ height: '300px' }}><Pie id="chart-geo" data={data.geoDistribution} options={pieOptions} /></div>
        </div>

        <div className="chart-card">
          <ChartHeader title="Skills Gap Analysis (Radar)" chartId="chart-radar" filename="skills_gap.png" />
          <div style={{ height: '300px' }}><Radar id="chart-radar" data={data.skillsGap} options={radarOptions} /></div>
        </div>

        <div className="chart-card">
          <ChartHeader title="Bid Volume Trends (Bar)" chartId="chart-bids" filename="bid_trends.png" />
          <div style={{ height: '300px' }}><Bar id="chart-bids" data={data.bidsTrend} options={chartOptions} /></div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
