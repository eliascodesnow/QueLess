import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.register(form);
      localStorage.setItem('foleni_token', data.token);
      localStorage.setItem('foleni_business_name', data.business.name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginTop: 40 }}>Register your business</h1>
      <p className="muted">Any business can sign up — barbershop, clinic, salon, cybercafé…</p>

      <form className="card" onSubmit={handleSubmit} style={{ marginTop: 20 }}>
        <label>Business name</label>
        <input value={form.name} onChange={update('name')} required />
        <label>Email</label>
        <input type="email" value={form.email} onChange={update('email')} required />
        <label>Phone (optional)</label>
        <input value={form.phone} onChange={update('phone')} placeholder="+254..." />
        <label>Password (min 8 characters)</label>
        <input type="password" value={form.password} onChange={update('password')} required minLength={8} />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center' }}>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
