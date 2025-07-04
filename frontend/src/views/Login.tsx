// src/views/Login.tsx
import { h } from "preact";
import axios from "axios";
import { useState } from "preact/hooks";

const GOOGLE_AUTH_URL = `${process.env.BACKEND_URL}/auth/google`;

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log("Google auth URL:", GOOGLE_AUTH_URL);
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(GOOGLE_AUTH_URL, {
        withCredentials: true, // sends cookies
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
    <div class="login-page">
      <h2>Login</h2>
      <button
        class="google-login-btn"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "Redirecting..." : "Login with Google"}
      </button>
      {error && <p class="error">{error}</p>}
    </div>
  );
}
