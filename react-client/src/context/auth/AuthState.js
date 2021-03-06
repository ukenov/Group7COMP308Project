import { useReducer } from 'react';
import axios from 'axios';
import AuthContext from './authContext';
import authReducer from './authReducer';
import setAuthToken from '../../utils/setAuthToken';
// These are the types that defines the action types in useReducer
import {
    REGISTER_SUCCESS,
    REGISTER_FAIL,
    USER_LOADED,
    AUTH_ERROR,
    LOGIN_SUCCESS,
    LOGIN_FAIL,
    LOGOUT,
    CLEAR_ERRORS
} from '../types';

const AuthState = props => {
    // Declare the states here
    const initialState = {
        token: sessionStorage.getItem('token'),
        isAuthenticated: null,
        loading: true,
        user: null,
        error: null
    }

    const [ state, dispatch ] = useReducer(authReducer, initialState);

    // Load User
    const loadUser = async () => {

        // @todo - load the token into global headers
        if (sessionStorage.token) {
            setAuthToken(sessionStorage.token);
        }
        try {
            const res = await axios.get('http://localhost:3000/api/auth');
            
            dispatch({ 
                type: USER_LOADED,
                payload: res.data 
            });

        } catch (err) {
            dispatch({ type: AUTH_ERROR });
        }
    }
    // Register User
    const register = async formData => {
        let requestBody = {
            query: `
            mutation {
                createAccount(accountInput: 
                    {firstName: "${formData.firstName}",
                    lastName: "${formData.lastName}",
                    email: "${formData.email}",
                    password: "${formData.password}",
                    city: "${formData.city}",
                    phoneNumber: "${formData.phoneNumber}",
                    accountType: "${formData.accountType}",
                    nurseId: "${formData.nurseId}"  
                    })
                    {
                        _id
                    }
            }
            `
        };

        // making post request and sending data, so we need content type to be application/json in header
        const config = {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json'
            }
        }

        try {
            fetch('http://localhost:3000/graphql', config)
            .then(res => {
                if (res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
                }
                return res.json();
            })
            .then(resData => {
                console.log(resData);

                dispatch({
                    type: REGISTER_SUCCESS,
                    //payload: res.data
                    payload: resData.data
                });
            })

            await loadUser();
        } catch (err) {
            console.log(err.response);
            dispatch({
                type: REGISTER_FAIL,
                payload: err.response.data.msg
            });
        }
    }

    // Login User
    const login = async formData => {
      
        try {  
            let requestBody = {
                query: `
                  query {
                    loginUser(email: "${formData.email}", password: "${formData.password}") {
                      token
                    }
                  }
                `
            };
    
            const config = {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            /*
            fetch('http://localhost:3000/graphql', config)
            .then(res => {
                if (res.status !== 200 && res.status !== 201) {
                throw new Error('Failed!');
                }
                return res.json();            
            })
            .then(resData => {
                console.log(resData.data.loginUser.token)
                dispatch({
                    type: LOGIN_SUCCESS,
                    payload: resData.data.loginUser.token
                });
            })
            */
            const res = await axios.post('http://localhost:3000/api/signIn', formData, config);
            console.log(res.data);
            dispatch({
                type: LOGIN_SUCCESS,
                payload: res.data
            });
            
            await loadUser();
        } catch (err) {
            dispatch({
                type: LOGIN_FAIL,
                payload: err.response.data.msg
            });
        }
    }
    // Logout
    const logout = () => {
        dispatch({ 
            type: LOGOUT
        });
    }
    // Clear Errors
    const clearErrors = () => {
        dispatch({ type: CLEAR_ERRORS});
    }

    return (
        <AuthContext.Provider 
            value={{
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                loading: state.loading,
                user: state.user,
                error: state.error,
                register,
                clearErrors,
                loadUser,
                login,
                logout
            }} >
                {props.children}
            </AuthContext.Provider>
    );
};

export default AuthState;
