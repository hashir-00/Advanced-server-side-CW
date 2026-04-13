import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import './Auth.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await api.get(`/auth/verify/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };
    if (token) verify();
  }, [token]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <h2>Email Verification</h2>
        </div>

        {status === 'verifying' && (
          <div style={{ padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="success-message">{message}</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>You can now log in to your account.</p>
            <Link to="/login" className="btn btn-primary btn-block" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="error-message">{message}</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Please try registering again or contact support.</p>
            <Link to="/register" className="btn btn-outline" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border-color)', textDecoration: 'none' }}>
              Back to Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
