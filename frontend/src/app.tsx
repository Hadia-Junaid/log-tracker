import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import Router from "preact-router";
import Context = require("ojs/ojcontext");

import { Header } from "./components/header";
import { Footer } from "./components/footer";

import Dashboard from "./views/Dashboard";
import Logs from "./views/Logs";
import NotFound from "./views/NotFound";
import Settings from "./views/Settings";
import Applications from "./views/Applications";
import UserManagement from "./views/UserManagement";
import Sidebar from "./components/Sidebar";
import Login from "./views/Login";
import "./styles/app.css";
// import "./styles/userManagement.css";
import axios from "./api/axios";
import LoadingSpinner from "./components/LoadingSpinner";

type Props = {
    appName?: string;
    userLogin?: string;
    userId?: string;
};

function checkAuth(): Promise<{ authenticated: boolean; email?: string }> {
  return axios
    .get(`/auth/status`)
    .then((res) => {
      console.log("Auth check response:", res);
      return {
        authenticated: res.data?.authenticated === true,
        email: res.data?.user?.email,
      };
    })
    .catch(() => ({ authenticated: false }));
}

export const App = registerCustomElement(
    "app-root",
    ({
        appName = "Log Tracker",
    }: Props) => {
        const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
        const [userLogin, setUserLogin] = useState<string>("");
        const [userId, setUserId] = useState<string>("");

    useEffect(() => {
      const checkOrExchangeAuth = async () => {
        // Look for auth_code in URL
        const hash = window.location.hash;
        const query = hash.includes("?") ? hash.split("?")[1] : "";
        const params = new URLSearchParams(query);
        const authCode = params.get("auth_code");

        if (authCode) {
          try {
            // Exchange code -> set cookie
            await axios.post("/auth/exchange", {
              auth_code: authCode,
            });

            // Clear the hash so it's clean
            window.location.hash = "";
          } catch (err) {
            console.error("OAuth exchange failed", err);
            setIsAuthenticated(false);
            return;
          }
        }

                const res = await axios.get("/auth/status");
                const isAuthed = res.data?.authenticated === true;
                if (!isAuthed || !res.data?.user) {
                    setIsAuthenticated(false);
                    return;
                }
            
                const userId = res.data?.user._id;
                const userLogin = res.data?.user.email;
                setUserId(userId);
                setUserLogin(userLogin);
                setIsAuthenticated(true);
            };

      checkOrExchangeAuth();
    }, []);

    if (isAuthenticated === null) {
      return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
      return <Login />;
    }

    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }, []);

    return (
      <div id="appContainer" class="oj-web-applayout-page">
        <Header appName={appName} userLogin={userLogin} />

        <div
          class="oj-web-applayout-content oj-flex"
          style={{ height: "calc(100vh - 120px)", overflow: "hidden" }}
        >
          <Sidebar />
          <main
            class="oj-flex-item"
            style={{ overflow: "auto", height: "100%" }}
          >
            <Router>
              <Dashboard path="/" userId={userId} />
              <Logs path="/logs" />
              <Applications path="/applications" />
              <UserManagement path="/users" />
              <Settings path="/settings" />

              <NotFound default />
            </Router>
          </main>
        </div>
      </div>
    );
  }
);
