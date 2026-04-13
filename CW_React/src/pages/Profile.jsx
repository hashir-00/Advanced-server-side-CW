import React, { useState, useEffect } from 'react';
import { profileService, authService } from '../services/api';
import { User, Briefcase, GraduationCap, Pencil, Trash2, Plus, Save, X } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ linkedinUrl: '', bio: '' });
  const [showEduForm, setShowEduForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [eduForm, setEduForm] = useState({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' });
  const [expForm, setExpForm] = useState({ company: '', position: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
  const [saving, setSaving] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileService.getProfile();
      setProfile(res.data.data);
      setEditData({ linkedinUrl: res.data.data.linkedin_url || '', bio: res.data.data.bio || '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await profileService.updateProfile(editData);
      setEditing(false);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEducation = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.addEducation(eduForm);
      setShowEduForm(false);
      setEduForm({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' });
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add education');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    try {
      await profileService.deleteEducation(id);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete education');
    }
  };

  const handleAddExperience = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileService.addExperience(expForm);
      setShowExpForm(false);
      setExpForm({ company: '', position: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add experience');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExperience = async (id) => {
    try {
      await profileService.deleteExperience(id);
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete experience');
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await authService.resendVerification(profile.email);
      setResendMsg(res.data.message || 'Verification email sent!');
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Failed to resend');
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !profile) {
    return <div className="loading-state"><p style={{ color: 'var(--danger-color)' }}>{error}</p></div>;
  }

  return (
    <div className="profile-container">
      <header className="profile-header-bar">
        <h1><User size={28} /> My Profile</h1>
      </header>

      {error && <div className="profile-toast error">{error}</div>}
      {resendMsg && <div className="profile-toast success">{resendMsg}</div>}

      <div className="profile-grid">
        <div className="profile-card profile-main">
          <div className="profile-avatar">
            {(profile.first_name?.[0] || 'A')}{(profile.last_name?.[0] || 'U')}
          </div>
          <h2>{profile.first_name} {profile.last_name}</h2>
          <span className="profile-role">{profile.role}</span>
          <p className="profile-email">{profile.email}</p>
          {!profile.is_verified && (
            <button className="btn btn-sm btn-warning" onClick={handleResendVerification}>
              Resend Verification Email
            </button>
          )}

          {editing ? (
            <div className="profile-edit-section">
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input className="form-control" value={editData.linkedinUrl} onChange={e => setEditData({ ...editData, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea className="form-control" rows="4" value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} placeholder="Tell us about yourself..." />
              </div>
              <div className="profile-edit-actions">
                <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-outline" onClick={() => setEditing(false)}><X size={16} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div className="profile-bio-section">
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="profile-link">LinkedIn Profile ↗</a>}
              <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><Pencil size={14} /> Edit Profile</button>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="section-header">
            <h3><GraduationCap size={20} /> Education</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowEduForm(!showEduForm)}><Plus size={14} /> Add</button>
          </div>

          {showEduForm && (
            <form className="inline-form" onSubmit={handleAddEducation}>
              <input className="form-control" placeholder="Institution" required value={eduForm.institution} onChange={e => setEduForm({ ...eduForm, institution: e.target.value })} />
              <input className="form-control" placeholder="Degree" required value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} />
              <input className="form-control" placeholder="Field of Study" value={eduForm.fieldOfStudy} onChange={e => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} />
              <div className="form-row">
                <input className="form-control" type="date" required value={eduForm.startDate} onChange={e => setEduForm({ ...eduForm, startDate: e.target.value })} />
                <input className="form-control" type="date" value={eduForm.endDate} onChange={e => setEduForm({ ...eduForm, endDate: e.target.value })} />
              </div>
              <textarea className="form-control" placeholder="Description" rows="2" value={eduForm.description} onChange={e => setEduForm({ ...eduForm, description: e.target.value })} />
              <div className="form-row">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Adding...' : 'Add Education'}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowEduForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {profile.education?.length > 0 ? profile.education.map(edu => (
            <div key={edu.education_id} className="timeline-item">
              <div className="timeline-content">
                <h4>{edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}</h4>
                <p className="timeline-sub">{edu.institution}</p>
                <p className="timeline-date">{new Date(edu.start_date).getFullYear()} — {edu.end_date ? new Date(edu.end_date).getFullYear() : 'Present'}</p>
                {edu.description && <p className="timeline-desc">{edu.description}</p>}
              </div>
              <button className="btn-icon danger" onClick={() => handleDeleteEducation(edu.education_id)}><Trash2 size={16} /></button>
            </div>
          )) : <p className="empty-text">No education records yet.</p>}
        </div>

        <div className="profile-card">
          <div className="section-header">
            <h3><Briefcase size={20} /> Experience</h3>
            <button className="btn btn-sm btn-primary" onClick={() => setShowExpForm(!showExpForm)}><Plus size={14} /> Add</button>
          </div>

          {showExpForm && (
            <form className="inline-form" onSubmit={handleAddExperience}>
              <input className="form-control" placeholder="Company" required value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} />
              <input className="form-control" placeholder="Position" required value={expForm.position} onChange={e => setExpForm({ ...expForm, position: e.target.value })} />
              <input className="form-control" placeholder="Location" value={expForm.location} onChange={e => setExpForm({ ...expForm, location: e.target.value })} />
              <div className="form-row">
                <input className="form-control" type="date" required value={expForm.startDate} onChange={e => setExpForm({ ...expForm, startDate: e.target.value })} />
                <input className="form-control" type="date" value={expForm.endDate} onChange={e => setExpForm({ ...expForm, endDate: e.target.value })} disabled={expForm.isCurrent} />
              </div>
              <label className="checkbox-label">
                <input type="checkbox" checked={expForm.isCurrent} onChange={e => setExpForm({ ...expForm, isCurrent: e.target.checked, endDate: '' })} /> Currently working here
              </label>
              <textarea className="form-control" placeholder="Description" rows="2" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
              <div className="form-row">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Adding...' : 'Add Experience'}</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowExpForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {profile.experience?.length > 0 ? profile.experience.map(exp => (
            <div key={exp.experience_id} className="timeline-item">
              <div className="timeline-content">
                <h4>{exp.position}</h4>
                <p className="timeline-sub">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                <p className="timeline-date">
                  {new Date(exp.start_date).getFullYear()} — {exp.is_current ? <span className="badge-current">Present</span> : (exp.end_date ? new Date(exp.end_date).getFullYear() : 'N/A')}
                </p>
                {exp.description && <p className="timeline-desc">{exp.description}</p>}
              </div>
              <button className="btn-icon danger" onClick={() => handleDeleteExperience(exp.experience_id)}><Trash2 size={16} /></button>
            </div>
          )) : <p className="empty-text">No experience records yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
