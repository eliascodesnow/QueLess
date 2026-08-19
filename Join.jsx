import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Join() {
  const { joinCode } = useParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api
      .getQueueByJoinCode(joinCode)
      .then((data) => {
        setQueue(data.queue);
        setWaitingCount(data.waitingCount);
      })
      .catch((err) => setLoadError(err.message));
  }, [joinCode]);

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.joinQueue(joinCode, { customerName: name, phone: phone || undefined });
      // Persist so the customer can reopen the status page later without rejoining.
      localStorage.setItem(`foleni_session_${joinCode}`, data.sessionToken);
      navigate(`/status/${joinCode}/${data.sessionToken}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <div className="container">
        <p className="error-text" style={{ marginTop: 40 }}>{loadError}</p>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="container">
        <p className="muted" style={{ marginTop: 40 }}>Loading…</p>
      </div>
    );
  }

  // If the customer already has an active session for this queue, offer to resume.
  const existingSession = localStorage.getItem(`foleni_session_${joinCode}`);

  return (
    <div className="container">
      <div className="brand" style={{ marginTop: 40 }}>Fol<span>eni</span></div>

      <div className="card" style={{ marginTop: 16 }}>
        <h1>{queue.name}</h1>
        <p className="muted">{queue.businessName}</p>
        {queue.description && <p className="muted">{queue.description}</p>}
        <p style={{ marginTop: 12 }}>
          <strong>{waitingCount}</strong> people currently waiting · ~{queue.avgServiceTimeMins} min each
        </p>
        {queue.status !== 'OPEN' && (
          <p className="error-text">This queue isn't accepting new customers right now.</p>
        )}
      </div>

      {existingSession && (
        <button
          className="secondary"
          style={{ marginBottom: 16 }}
          onClick={() => navigate(`/status/${joinCode}/${existingSession}`)}
        >
          Resume my place in line
        </button>
      )}

      {queue.status === 'OPEN' && (
        <form className="card" onSubmit={handleJoin}>
          <h2>Join this queue</h2>
          <label>Your name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Phone (optional — for SMS updates, if enabled)</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Joining…' : 'Join queue'}
          </button>
        </form>
      )}
    </div>
  );
}
