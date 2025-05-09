import { createContext } from 'react';
import { RouteAuthParams } from '../types/auth/types';

export const AuthContext = createContext<RouteAuthParams>({
    user: null,
    token: null,
    isLoading: true,
    setAccessToken: () => {},
    setUser: () => {},
    setIsAuthenticated: () => {},
    tryLogin: () => {},
    tryLogout: () => {},
    setRedirectUri: () => {},
});

