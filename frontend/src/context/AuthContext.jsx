import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Function to load the user profile
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Profile fetch failed (e.g. token expired), reset state
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }

    // Listen for logout events dispatched by Axios response interceptors
    const handleLogoutEvent = () => {
      logout();
    };
    window.addEventListener('auth-logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/login', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  // Signup handler
  const signup = async (email, password, name) => {
    console.log("Signing up with:", email, name);
    try {
      setLoading(true);
      const response = await api.post('/signup', { email, password, name });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.detail || 'Signup failed. Please try again.';
      console.error("Signup error:", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Google Login / Signup handler
  const googleLogin = async (googlePayload) => {
    try {
      setLoading(true);
      const response = await api.post('/google-auth', googlePayload);
      const { access_token, user: loggedUser } = response.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      if (loggedUser) {
        setUser(loggedUser);
      }
      return { success: true, user: loggedUser };
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.detail || 'Google sign-in failed. Please try again.';
      console.error("Google Auth error:", errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Profile update helper to sync UI state
  const updateProfileState = (updatedProfile) => {
    setUser(updatedProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        googleLogin,
        logout,
        updateProfileState,
        refreshProfile: fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
