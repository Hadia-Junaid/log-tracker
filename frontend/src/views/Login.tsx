// src/views/Login.tsx
import { h } from "preact";
import { useState } from "preact/hooks";
import axios from "axios";
import "ojs/ojbutton";
import "ojs/ojinputtext";
import "ojs/ojlabel";
import "ojs/ojformlayout";
import "ojs/ojavatar";
import "ojs/ojprogress-circle";
import "ojs/ojvcomponent"; // Required for VDOM

import "../styles/login.css"; // CSS styles you’ll add next

const GOOGLE_AUTH_URL = `${process.env.BACKEND_URL}/auth/google`;

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(GOOGLE_AUTH_URL, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError("Invalid response from server.");
        console.error("Unexpected response:", data);
      }
    } catch (err) {
      console.error("OAuth initiation failed:", err);
      setError("Could not connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="login-container oj-flex oj-sm-flex-items-initial oj-sm-justify-content-center oj-sm-align-items-center">
      <div class="login-card oj-panel oj-sm-padding-5x">
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-3x-bottom">
          <oj-avatar size="lg" role="img" initials="LT" class="oj-avatar-bg-orange" />
        </div>

        <h2 class="oj-typography-heading-md oj-sm-margin-2x-bottom oj-sm-text-align-center">Welcome to Log Tracker</h2>

        <oj-button
          class="google-login-btn"
          chroming="solid"
          onojAction={handleLogin}
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Login with Google"}
        </oj-button>

        {loading && (
          <div class="oj-sm-margin-3x-top oj-sm-flex oj-sm-justify-content-center">
            <oj-progress-circle size="sm" value={-1} />
          </div>
        )}

        {error && <p class="error-text oj-text-color-danger">{error}</p>}
      </div>
    </div>
  );
}
