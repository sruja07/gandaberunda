import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState({ loading: true, data: null, error: null });
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then((res) => {
        if (!res.ok) throw new Error('Backend not reachable');
        return res.json();
      })
      .then((data) => setApiStatus({ loading: false, data: data.message, error: null }))
      .catch((err) => setApiStatus({ loading: false, data: null, error: err.message }));
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="badge">Full-Stack Monorepo</div>
        <h1>Gandaberundha</h1>
        <p className="subtitle">
          Modern React (Vite) Frontend + Node.js (Express) Backend Architecture
        </p>
      </header>

      <main className="main-content">
        <div className="card-grid">
          <div className="card">
            <h2>⚡ Frontend Status</h2>
            <p className="status active">Active (Vite + React)</p>
            <div className="counter-box">
              <button onClick={() => setCounter((c) => c + 1)} className="btn">
                Interactive State: {counter}
              </button>
            </div>
          </div>

          <div className="card">
            <h2>⚙️ Backend Connection</h2>
            {apiStatus.loading ? (
              <p className="status pending">Checking connection...</p>
            ) : apiStatus.error ? (
              <div className="status-container">
                <p className="status error">Offline / Stopped</p>
                <p className="hint">Run <code>cd backend && npm run dev</code> to start API</p>
              </div>
            ) : (
              <div className="status-container">
                <p className="status success">Connected</p>
                <p className="response-data">"{apiStatus.data}"</p>
              </div>
            )}
          </div>
        </div>

        <section className="info-section">
          <h2>Project Directories</h2>
          <div className="structure">
            <div className="dir-box">
              <h3>📂 <code>/frontend</code></h3>
              <p>Vite + React application directory</p>
            </div>
            <div className="dir-box">
              <h3>📂 <code>/backend</code></h3>
              <p>Express.js API server directory</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
