// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { RootState } from '../../lib/store/redux/store';
// import {User} from '@awc/helpers/user'
// import { AccessToken, AuthorizationState } from '@/lib/types/auth/types';

// const initialState: AuthorizationState = {
//     isLoading: true,
//     isAuthenticated: false,
//     logout: false,
//     token: null,
//     user: null,
//     error: null
// };

// export const authorizationSlice = createSlice({
//     name: 'authorization',
//     initialState,
//     reducers: {
//         setLoggedIn: (state, action: PayloadAction<boolean>) => {
//             state.isAuthenticated = action.payload;
//         },
//         setAccessToken: (state, action: PayloadAction<AccessToken>) => {
//             state.token = action.payload;
//         },
//         setUser: (state, action: PayloadAction<User>) => {
//             state.user = action.payload;
//         },
//         setIsLoading: (state, action: PayloadAction<boolean>) => {
//             state.isLoading = action.payload;
//         },
//         setInitialState: (state, action: PayloadAction<AuthorizationState>) => {
//             state.isLoading = action.payload.isLoading;
//             state.isAuthenticated = action.payload.isAuthenticated;
//             state.token = action.payload.token;
//             state.user = action.payload.user;
//             state.error = action.payload.error;
//         },
//         setLogout: (state, action: PayloadAction<boolean>) => {
//             state.logout = action.payload;
//         }
//     },
//     // selectors: {
//     //    loading: (state: RootState) => state.authorization.isLoading
//     // }
// });

// export const { setLoggedIn, setAccessToken, setUser, setIsLoading, setInitialState, setLogout } = authorizationSlice.actions;

// export const selectIsLoading = (state: RootState) => state.authorization.isLoading;
// export const selectIsLoggedIn = (state: RootState) => state.authorization.isAuthenticated;
// export const selectAccessToken = (state: RootState) => state.authorization.token;
// export const selectUser = (state: RootState) => state.authorization.user;
// export const selectError = (state: RootState) => state.authorization.error;
// export const selectLogout = (state: RootState) => state.authorization.logout;

// export default authorizationSlice.reducer;