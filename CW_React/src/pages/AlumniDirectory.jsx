import React, { useState, useEffect, useCallback } from 'react';
import { alumniService } from '../services/api';
import { Users, Search, Filter, ExternalLink, Briefcase, GraduationCap, Globe } from 'lucide-react';
import './AlumniDirectory.css';

const AlumniDirectory = () => {
  const [alumni, setAlumni] = useState([]);
  const [filters, setFilters] = useState({ programmes: [], graduationYears: [], industries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [programme, setProgramme] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [industry, setIndustry] = useState('');

  useEffect(() => {
    alumniService.getFilters()
      .then(res => setFilters(res.data.data))
      .catch(() => {});
  }, []);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (programme) params.programme = programme;
      if (graduationYear) params.graduation_year = graduationYear;
      if (industry) params.industry = industry;
      const res = await alumniService.getDirectory(params);
      setAlumni(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load alumni directory');
    } finally {
      setLoading(false);
    }
  }, [search, programme, graduationYear, industry]);

  useEffect(() => {
    const debounce = setTimeout(fetchAlumni, 300);
    return () => clearTimeout(debounce);
  }, [fetchAlumni]);

  const handleReset = () => {
    setSearch('');
    setProgramme('');
    setGraduationYear('');
    setIndustry('');
  };

  return (
    <div className="alumni-container">
      <header className="alumni-header">
        <div>
          <h1><Users size={26} /> Alumni Directory</h1>
          <p className="alumni-subtitle">{loading ? 'Loading...' : `${alumni.length} alumni found`}</p>
        </div>
      </header>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search name, company, programme..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <Filter size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />

          <select className="filter-select" value={programme} onChange={e => setProgramme(e.target.value)}>
            <option value="">All Programmes</option>
            {filters.programmes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select className="filter-select" value={graduationYear} onChange={e => setGraduationYear(e.target.value)}>
            <option value="">All Graduation Years</option>
            {filters.graduationYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select className="filter-select" value={industry} onChange={e => setIndustry(e.target.value)}>
            <option value="">All Industries</option>
            {filters.industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>

          {(search || programme || graduationYear || industry) && (
            <button className="btn-reset" onClick={handleReset}>✕ Clear</button>
          )}
        </div>
      </div>

      {error && <div className="alumni-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading alumni...</p>
        </div>
      ) : alumni.length === 0 ? (
        <div className="empty-state">
          <Users size={48} opacity={0.3} />
          <p>No alumni found matching your filters.</p>
          <button className="btn-reset" onClick={handleReset}>Clear Filters</button>
        </div>
      ) : (
        <div className="alumni-grid">
          {alumni.map(alumnus => (
            <div key={alumnus.user_id} className="alumni-card">
              <div className="card-top">
                <div className="alumni-avatar">
                  {alumnus.first_name[0]}{alumnus.last_name[0]}
                </div>
                <div className="alumni-id-info">
                  <h3>{alumnus.first_name} {alumnus.last_name}</h3>
                  {alumnus.currentExperience && (
                    <p className="alumni-role">
                      <Briefcase size={13} /> {alumnus.currentExperience.position} · {alumnus.currentExperience.company}
                    </p>
                  )}
                </div>
                {alumnus.linkedin_url && (
                  <a href={alumnus.linkedin_url} target="_blank" rel="noreferrer" className="linkedin-btn" title="LinkedIn">
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>

              <div className="card-meta">
                {alumnus.programme && (
                  <span className="meta-badge programme">
                    <GraduationCap size={12} /> {alumnus.programme}
                  </span>
                )}
                {alumnus.graduationYear && (
                  <span className="meta-badge year">Class of {alumnus.graduationYear}</span>
                )}
                {alumnus.industry && (
                  <span className="meta-badge industry">
                    <Globe size={12} /> {alumnus.industry}
                  </span>
                )}
              </div>

              {alumnus.bio && <p className="alumni-bio">{alumnus.bio}</p>}

              {alumnus.skills?.length > 0 && (
                <div className="skill-tags">
                  {alumnus.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                  {alumnus.skills.length > 4 && (
                    <span className="skill-tag more">+{alumnus.skills.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlumniDirectory;
