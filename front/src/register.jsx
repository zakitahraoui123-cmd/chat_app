import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE } from "./api.js";
import "./auth.css";

export default function Register() {
  const [userInfo, setUserInfo] = useState({
    user_number: "",
    user_name: "",
    user_password: "",
  });
  const [message, setMessage] = useState("");
  const [userError, setUserError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendToBack(e) {
    e.preventDefault();
    setMessage("");
    setUserError("");

    if (
      !userInfo.user_number ||
      !userInfo.user_name ||
      !userInfo.user_password
    ) {
      setUserError("Please fill in all fields.");
      return;
    }

    if (userInfo.user_password.length < 8) {
      setUserError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/auth/register`,
        userInfo,
        { withCredentials: true }
      );
      setMessage(response.data?.message || "Registration successful.");
      setUserError("");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to register.";
      setUserError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="auth-sub">Join with an ID, display name, and password.</p>

        <form className="auth-form" onSubmit={sendToBack}>
          {userError ? (
            <div className="auth-alert auth-alert--error" role="alert">
              {userError}
            </div>
          ) : null}
          {message && !userError ? (
            <div className="auth-alert auth-alert--success" role="status">
              {message}
            </div>
          ) : null}

          <label>
            User ID
            <input
              type="text"
              placeholder="Unique ID"
              value={userInfo.user_number}
              onChange={(e) =>
                setUserInfo({ ...userInfo, user_number: e.target.value })
              }
              required
            />
          </label>

          <label>
            Display name
            <input
              type="text"
              placeholder="Your name"
              value={userInfo.user_name}
              onChange={(e) =>
                setUserInfo({ ...userInfo, user_name: e.target.value })
              }
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="At least 8 characters"
              value={userInfo.user_password}
              onChange={(e) =>
                setUserInfo({ ...userInfo, user_password: e.target.value })
              }
              required
              minLength={8}
            />
          </label>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Register"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
