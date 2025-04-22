import React from 'react'
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


const loginUser = async (username, password) => {
  try {
    const response = await axios.post('https://pragati-glass-project-1.vercel.app/api/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw new Error('Login failed. Please check your credentials.');
  }
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser({ ...parsedUser, token: storedToken });
    }
    
    setIsLoading(false);
  }, []);


  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await loginUser(username, password);
     
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token || '');

      setUser(userData);
    } catch (err) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
