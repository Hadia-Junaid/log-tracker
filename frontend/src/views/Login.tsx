import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import axios, { isAxiosError } from "../api/axios";
import "ojs/ojbutton";
import "ojs/ojinputtext";
import "ojs/ojlabel";
import "ojs/ojformlayout";
import "ojs/ojavatar";
import "ojs/ojprogress-circle";
import "ojs/ojvcomponent";
import "../styles/login.css";
import logoImage from "../assets/logtracker.png";

interface LoginProps {
  serverUnavailable: boolean;
  setServerUnavailable: (value: boolean) => void;
}

export default function Login({
  serverUnavailable,
  setServerUnavailable,
}: LoginProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.get(`/auth/google`);
      window.location.href = response.data.authUrl;
    } catch (err) {
      console.error("Login redirect failed", err);

      // If server is unavailable again, show the message for 4 seconds
      if (isAxiosError(err) && !err.response) {
        setServerUnavailable(true);

        setTimeout(() => {
          setServerUnavailable(false);
        }, 4000);
      }
    }
  };

  useEffect(() => {
    const hash = window.location.hash; // e.g. "#login?error=access_denied&message=..."
    if (hash.includes("?")) {
      const queryParams = new URLSearchParams(hash.split("?")[1]);
      const errorParam = queryParams.get("error");
      const message = queryParams.get("message");
      if (errorParam && message) {
        setError(decodeURIComponent(message));
        // Clear the hash query after showing the message
        window.history.replaceState(
          null,
          "",
          window.location.pathname + "#login"
        );
      }
    }
  }, []);

  return (
    <div class="login-container oj-flex oj-sm-flex-items-initial oj-sm-justify-content-center oj-sm-align-items-center">
      <div class="login-card oj-panel oj-sm-padding-5x">
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-3x-bottom">
          <img
            src={logoImage}
            alt="Log Tracker Logo"
            class="sidebar-logo-image"
            style={{ width: "65px", height: "65px" }}
          />
        </div>

        <h2 class="oj-typography-heading-md oj-sm-margin-2x-bottom oj-sm-text-align-center">
          Welcome to Log Tracker
        </h2>

        <oj-button
          class="google-login-btn"
          chroming="solid"
          onojAction={handleLogin}
          disabled={loading || serverUnavailable}
        >
          {loading ? "Redirecting..." : "Login with Google"}
        </oj-button>

        {loading && (
          <div class="oj-sm-margin-3x-top oj-sm-flex oj-sm-justify-content-center">
            <oj-progress-circle size="sm" value={-1} />
          </div>
        )}

        {serverUnavailable && (
          <p class="error-text oj-text-color-danger oj-sm-margin-2x-top">
            The server is currently unavailable.
          </p>
        )}

        {error && (
          <p class="error-text oj-text-color-danger oj-sm-margin-2x-top">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
