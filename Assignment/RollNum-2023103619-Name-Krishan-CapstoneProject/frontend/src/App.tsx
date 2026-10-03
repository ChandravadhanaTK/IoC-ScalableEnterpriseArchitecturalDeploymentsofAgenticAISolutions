/**
 * App Component - Main Application Entry Point
 * 
 * This is the root component that manages the overall application state and routing.
 * It handles user authentication flow and renders either the login page or the main
 * chatbot interface based on authentication status.
 * 
 * Features:
 * - Authentication state management
 * - Automatic token validation on app load
 * - User session persistence via localStorage
 * - Conditional rendering based on auth status
 * - Logout functionality
 * 
 * State Management:
 * - currentUser: Currently authenticated user data
 * - authToken: JWT authentication token
 * - loading: Loading state during authentication checks
 * 
 * Flow:
 * 1. On app load, check for existing token in localStorage
 * 2. If token exists, validate it with backend
 * 3. If valid, set user as authenticated
 * 4. If no token or invalid, show login page
 * 5. After successful login, show chatbot interface
 */

import React, { useState, useEffect } from 'react';
import ChatBot from './components/ChatBot';
import Login from './components/Login';
import { api } from './api';
import './App.css';

// TypeScript interface for user data
interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

/**
 * Main App component that handles authentication and routing
 * 
 * @returns JSX.Element - The rendered application
 */
function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Check for existing authentication token on app load
   * 
   * This effect runs once when the component mounts to check if the user
   * has a valid authentication token stored in localStorage.
   */
  useEffect(() => {
    const checkExistingAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        try {
          // Validate token with backend
          const user = await api.getCurrentUser();
          setCurrentUser(user);
          setAuthToken(storedToken);
        } catch (error) {
          // Token is invalid or expired, remove it
          console.error('Token validation failed:', error);
          localStorage.removeItem('authToken');
        }
      }
      
      setLoading(false);
    };

    checkExistingAuth();
  }, []);

  /**
   * Handle successful login
   * 
   * Called when user successfully logs in or registers.
   * Sets the authentication state and stores token.
   * 
   * @param user - User data from successful authentication
   * @param token - JWT authentication token
   */
  const handleLoginSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };

  /**
   * Handle user logout
   * 
   * Clears authentication state and removes token from storage.
   */
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('authToken');
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentUser ? (
        // User is authenticated - show chatbot interface
        <ChatBot 
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      ) : (
        // User is not authenticated - show login page
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
