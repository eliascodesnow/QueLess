import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function CustomerStatus() {
  const { joinCode, sessionToken } = useParams();
  const [status, setStatus] = useState(null);
  const [queueId, setQueueId] = useState(null);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatName, setChatName] = useState('');
  const [chatText, setChatText] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  async function loadStatus() {
    try {
      const data = await api.getMyStatus(sessionToken);
      setStatus(data);
    } catch (err) {
      setError(err.message);
      clearInterval(pollRef.current);
    }
  }

  async function loadQueueMeta() {
    try {
      const data = await api.getQueueByJoinCode(joinCode);
      setQueueId(data.queue.id);
      setChatEnabled(data.queue.chatEnabled);
    } catch {
      /* non-fatal */
    }
  }

  async function loadChat() {
    try {
      const data = await api.getChatHistory(joinCode);
      setMessages(data.messages);
    } catch {
      /* non-fatal */
    }
  }

  useEffect(() => {
    loadStatus();
    loadQueueMeta();
    loadChat();
    // Poll as a reliable fallback alongside sockets (handles missed events / reconnects).
    pollRef.current = setInterval(loadStatus, 15000);
    return () => clearInterval(pollRef.current);
  }, [sessionToken]);

  useEffect(() => {
    if (!queueId) return;
    const socket = getSocket();
    socket.emit('queue:join', { queueId });

    const onQueueUpdate = () => loadStatus();
    const onChatMessage = (payload) => {
      if (payload.queueId === queueId) setMessages((m) => [...m, payload.message]);
    };

    socket.on('queue:update', onQueueUpdate);
    socket.on('chat:message', onChatMessage);
    return () => {
      socket.off('queue:update', onQueueUpdate);
      socket.off('chat:message', onChatMessage);
      socket.emit('queue:leave', { queueId });
    };
  }, [queueId]);

  async function handleLeave() {
    try {
      await api.leaveQueue(sessionToken);
      localStorage.removeItem(`foleni_session_${joinCode}`);
      setStatus((s) => ({ ...s, status: 'LEFT' }));
    } catch (err) {
      setError(err.message);
    }
  }

  function sendChat(e) {
    e.preventDefault();
    if (!chatText.trim()) return;
    const socket = getSocket();
    socket.emit('chat:send', {
      queueId,
      displayName: chatName || 'Someone in line',
      message: chatText,
    });
    setChatText('');
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-text" style={{ marginTop: 40 }}>{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container">
        <p className="muted" style={{ marginTop: 40 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="brand" style={{ marginTop: 40 }}>Fol<span>eni</span></div>

      <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
        {status.status === 'WAITING' && (
          <>
            <p className="muted" style={{ marginBottom: 4 }}>Your position</p>
            <div className="position-badge">#{status.position}</div>
            <p className="muted" style={{ marginTop: 10 }}>
              {status.peopleAhead} people ahead · ~{status.estimatedWaitMins} min estimated wait
            </p>
          </>
        )}
        {status.status === 'SERVING' && (
          <>
            <div className="position-badge" style={{ color: 'var(--accent)' }}>You're up!</div>
            <p className="muted" style={{ marginTop: 10 }}>Please head over now.</p>
          </>
        )}
        {status.status === 'SERVED' && <p>You've been served. Thanks for using Foleni!</p>}
        {status.status === 'NO_SHOW' && <p className="error-text">Marked as a no-show.</p>}
        {status.status === 'LEFT' && <p className="muted">You left this queue.</p>}
      </div>

      {status.status === 'WAITING' && (
        <button className="secondary" onClick={handleLeave}>
          Leave queue
        </button>
      )}

      {chatEnabled && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2>Community board</h2>
          <p className="muted" style={{ marginTop: -8, marginBottom: 12 }}>
            For people waiting in this same queue — say hi, or find each other in person.
          </p>
          <div className="chat-box">
            {messages.length === 0 && <p className="muted">No messages yet.</p>}
            {messages.map((m) => (
              <div className="chat-msg" key={m.id}>
                <div className="who">{m.displayName}</div>
                {m.message}
              </div>
            ))}
          </div>
          <form onSubmit={sendChat}>
            <input
              placeholder="Your display name (optional)"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
            />
            <input
              placeholder="Say something to others in line…"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        </div>
      )}
    </div>
  );
}
