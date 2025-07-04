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
import axios from "axios";

type Props = {
    appName?: string;
    userLogin?: string;
};

function checkAuth(): Promise<boolean> {
    const backendUrl = process.env.BACKEND_URL;
    return axios
        .get(`${backendUrl}/auth/status`, {
            withCredentials: true,
        })
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

        // useEffect(() => {
        //     checkAuth().then(setIsAuthenticated);
        // }, []);

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
                        await axios.post(
                            `${process.env.BACKEND_URL}/auth/exchange`,
                            { auth_code: authCode },
                            { withCredentials: true }
                        );

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
            return <div>Loading...</div>;
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
                    style={{ height: "100vh", overflow: "hidden" }}
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
