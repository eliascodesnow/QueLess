import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Dashboard() {
  const [queues, setQueues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', avgServiceTimeMins: 10 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const businessName = localStorage.getItem('foleni_business_name');

  async function loadQueues() {
    try {
      const data = await api.listMyQueues();
      setQueues(data.queues);
    } catch (err) {
      if (err.message.includes('token')) handleLogout();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueues();
  }, []);

  function handleLogout() {
    localStorage.removeItem('foleni_token');
    localStorage.removeItem('foleni_business_name');
    navigate('/login');
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createQueue({
        ...form,
        avgServiceTimeMins: Number(form.avgServiceTimeMins),
      });
      setForm({ name: '', description: '', avgServiceTimeMins: 10 });
      setShowForm(false);
      loadQueues();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <div className="top-nav" style={{ padding: '20px 0' }}>
        <div>
          <div className="brand">Fol<span>eni</span></div>
          {businessName && <span className="muted">{businessName}</span>}
        </div>
        <button className="secondary" style={{ width: 'auto', padding: '8px 14px' }} onClick={handleLogout}>
          Log out
        </button>
      </div>

      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{ marginBottom: 16 }}>
          + New queue
        </button>
      )}

      {showForm && (
        <form className="card" onSubmit={handleCreate}>
          <h2>New queue</h2>
          <label>Queue name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Haircuts, General consultation"
            required
          />
          <label>Description (optional)</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label>Average time per customer (minutes)</label>
          <input
            type="number"
            min="1"
            value={form.avgServiceTimeMins}
            onChange={(e) => setForm({ ...form, avgServiceTimeMins: e.target.value })}
          />
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit">Create</button>
            <button type="button" className="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2 style={{ marginTop: 24 }}>Your queues</h2>
      {loading && <p className="muted">Loading…</p>}
      {!loading && queues.length === 0 && (
        <p className="muted">No queues yet — create your first one above.</p>
      )}

      {queues.map((q) => (
        <Link key={q.id} to={`/dashboard/queues/${q.id}`}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{q.name}</strong>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {q._count.entries} waiting · {q.status.toLowerCase()}
                </p>
              </div>
              <span className="status-pill waiting">{q.status}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
