import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  squad: string;
  avatar?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from database instead of localStorage
    const checkAuth = async () => {
      try {
        // This should check your database instead of localStorage
        // For now, set loading to false as we're removing localStorage
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (userData: User) => {
    try {
      setUser(userData);
      // This should save to your database instead of localStorage
      // TODO: Implement database save here
      console.log('User logged in, should save to database:', userData);
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      // This should clear from your database instead of localStorage
      // TODO: Implement database logout here
      console.log('User logged out, should clear from database');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        // This should save to your database instead of localStorage
        // TODO: Implement database update here
        console.log('User updated, should save to database:', updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
      }
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };
}; 