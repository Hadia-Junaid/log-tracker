// src/components/app.tsx
import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import Router from "preact-router";
import Context = require("ojs/ojcontext");

// Layout
import { Header } from "./header";
import { Footer } from "./footer";

// Views
import Dashboard from "../views/Dashboard";
import Logs from "../views/Logs";
import NotFound from "../views/NotFound";

type Props = {
  appName?: string;
  userLogin?: string;
};

export const App = registerCustomElement(
  "app-root",
  ({ appName = "App Name", userLogin = "john.hancock@oracle.com" }: Props) => {
    // 1) Let OJET know you’re done bootstrapping
    useEffect(() => {
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }, []);

    // 2) Track the “URL” based on hash changes
    const [url, setUrl] = useState(() => window.location.hash.slice(1) || "/");

    useEffect(() => {
      const onHash = () => setUrl(window.location.hash.slice(1) || "/");
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }, []);

    return (
      <div id="appContainer" class="oj-web-applayout-page">
        <Header appName={appName} userLogin={userLogin} />

        <div class="oj-web-applayout-content">
          <Router url={url}>
            <Dashboard path="/" />
            <Logs path="/logs" />
            <NotFound default />
          </Router>
        </div>

        <Footer />
      </div>
    );
  }
);
