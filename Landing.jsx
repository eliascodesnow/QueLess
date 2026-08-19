import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="container">
      <div className="brand" style={{ marginTop: 40, marginBottom: 4 }}>
        Fol<span>eni</span>
      </div>
      <p className="muted">Skip the physical wait.</p>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>For businesses</h2>
        <p className="muted">
          Create a queue in seconds. Share a link or QR code. Watch customers join and manage
          the line from your phone — no more shouting "who's next?"
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Link to="/register" style={{ flex: 1 }}>
            <button>Create a business account</button>
          </Link>
        </div>
        <p style={{ marginTop: 10 }}>
          <Link to="/login">Already have an account? Log in</Link>
        </p>
      </div>

      <div className="card">
        <h2>For customers</h2>
        <p className="muted">
          Scan the QR code at the business, or ask for their join link. You'll see your position
          and estimated wait live — no need to stand around.
        </p>
      </div>

      <div className="note">
        A queue app can't (and shouldn't) replace real human connection. While you wait, the
        community board on each queue lets you spot others waiting nearby if you'd rather chat in
        person than stare at a screen.
      </div>
    </div>
  );
}
