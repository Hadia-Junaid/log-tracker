import { registerCustomElement } from "ojs/ojvcomponent";
import { h } from "preact";
import { UserProvider } from "./context/UserContext";
import { AuthenticatedApp } from "./AuthenticatedApp";

type Props = {
    appName?: string;
    userLogin?: string;
};

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
