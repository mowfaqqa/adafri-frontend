"use client"
import { setCookie } from '@/lib/utils/cookies';
import { Oauth2, Spinner } from '@awc/react';
import {AdfOauth2} from "@awc/react/legacy/modules.js"
import { AccessToken } from '@/lib/types/auth/types';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { User } from '@awc/helpers/user';
import { AuthContext } from '@/lib/context/auth';
import { usePathname, useRouter } from 'next/navigation';

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
    const [redirectUri, setRedirectUri] = useState('');
    const {children} = props
    const reference = useRef<AdfOauth2>(null);
    const router = useRouter();
    const pathname = usePathname();
    useEffect(() => {
        if(logout){
            console.log('logout triggered', logout)
        }
        if(login && reference.current){
            reference.current?.startOAuthFlow()
        }
        if(typeof window !== 'undefined'){
            // console.log(window.location.origin)
            setRedirectUri(window.location.origin + '/auth/login');
        }
        if(isAuthenticated && pathname === "/auth/login"){            
            router.push('/dashboard');
        }
    }, [login, logout, isAuthenticated, pathname, router]);

    return (
        <AuthContext.Provider value={{token, setAccessToken, isLoading, setIsLoading, user, setUser, isAuthenticated, setIsAuthenticated, logout, tryLogout, login, tryLogin, redirectUri, setRedirectUri}}>
            {children}
            {redirectUri.length>0 && <Oauth2
                ref={reference}
                clientId={process.env.CLIENT_ID}
                redirectUri={redirectUri}
                authorizationEndpoint={process.env.AUTHORIZATION_ENDPOINT}
                userEndpoint={process.env.USERINFO_ENDPOINT}
                responseType={'code'}
                prompt="none"
                tokenEndpoint={process.env.TOKEN_ENDPOINT}
                auto={false} onChange={(e) => {
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
                    if(e.user && e.token){
                        setIsAuthenticated(true);
                    }
                    if(e.isAuthenticated){
                        setIsAuthenticated(e.isAuthenticated);
                    }
                    if(e.event==='load_end'){
                        setIsLoading(false);
                        if(!e.token || !e.user){
                            router.push('/auth/login');
                        }else{
                            if(pathname === "/auth/login"){
                                router.push('/dashboard');
                            }
                        }
                    }
                }} />}
        </AuthContext.Provider>
    )
})
OAuth2.displayName = 'Oauth2';

export default OAuth2
