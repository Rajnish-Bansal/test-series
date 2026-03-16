import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Global safety timeout to ensure loading always finishes
        const safetyTimer = setTimeout(() => {
            setLoading(loadingState => {
                if (loadingState) {
                    console.warn("[AUTH] Global auth loading safety timeout reached.");
                    return false;
                }
                return loadingState;
            });
        }, 3000);

        try {
            // Load user from localStorage on initial load
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');
            if (storedUser && token) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("[AUTH] Error re-hydrating auth state:", error);
            // Clear corrupted state
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
            clearTimeout(safetyTimer);
        }

        return () => clearTimeout(safetyTimer);
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
