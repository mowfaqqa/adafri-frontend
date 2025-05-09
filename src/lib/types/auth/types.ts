
import {User} from '@awc/helpers/user'
import { AdfOauth2 } from '@awc/react/legacy/modules.js';
import { Dispatch, ForwardedRef, SetStateAction } from 'react';
export interface AccessToken{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
}
export interface AuthorizationState {
    // loggedIn: boolean;
    isAuthenticated: boolean;
    token: AccessToken | null;
    user: User | null;
    isLoading: boolean;
    error: string | null;
    logout?: boolean
    login?: boolean
}

export interface RouteAuthParams extends Partial<AuthorizationState> {
    onUser?: (user: any) => any,
    // onAccessToken?: (token: AccessToken) => any,
    setAccessToken: Dispatch<SetStateAction<AccessToken | null>>,
    onAuthenticate?: Dispatch<SetStateAction<boolean>>,
    setUser: Dispatch<SetStateAction<User | null>>,
    setIsLoading?: Dispatch<SetStateAction<boolean>>,
    setIsAuthenticated: Dispatch<SetStateAction<boolean>>,
    tryLogout: Dispatch<SetStateAction<boolean>>,
    tryLogin: Dispatch<SetStateAction<boolean>>,
    // onAuthenticate?: () => any,
    triggerLogin?: (ref: ForwardedRef<AdfOauth2>) => void 
  }