// src/components/app.tsx
import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useEffect } from "preact/hooks";
import Router from "preact-router";
import Context = require("ojs/ojcontext");

import { Header } from "./header";
import { Footer } from "./footer";

import Dashboard from "../views/Dashboard";
import Logs from "../views/Logs";
import NotFound from "../views/NotFound";
import Settings from "../views/Settings";
import Applications from "../views/Applications";

type Props = {
  appName?: string;
  userLogin?: string;
};

export const App = registerCustomElement(
  "app-root",
  ({ appName = "App Name", userLogin = "john.hancock@oracle.com" }: Props) => {
    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }, []);

    return (
      <div id="appContainer" class="oj-web-applayout-page">
        <Header appName={appName} userLogin={userLogin} />
        <div class="oj-web-applayout-content">
          <Router>
            <Dashboard path="/" />
            <Logs path="/logs" />
            <Applications path="/applications" />
            <Settings path="/settings" />
            <NotFound default />
          </Router>
        </div>
        <Footer />
      </div>
    );
  }
);
