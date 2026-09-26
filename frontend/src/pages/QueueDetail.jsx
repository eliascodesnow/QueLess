import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function QueueDetail() {
  const { id } = useParams();
  const [queue, setQueue] = useState(null);
  const [entries, setEntries] = useState([]);
  const [joinUrl, setJoinUrl] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await api.getQueueDetail(id);
      setQueue(data.queue);
      setEntries(data.queue.entries);
      setJoinUrl(data.joinUrl);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.emit('queue:join', { queueId: id });
    const handler = (payload) => {
      if (payload.queueId === id) setEntries(payload.entries);
    };
    socket.on('queue:update', handler);
    return () => {
      socket.off('queue:update', handler);
      socket.emit('queue:leave', { queueId: id });
    };
  }, [id]);

  async function handleCallNext() {
    try {
      const data = await api.callNext(id);
      setEntries(data.entries);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMark(entryId, status) {
    try {
      const data = await api.markEntryStatus(id, entryId, status);
      setEntries(data.entries);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusToggle(newStatus) {
    try {
      const data = await api.updateQueueStatus(id, newStatus);
      setQueue((q) => ({ ...q, status: data.queue.status }));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!queue) {
    return (
      <div className="container">
        {error ? <p className="error-text">{error}</p> : <p className="muted">Loading…</p>}
      </div>
    );
  }

  const serving = entries.find((e) => e.status === 'SERVING');
  const waiting = entries.filter((e) => e.status === 'WAITING');

  return (
    <div className="container wide">
      <Link to="/dashboard" className="muted">
        ← Back to dashboard
      </Link>
      <h1 style={{ marginTop: 8 }}>{queue.name}</h1>
      <p className="muted">
        {queue.description || 'No description'} · avg {queue.avgServiceTimeMins} min/customer
      </p>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Status: <span className="status-pill waiting">{queue.status}</span>
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {queue.status !== 'OPEN' && (
              <button style={{ width: 'auto', padding: '8px 12px' }} onClick={() => handleStatusToggle('OPEN')}>
                Open
              </button>
            )}
            {queue.status === 'OPEN' && (
              <button
                className="secondary"
                style={{ width: 'auto', padding: '8px 12px' }}
                onClick={() => handleStatusToggle('PAUSED')}
              >
                Pause
              </button>
            )}
            <button
              className="danger"
              style={{ width: 'auto', padding: '8px 12px' }}
              onClick={() => handleStatusToggle('CLOSED')}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Share this queue</h2>
        <p className="muted" style={{ wordBreak: 'break-all' }}>{joinUrl}</p>
        <div className="qr-wrap">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`}
            alt="QR code to join queue"
            width="180"
            height="180"
          />
        </div>
        <p className="muted" style={{ textAlign: 'center' }}>Print this or display it at your counter</p>
      </div>

      <div className="card">
        <h2>Now serving</h2>
        {serving ? (
          <div className="queue-row">
            <div>
              <strong>{serving.customerName}</strong>
              <p className="muted" style={{ margin: 0 }}>Position #{serving.position}</p>
            </div>
            <button
              style={{ width: 'auto', padding: '8px 12px' }}
              onClick={() => handleMark(serving.id, 'SERVED')}
            >
              Mark served
            </button>
          </div>
        ) : (
          <p className="muted">Nobody is being served right now.</p>
        )}
        <button style={{ marginTop: 12 }} onClick={handleCallNext} disabled={waiting.length === 0}>
          Call next
        </button>
      </div>

      <div className="card">
        <h2>Waiting ({waiting.length})</h2>
        {waiting.length === 0 && <p className="muted">Nobody waiting yet.</p>}
        {waiting.map((e) => (
          <div className="queue-row" key={e.id}>
            <div>
              <strong>#{e.position} {e.customerName}</strong>
            </div>
            <div className="row-actions">
              <button className="secondary" onClick={() => handleMark(e.id, 'NO_SHOW')}>
                No-show
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
