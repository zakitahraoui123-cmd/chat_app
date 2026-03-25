import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "./api.js";
import "./auth.css";

export default function Login() {
  const [userNumber, setUserNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_number: userNumber,
          user_password: password,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        setError("Invalid response from server.");
        return;
      }

      if (!res.ok) {
        setError(data?.message || "Login failed. Check your ID and password.");
        return;
      }

      if (data?.message !== "user correct") {
        setError(data?.message || "Login failed.");
        return;
      }

      const userName = data.userName;
      const userid = data.userId;
      const avatar = data.image;
      localStorage.setItem(
        "user",
        JSON.stringify({ userName, userid, avatar })
      );

      try {
        const postsResponse = await axios.get(
          `${API_BASE}/auth/posts/${userid}`,
          { withCredentials: true }
        );
        localStorage.setItem(
          "userPosts",
          JSON.stringify(postsResponse.data.userPosts ?? [])
        );
      } catch (err) {
        console.error(err);
        localStorage.setItem("userPosts", "[]");
      }

      navigate("/dash");
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Sign in</h1>
        <p className="auth-sub">Welcome back — use your ID number and password.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error ? (
            <div className="auth-alert auth-alert--error" role="alert">
              {error}
            </div>
          ) : null}

          <label>
            ID number
            <input
              type="text"
              autoComplete="username"
              placeholder="e.g. 1001"
              value={userNumber}
              onChange={(e) => setUserNumber(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
