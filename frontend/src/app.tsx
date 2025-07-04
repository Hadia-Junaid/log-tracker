import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect } from "preact/hooks";
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

type Props = {
  appName?: string;
  userLogin?: string;
};

export const App = registerCustomElement(
  "app-root",
  ({ appName = "Log Tracker", userLogin = "john.hancock@oracle.com" }: Props) => {
    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
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
