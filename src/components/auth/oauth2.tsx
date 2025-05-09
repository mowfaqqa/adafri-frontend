"use client"
import { setCookie } from '@/lib/utils/cookies';
import { Oauth2, Spinner } from '@awc/react';
import {AdfOauth2} from "@awc/react/legacy/modules.js"
import { AccessToken } from '@/lib/types/auth/types';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { User } from '@awc/helpers/user';
import { AuthContext } from '@/lib/context/auth';
import { useRouter } from 'next/navigation';



const ACCESS_TOKEN_COOKIE = '__frsadfrusrtkn';
const REFRESH_TOKEN_COOKIE = '__rfrsadfrusrtkn';

interface AdfDialogProps {
    children: React.ReactNode;
    ref?: React.RefObject<AdfOauth2>;
}


const OAuth2 = forwardRef<AdfOauth2, AdfDialogProps>((props, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [token, setAccessToken] = useState<AccessToken | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [logout, tryLogout] = useState(false);
    const [login, tryLogin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const {children} = props
    const reference = useRef<AdfOauth2>(null);
    const router = useRouter();
    useEffect(() => {
        if(logout){
            console.log('logout triggered', logout)
        }
        if(login && reference.current){
            reference.current?.startOAuthFlow()
        }
    }, [login, logout]);
    return (
        <AuthContext.Provider value={{token, setAccessToken, isLoading, setIsLoading, user, setUser, isAuthenticated, setIsAuthenticated, logout, tryLogout, login, tryLogin}}>
            {children}
            <Oauth2
                ref={reference}
                clientId={process.env.NEXT_PUBLIC_CLIENT_ID}
                redirectUri={process.env.NEXT_PUBLIC_REDIRECT_URI}
                authorizationEndpoint={process.env.NEXT_PUBLIC_AUTHORIZATION_ENDPOINT}
                userEndpoint={process.env.NEXT_PUBLIC_USERINFO_ENDPOINT}
                responseType={'code'}
                prompt="none"
                tokenEndpoint={process.env.NEXT_PUBLIC_TOKEN_ENDPOINT}
                auto={false} onChange={(e) => {
                    console.log(e);
                    if(e.token){
                        setCookie(ACCESS_TOKEN_COOKIE, e.token.access_token, 365);
                        setAccessToken(e.token);
                        if(e.token.refresh_token){
                            setCookie(REFRESH_TOKEN_COOKIE, e.token.refresh_token, 365);
                        }
                    }
                    if(e.user){
                        setCookie("userId", e.user.uid, 365);
                        setUser(e.user);
                    }
                    if(e.isAuthenticated){
                        setIsAuthenticated(e.isAuthenticated);
                    }
                    if(e.event==='load_end'){
                        setIsLoading(false);
                        if(!e.isAuthenticated){
                            // tryLogin(true);
                            router.push('/auth/login');
                        }
                    }
                }} />
        </AuthContext.Provider>
    )
})
OAuth2.displayName = 'Oauth2';

export default OAuth2
