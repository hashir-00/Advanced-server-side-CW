import React, { useState, useEffect } from 'react';
import { securityService } from '../services/api';
import { Key, Shield, Activity, Trash2, Plus, Copy, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import './Security.css';

const AVAILABLE_SCOPES = [
  { id: 'read:alumni',       label: 'Read Alumni',       desc: 'Access alumni directory data' },
  { id: 'read:analytics',    label: 'Read Analytics',    desc: 'Access dashboard analytics' },
  { id: 'read:alumni_of_day',label: 'Read Alumni of Day', desc: 'Access daily featured alumni (AR app)' }
];

const Security = () => {
  const [keys, setKeys] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [usageStats, setUsageStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('keys');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keysRes, usageRes] = await Promise.all([
        securityService.getMyKeys(),
        securityService.getUsageLogs()
      ]);
      setKeys(keysRes.data.data);
      setUsageLogs(usageRes.data.data.logs);
      setUsageStats(usageRes.data.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName || selectedScopes.length === 0) {
      setError('Key name and at least one scope are required');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await securityService.createKey(newKeyName, selectedScopes);
      setNewKeyValue(res.data.data.rawKey);
      setSuccess(res.data.message);
      setNewKeyName('');
      setSelectedScopes([]);
      setShowCreateForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId, name) => {
    if (!window.confirm(`Revoke key "${name}"? This cannot be undone.`)) return;
    try {
      await securityService.revokeKey(keyId);
      setSuccess('Key revoked successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke key');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newKeyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope) => {
    setSelectedScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  if (loading) {
    return <div className="loading-state"><div className="spinner"></div><p>Loading security data...</p></div>;
  }

  return (
    <div className="security-container">
      <header className="security-header">
        <div>
          <h1><Shield size={26} /> API Security & Access Control</h1>
          <p className="security-subtitle">Manage API keys, scopes, and monitor usage</p>
        </div>
      </header>

      {error && <div className="sec-toast error"><AlertCircle size={15} /> {error}</div>}
      {success && <div className="sec-toast success"><CheckCircle size={15} /> {success}</div>}

      {newKeyValue && (
        <div className="new-key-banner">
          <div className="new-key-header">
            <Key size={18} /> <strong>Your new API key — save it now, it won't be shown again</strong>
          </div>
          <div className="new-key-value">
            <code>{newKeyValue}</code>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button className="dismiss-btn" onClick={() => setNewKeyValue(null)}>Dismiss</button>
        </div>
      )}

      <div className="sec-tabs">
        <button className={`sec-tab ${activeTab === 'keys' ? 'active' : ''}`} onClick={() => setActiveTab('keys')}>
          <Key size={16} /> API Keys
        </button>
        <button className={`sec-tab ${activeTab === 'usage' ? 'active' : ''}`} onClick={() => setActiveTab('usage')}>
          <Activity size={16} /> Usage Logs
        </button>
      </div>

      {activeTab === 'keys' && (
        <div className="keys-section">
          <div className="keys-header">
            <h3>API Keys ({keys.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus size={15} /> {showCreateForm ? 'Cancel' : 'Create Key'}
            </button>
          </div>

          {showCreateForm && (
            <form className="create-key-form" onSubmit={handleCreateKey}>
              <h4>New API Key</h4>
              <div className="form-group">
                <label>Key Name</label>
                <input className="form-control" placeholder='e.g. "Mobile AR App"' value={newKeyName} onChange={e => setNewKeyName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Scopes (permissions)</label>
                <div className="scope-list">
                  {AVAILABLE_SCOPES.map(scope => (
                    <label key={scope.id} className={`scope-item ${selectedScopes.includes(scope.id) ? 'selected' : ''}`}>
                      <input type="checkbox" checked={selectedScopes.includes(scope.id)} onChange={() => toggleScope(scope.id)} />
                      <div>
                        <strong>{scope.label}</strong>
                        <span>{scope.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-row-btns">
                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Key'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
              </div>
            </form>
          )}

          {keys.length === 0 ? (
            <p className="empty-text">No API keys yet. Create one to get started.</p>
          ) : (
            <div className="keys-list">
              {keys.map(key => (
                <div key={key.key_id} className={`key-card ${!key.is_active ? 'revoked' : ''}`}>
                  <div className="key-info">
                    <div className="key-name-row">
                      <Key size={16} />
                      <strong>{key.name}</strong>
                      <span className={`status-badge ${key.is_active ? 'active' : 'revoked'}`}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </span>
                    </div>
                    <div className="key-scopes">
                      {(Array.isArray(key.scopes) ? key.scopes : JSON.parse(key.scopes || '[]')).map(scope => (
                        <span key={scope} className="scope-badge">{scope}</span>
                      ))}
                    </div>
                    <div className="key-dates">
                      <span><Clock size={12} /> Created: {new Date(key.created_at).toLocaleDateString()}</span>
                      {key.last_used_at && <span>· Last used: {new Date(key.last_used_at).toLocaleString()}</span>}
                    </div>
                  </div>
                  {key.is_active && (
                    <button className="btn-icon danger" onClick={() => handleRevoke(key.key_id, key.name)} title="Revoke key">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="usage-section">
          {usageStats.length > 0 && (
            <>
              <h3>Usage Summary</h3>
              <div className="stats-grid-sec">
                {usageStats.map(stat => (
                  <div key={stat.key_id} className="stat-card-sec">
                    <div className="stat-key-name"><Key size={14} /> {stat.name}</div>
                    <div className="stat-nums">
                      <div className="stat-num"><span>{stat.total_requests}</span>Total Requests</div>
                      <div className="stat-num success"><span>{stat.successful}</span>Success</div>
                      <div className="stat-num fail"><span>{stat.failed}</span>Failed</div>
                    </div>
                    {stat.last_request && (
                      <div className="stat-last"><Clock size={12} /> Last: {new Date(stat.last_request).toLocaleString()}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <h3 style={{ marginTop: '24px' }}>Request Log</h3>
          {usageLogs.length === 0 ? (
            <p className="empty-text">No usage logs yet.</p>
          ) : (
            <div className="logs-table-wrapper">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Key</th>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {usageLogs.map(log => (
                    <tr key={log.log_id}>
                      <td className="log-time">{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.key_name}</td>
                      <td><span className="method-badge">{log.method}</span></td>
                      <td className="log-endpoint">{log.endpoint}</td>
                      <td><span className={`status-code ${log.status_code < 400 ? 'ok' : 'err'}`}>{log.status_code}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Security;
