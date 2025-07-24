import {
    createContext,
    useContext,
    useState,
    useEffect,
} from "react";
import type { ReactNode } from "react";
import { googleLogout } from "@react-oauth/google";

type User = {
    email: string;
    id: string;
    name: string;
    profileImg: string;
    sub: string;
    isAdmin: boolean;
};

interface AuthContextType {
    user: User | null;
    setUser: (user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => { },
    logout: () => { },
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const setUser = (user: User) => {
        setUserState(user);
        sessionStorage.setItem("user", JSON.stringify(user));
    };

    const logout = () => {
        googleLogout();
        sessionStorage.removeItem("user");
        setUserState(null);
        window.location.href = "/";
    };

    useEffect(() => {
        const saved = sessionStorage.getItem("user");
        if (saved) {
            try {
                const parsed: User = JSON.parse(saved);
                setUserState(parsed);
            } catch {
                sessionStorage.removeItem("user");
            }
        }
        setIsLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};