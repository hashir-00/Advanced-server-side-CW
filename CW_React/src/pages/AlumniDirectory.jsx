import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { alumniService } from '../services/api';
import './AlumniDirectory.css';

const AlumniDirectory = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        const res = await alumniService.getDirectory();
        setAlumni(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch alumni directory');
      } finally {
        setLoading(false);
      }
    };
    fetchAlumni();
  }, []);

  const filteredAlumni = alumni.filter(a => {
    const term = searchTerm.toLowerCase();
    const fullName = `${a.first_name} ${a.last_name}`.toLowerCase();
    const company = a.currentExperience?.company?.toLowerCase() || '';
    return fullName.includes(term) || company.includes(term);
  });

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading Alumni Directory...</p>
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
    <div className="directory-container">
      <header className="directory-header">
        <h1>Alumni Directory</h1>
        
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or company..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div className="alumni-grid">
        {filteredAlumni.map(person => (
          <div key={person.user_id} className="alumni-card">
            <div className="alumni-card-header">
              <div className="alumni-avatar">
                {person.profile_image_path ? (
                  <img src={person.profile_image_path} alt={person.first_name} />
                ) : (
                  <span>{person.first_name[0]}{person.last_name[0]}</span>
                )}
              </div>
              <div className="alumni-info">
                <h3>{person.first_name} {person.last_name}</h3>
                {person.currentExperience ? (
                  <p className="job-title"><Briefcase size={14}/> {person.currentExperience.position} at {person.currentExperience.company}</p>
                ) : (
                  <p className="job-title">Available for opportunities</p>
                )}
              </div>
            </div>

            <div className="alumni-bio">
              <p>{person.bio || 'This alumni hasn\'t written a bio yet.'}</p>
            </div>

            {person.skills && person.skills.length > 0 && (
              <div className="alumni-skills">
                {person.skills.slice(0, 4).map((skill, index) => (
                  <span key={index} className="skill-badge">{skill}</span>
                ))}
                {person.skills.length > 4 && <span className="skill-badge more">+{person.skills.length - 4}</span>}
              </div>
            )}
            
            <div className="alumni-card-footer">
              <button className="btn btn-outline" style={{width: '100%', padding: '8px'}}>View Profile</button>
            </div>
          </div>
        ))}
        {filteredAlumni.length === 0 && (
          <div className="no-results">
            <p>No alumni found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlumniDirectory;
