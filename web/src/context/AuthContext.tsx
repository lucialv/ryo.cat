import {
    createContext,
    useContext,
    useState,
    useEffect,
} from "react";
import type { ReactNode } from "react";
import { googleLogout } from "@react-oauth/google";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";

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
    const queryClient = useQueryClient();

    const setUser = (newUser: User) => {
        const wasLoggedOut = user === null;
        setUserState(newUser);
        sessionStorage.setItem("user", JSON.stringify(newUser));

        queryClient.invalidateQueries({ queryKey: ['profile'] });

        if (wasLoggedOut && newUser !== null) {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error("Failed to logout from server:", error);
        }

        googleLogout();
        sessionStorage.removeItem("user");
        setUserState(null);
        queryClient.clear();
        window.location.href = "/";
    };

    useEffect(() => {
        const saved = sessionStorage.getItem("user");
        if (saved) {
            try {
                const parsed: User = JSON.parse(saved);
                setUserState(parsed);
                queryClient.invalidateQueries({ queryKey: ['posts'] });
            } catch {
                sessionStorage.removeItem("user");
            }
        }
        setIsLoading(false);
    }, [queryClient]);

    return (
        <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};