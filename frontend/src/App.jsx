import React, { useCallback, useEffect, useState } from "react";

const API = "http://localhost:3001/api";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("isp_token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("isp_user") || "null"); }
    catch { return null; }
  });
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [service, setService] = useState("Government schemes");
  const [details, setDetails] = useState("");

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const logout = () => {
    localStorage.removeItem("isp_token");
    localStorage.removeItem("isp_user");
    setToken("");
    setUser(null);
    setRequests([]);
    setMessage("");
    setError("");
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Authentication failed.");

      if (mode === "register") {
        setMessage("Account created. Please log in.");
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
        return;
      }

      localStorage.setItem("isp_token", data.token);
      localStorage.setItem("isp_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setForm({ fullName: "", email: data.user.email, password: "" });
      setMessage("You are logged in.");
    } catch (err) {
      setError(err.message || "Cannot connect to the server.");
    }
  };

  const loadRequests = useCallback(async (signal) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/requests`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        signal
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) logout();
        throw new Error(data.message || "Could not load requests.");
      }
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Could not connect to the API.");
      }
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    loadRequests(controller.signal);
    return () => controller.abort();
  }, [token, reload, loadRequests]);

  const submitRequest = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ service, details })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not submit request.");
      setMessage(`Request submitted successfully. Reference number: ${data.id}.`);
      setDetails("");
      setReload((value) => value + 1);
    } catch (err) {
      setError(err.message || "Could not connect to the API.");
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Inclusive Services Portal home">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>Inclusive Services <span className="brand-light">Portal</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#requests">My Requests</a>
          {token ? (
            <button className="nav-button" onClick={logout}>Log out</button>
          ) : (
            <a href="#account">Login / Register</a>
          )}
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">ACCESSIBLE SUPPORT, ALL IN ONE PLACE</p>
            <h1>Inclusive Services Portal</h1>
            <p>Find support information and manage your submitted service requests in one accessible place.</p>
            <a className="primary-link" href={token ? "#requests" : "#account"}>
              {token ? "View my requests" : "Get started"} <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hero-symbol" aria-hidden="true">✦</div>
        </section>

        {message && <div className="notice success" role="status">{message}</div>}
        {error && <div className="notice error" role="alert">{error}</div>}

        {!token ? (
          <section className="panel auth-panel" id="account" aria-labelledby="account-title">
            <div className="section-heading">
              <p className="eyebrow">YOUR ACCOUNT</p>
              <h2 id="account-title">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p>{mode === "login" ? "Log in to view requests associated with your account." : "Register to use the portal and save support requests."}</p>
            </div>
            <form className="form-grid" onSubmit={submitAuth}>
              {mode === "register" && (
                <label>
                  Full name
                  <input name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" minLength="2" maxLength="190" required />
                </label>
              )}
              <label>
                Email address
                <input type="email" name="email" value={form.email} onChange={updateField} autoComplete="email" maxLength="190" required />
              </label>
              <label>
                Password
                <input type="password" name="password" value={form.password} onChange={updateField} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength="8" maxLength="72" required />
                {mode === "register" && <span className="field-help">Use at least 8 characters.</span>}
              </label>
              <button className="primary-button" type="submit">
                {mode === "login" ? "Log in" : "Create account"} <span aria-hidden="true">→</span>
              </button>
            </form>
            <p className="switch-mode">
              {mode === "login" ? "New to the portal?" : "Already have an account?"}{" "}
              <button type="button" className="text-button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setMessage(""); }}>
                {mode === "login" ? "Create an account" : "Log in"}
              </button>
            </p>
            <p className="demo-note">Student demo: use test details. This starter does not verify email ownership; do not use it to expose real or sensitive records.</p>
          </section>
        ) : (
          <>
            <section className="welcome-row" aria-label="Account information">
              <div>
                <p className="eyebrow">YOUR DASHBOARD</p>
                <h2>Welcome, {user?.fullName || user?.email || "User"}</h2>
                <p className="muted">Signed in as {user?.email}</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => setReload((n) => n + 1)} disabled={loading}>
                {loading ? "Refreshing..." : "Refresh requests"}
              </button>
            </section>

            <section className="panel" id="requests" aria-labelledby="requests-title">
              <div className="section-heading row-heading">
                <div>
                  <p className="eyebrow">REQUEST HISTORY</p>
                  <h2 id="requests-title">My Saved Requests</h2>
                  <p>Requests connected to your signed-in email address.</p>
                </div>
                {!loading && <span className="count-pill">{requests.length} {requests.length === 1 ? "request" : "requests"}</span>}
              </div>

              {loading && <p className="state-message" role="status">Loading your saved requests…</p>}
              {!loading && !error && requests.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon" aria-hidden="true">▤</span>
                  <h3>No saved requests yet</h3>
                  <p>Submit a test request below and it will appear in this table.</p>
                </div>
              )}
              {!loading && requests.length > 0 && (
                <div className="table-wrap" role="region" aria-label="Saved requests table" tabIndex="0">
                  <table>
                    <caption>Saved support requests for {user?.email}</caption>
                    <thead>
                      <tr>
                        <th scope="col">Request ID</th>
                        <th scope="col">Service category</th>
                        <th scope="col">Request details</th>
                        <th scope="col">Status</th>
                        <th scope="col">Submitted on</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td data-label="Request ID">#{request.id}</td>
                          <td data-label="Service category">{request.service || "—"}</td>
                          <td data-label="Request details" className="details-cell">{request.details || "No details provided"}</td>
                          <td data-label="Status"><span className="status-pill">{request.status || "Submitted"}</span></td>
                          <td data-label="Submitted on">{formatDate(request.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel submit-panel" aria-labelledby="submit-title">
              <div className="section-heading">
                <p className="eyebrow">NEED ASSISTANCE?</p>
                <h2 id="submit-title">Submit a test request</h2>
                <p>This form saves a new row to your MySQL service_requests table.</p>
              </div>
              <form className="form-grid" onSubmit={submitRequest}>
                <label>
                  Service category <span aria-hidden="true">*</span>
                  <select value={service} onChange={(e) => setService(e.target.value)} required>
                    <option>Government schemes</option>
                    <option>Education support</option>
                    <option>Financial assistance</option>
                    <option>Accessibility support</option>
                    <option>Other</option>
                  </select>
                </label>
                <label>
                  What information do you need? <span className="muted">(optional)</span>
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows="4" maxLength="2000" placeholder="Briefly describe your request. Do not include sensitive medical details." />
                </label>
                <button className="primary-button" type="submit">Submit request <span aria-hidden="true">→</span></button>
              </form>
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><span className="brand-mark" aria-hidden="true">✦</span> Inclusive Services Portal</div>
        <p>Building a more accessible digital experience for everyone.</p>
        <small>Educational demo project · Verify official scheme details with relevant authorities.</small>
      </footer>
    </div>
  );
}
