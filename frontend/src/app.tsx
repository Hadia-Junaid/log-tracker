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
import "./styles/userManagement.css";
import axios from "./api/axios"; // Adjust the import path as necessary
import LoadingSpinner from "./components/LoadingSpinner"; // Adjust the import path as necessary

type Props = {
    appName?: string;
    userLogin?: string;
};

function checkAuth(): Promise<boolean> {
    return axios
        .get(`/auth/status`)
        .then((res) => {
            console.log("Auth check response:", res);
            return res.data?.authenticated === true;
        })
        .catch(() => false);
}

export const App = registerCustomElement(
    "app-root",
    ({
        appName = "Log Tracker",
        userLogin = "john.hancock@oracle.com",
    }: Props) => {
        const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
            null
        );

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

                // After possible exchange, check auth
                const isAuthed = await checkAuth();
                setIsAuthenticated(isAuthed);
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
            Context.getPageContext()
                .getBusyContext()
                .applicationBootstrapComplete();
        }, []);

        return (
            <div id="appContainer" class="oj-web-applayout-page">
                <Header appName={appName} userLogin={userLogin} />

                <div
                    class="oj-web-applayout-content oj-flex"
                    style={{ minHeight: "calc(100vh - 120px)" }}
                >
                    <Sidebar />
                    <main class="oj-flex-item">
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

                <Footer />
            </div>
        );
    }
);
