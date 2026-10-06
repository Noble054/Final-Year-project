import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, config);
          setUser({ ...data, token });
        } catch (error) {
          console.error(error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (identifier, password) => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, { identifier, password });
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const register = async (registrationData) => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, registrationData);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
