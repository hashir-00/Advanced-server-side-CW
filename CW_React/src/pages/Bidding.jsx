import React, { useState, useEffect } from 'react';
import { biddingService } from '../services/api';
import { Gavel, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import './Bidding.css';

const Bidding = () => {
  const [bids, setBids] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bidForm, setBidForm] = useState({ amount: '', targetDate: '' });
  const [increaseForm, setIncreaseForm] = useState({ bidId: null, newAmount: '' });
  const [placing, setPlacing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bidsRes, eligRes] = await Promise.all([
        biddingService.getMyBids(),
        biddingService.checkEligibility()
      ]);
      setBids(bidsRes.data.data);
      setEligibility(eligRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bidding data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPlacing(true);
    try {
      const res = await biddingService.placeBid(Number(bidForm.amount), bidForm.targetDate);
      setSuccess(res.data.message || 'Bid placed successfully!');
      setBidForm({ amount: '', targetDate: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setPlacing(false);
    }
  };

  const handleIncreaseBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setPlacing(true);
    try {
      const res = await biddingService.increaseBid(increaseForm.bidId, Number(increaseForm.newAmount));
      setSuccess(res.data.message || 'Bid increased successfully!');
      setIncreaseForm({ bidId: null, newAmount: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to increase bid');
    } finally {
      setPlacing(false);
    }
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading bidding data...</p>
      </div>
    );
  }

  return (
    <div className="bidding-container">
      <header className="bidding-header">
        <h1><Gavel size={28} /> Alumni of the Day — Blind Bidding</h1>
      </header>

      {error && <div className="bid-toast error"><AlertCircle size={16} /> {error}</div>}
      {success && <div className="bid-toast success"><CheckCircle size={16} /> {success}</div>}

      <div className="bidding-grid">
        <div className="bid-card eligibility-card">
          <h3>Your Eligibility</h3>
          {eligibility ? (
            <div className="eligibility-stats">
              <div className="elig-stat">
                <span className="elig-label">Wins this month</span>
                <span className="elig-value">{eligibility.winsThisMonth}</span>
              </div>
              <div className="elig-stat">
                <span className="elig-label">Monthly limit</span>
                <span className="elig-value">{eligibility.limit}</span>
              </div>
              <div className="elig-stat">
                <span className="elig-label">Remaining slots</span>
                <span className="elig-value highlight">{eligibility.remainingSlots}</span>
              </div>
            </div>
          ) : <p className="empty-text">Could not load eligibility.</p>}
        </div>

        <div className="bid-card">
          <h3>Place a New Bid</h3>
          <form className="bid-form" onSubmit={handlePlaceBid}>
            <div className="form-group">
              <label>Target Date</label>
              <input className="form-control" type="date" min={getMinDate()} required value={bidForm.targetDate} onChange={e => setBidForm({ ...bidForm, targetDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Bid Amount ($)</label>
              <input className="form-control" type="number" min="1" step="1" required placeholder="100" value={bidForm.amount} onChange={e => setBidForm({ ...bidForm, amount: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={placing}>{placing ? 'Placing...' : 'Place Bid'}</button>
          </form>
        </div>
      </div>

      <div className="bid-card bids-table-card">
        <h3>My Bids</h3>
        {bids.length > 0 ? (
          <div className="bids-table-wrapper">
            <table className="bids-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Target Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(bid => (
                  <tr key={bid.bid_id}>
                    <td>#{bid.bid_id}</td>
                    <td>{new Date(bid.target_date).toLocaleDateString()}</td>
                    <td className="bid-amount">${Number(bid.bid_amount).toLocaleString()}</td>
                    <td><span className={`badge-status ${bid.status}`}>{bid.status}</span></td>
                    <td>{new Date(bid.created_at).toLocaleDateString()}</td>
                    <td>
                      {bid.status === 'active' ? (
                        increaseForm.bidId === bid.bid_id ? (
                          <form onSubmit={handleIncreaseBid} className="increase-form">
                            <input className="form-control" type="number" min={Number(bid.bid_amount) + 1} step="1" required placeholder={`>${bid.bid_amount}`} value={increaseForm.newAmount} onChange={e => setIncreaseForm({ ...increaseForm, newAmount: e.target.value })} />
                            <button type="submit" className="btn btn-primary btn-sm" disabled={placing}>Go</button>
                            <button type="button" className="btn btn-outline btn-sm" onClick={() => setIncreaseForm({ bidId: null, newAmount: '' })}>✕</button>
                          </form>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => setIncreaseForm({ bidId: bid.bid_id, newAmount: '' })}><TrendingUp size={14} /> Increase</button>
                        )
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="empty-text">You haven't placed any bids yet.</p>}
      </div>
    </div>
  );
};

export default Bidding;
