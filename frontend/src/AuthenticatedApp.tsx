import { useEffect, useState } from "preact/hooks";
import { Router } from "preact-router";
import axios, { isAxiosError } from "./api/axios";
import Context from "ojs/ojcontext";
import { useUser } from "./context/UserContext";
import LoadingSpinner from "./components/LoadingSpinner";
import { Header } from "./components/header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./views/Dashboard";
import Logs from "./views/Logs";
import NotFound from "./views/NotFound";
import Settings from "./views/Settings";
import Applications from "./views/Applications";
import UserManagement from "./views/UserManagement";
import Login from "./views/Login";

export const AuthenticatedApp = ({ appName }: { appName: string }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [serverUnavailable, setServerUnavailable] = useState<boolean>(false);

  const { user, setUser } = useUser();

  useEffect(() => {
    const checkOrExchangeAuth = async () => {
      try {
        // Check if the URL contains an auth_code in the hash which it will for new login via OAuth
        const hash = window.location.hash;
        const query = hash.includes("?") ? hash.split("?")[1] : "";
        const params = new URLSearchParams(query);
        const authCode = params.get("auth_code");

        // If auth_code is present, exchange it for user data
        if (authCode) {
          const res = await axios.post("/auth/exchange", {
            auth_code: authCode,
          });
          setUser(res.data.user);
          setIsAuthenticated(true);
          window.location.hash = "";
          return;
        }

        // If there is no auth_code, check the current authentication status
        const res = await axios.get("/auth/status");
        setIsAuthenticated(res.data?.authenticated === true);
        if (res.data.user) setUser(res.data.user);
      } catch (err) {
        console.error("Auth check or exchange failed", err);
        if (isAxiosError(err) && !err.response) {
          setServerUnavailable(true);
          setTimeout(() => {
            setServerUnavailable(false);
          }, 4000);
        }
        setIsAuthenticated(false);
      }
    };

    checkOrExchangeAuth();
  }, []);

  // OJET Convention to signal that the application has completed its bootstrap process
  useEffect(() => {
    if (isAuthenticated) {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) return <LoadingSpinner />;
  if (!isAuthenticated) return <Login serverUnavailable={serverUnavailable} setServerUnavailable={setServerUnavailable} />;

  return (
    <div id="appContainer" class="oj-web-applayout-page">
      <Header appName={appName} userLogin={user?.email || ""} />
      <div
        class="oj-web-applayout-content oj-flex"
        style={{ height: "calc(100vh - 120px)", overflow: "hidden" }}
      >
        <Sidebar />
        <main class="oj-flex-item" style={{ overflow: "auto", height: "100%" }}>
          <Router>
            <Dashboard path="/" />
            <Logs path="/logs" />
            <UserManagement path="/users" />
            <Applications path="/applications" />
            <Settings path="/settings" />
            <NotFound default />
          </Router>
        </main>
      </div>
    </div>
  );
};
