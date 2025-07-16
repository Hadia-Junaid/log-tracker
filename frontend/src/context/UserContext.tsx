// src/context/UserContext.tsx
import { createContext, ComponentChildren } from "preact";
import { useContext, useState } from "preact/hooks";

export interface User {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
    groups?: {
        id: string;
        name: string;
        is_admin: boolean;
    }[];
}

type UserContextType = {
    user: User | null;
    setUser: (u: User | null) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ComponentChildren }) => {
    const [user, setUser] = useState<User | null>(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within a UserProvider");
    return ctx;
};
