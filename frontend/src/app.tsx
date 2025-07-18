import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { UserProvider } from "./context/UserContext";
import { AuthenticatedApp } from "./AuthenticatedApp";

type Props = {
    appName?: string;
    userLogin?: string;
};


window.addEventListener("error", function (event) {
    console.log("Error caught:", event.message);
  if (event.message?.includes("_getPreferredSize")) {
    console.warn("Ignored chart _getPreferredSize error:", event.message);
    event.preventDefault(); // Suppress default logging
    location.reload(); // Force reload
  }
});

window.addEventListener("unhandledrejection", function (event) {
    console.log("Unhandled rejection:", event.reason);
  const reason = event.reason?.message || "";
  if (typeof reason === "string" && reason.includes("_getPreferredSize")) {
    console.warn("Ignored chart _getPreferredSize unhandled rejection:", reason);
    event.preventDefault();
    location.reload(); // Force reload
  }
});


// This component simply serves as an entry point to the app and provides the UserContext to the entire application.
export const App = registerCustomElement(
    "app-root",
    ({ appName = "" }: Props) => {
        return (
            <UserProvider>
                <AuthenticatedApp appName={appName} />
            </UserProvider>
        );
    }
);
