/**
 * Login Component
 * 
 * This component provides user authentication functionality including:
 * - User login form with username/password fields
 * - User registration form for new accounts
 * - Form validation and error handling
 * - JWT token storage and management
 * - Responsive design for mobile and desktop
 * 
 * Features:
 * - Toggle between login and registration modes
 * - Real-time form validation
 * - Loading states during authentication
 * - Error message display
 * - Secure token storage in localStorage
 * - Integration with backend authentication API
 * 
 * State Management:
 * - Form data (username, email, password, confirmPassword)
 * - Loading states for async operations
 * - Error messages and validation feedback
 * - Authentication mode (login vs register)
 * 
 * @component
 * @example
 * ```tsx
 * <Login onLoginSuccess={(user, token) => {
 *   setCurrentUser(user);
 *   setAuthToken(token);
 * }} />
 * ```
 */

import React, { useState } from 'react';
import { api } from '../api';
import '../styles/Login.css';

// TypeScript interfaces for component props and data structures
interface LoginProps {
  /** Callback function called when user successfully logs in */
  onLoginSuccess: (user: User, token: string) => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface LoginFormData {
  username: string;
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * Login component for user authentication
 * 
 * Provides a complete authentication interface with login and registration
 * functionality, form validation, and integration with the backend API.
 * 
 * @param props - Component props
 * @param props.onLoginSuccess - Callback for successful authentication
 * @returns JSX.Element - The rendered login component
 */
const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  // Authentication mode state - toggles between 'login' and 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Loading state for async operations (login/register API calls)
  const [loading, setLoading] = useState<boolean>(false);
  
  // Form data state for login form
  const [loginData, setLoginData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  
  // Form data state for registration form
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Form validation errors state
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validates login form data
   * 
   * Checks required fields and basic validation rules for login form.
   * Updates the errors state with any validation issues found.
   * 
   * @param data - Login form data to validate
   * @returns boolean - True if form is valid, false otherwise
   */
  const validateLoginForm = (data: LoginFormData): boolean => {
    const newErrors: FormErrors = {};
    
    // Username validation
    if (!data.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (data.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    // Password validation
    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validates registration form data
   * 
   * Performs comprehensive validation for registration including email format,
   * password strength, and password confirmation matching.
   * 
   * @param data - Registration form data to validate
   * @returns boolean - True if form is valid, false otherwise
   */
  const validateRegisterForm = (data: RegisterFormData): boolean => {
    const newErrors: FormErrors = {};
    
    // Username validation
    if (!data.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (data.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Email validation
    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!data.password) {
      newErrors.password = 'Password is required';
    } else if (data.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, lowercase letter, and number';
    }
    
    // Confirm password validation
    if (!data.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles user login submission
   * 
   * Validates form data, calls login API, and handles the response.
   * On successful login, stores the token and calls the success callback.
   * 
   * @param e - Form submission event
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateLoginForm(loginData)) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Call login API endpoint
      const response = await api.login(loginData);
      
      // Store authentication token in localStorage for persistence
      localStorage.setItem('authToken', response.access_token);
      
      // Call success callback with user data and token
      onLoginSuccess(response.user, response.access_token);
      
    } catch (error: any) {
      // Handle authentication errors
      console.error('Login error:', error);
      setErrors({
        general: error.message || 'Login failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles user registration submission
   * 
   * Validates form data, calls registration API, and automatically logs
   * the user in after successful registration.
   * 
   * @param e - Form submission event
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateRegisterForm(registerData)) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      // Call registration API endpoint
      await api.register({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password
      });
      
      // Automatically log in the user after successful registration
      const loginResponse = await api.login({
        username: registerData.username,
        password: registerData.password
      });
      
      // Store authentication token
      localStorage.setItem('authToken', loginResponse.access_token);
      
      // Call success callback
      onLoginSuccess(loginResponse.user, loginResponse.access_token);
      
    } catch (error: any) {
      // Handle registration errors
      console.error('Registration error:', error);
      console.error('Error message:', error.message);
      setErrors({
        general: error.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles input field changes for login form
   * 
   * Updates the loginData state and clears related error messages
   * when user types in form fields.
   * 
   * @param e - Input change event
   */
  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Handles input field changes for registration form
   * 
   * Updates the registerData state and clears related error messages
   * when user types in form fields.
   * 
   * @param e - Input change event
   */
  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Switches between login and register modes
   * 
   * Clears form data and errors when switching modes to provide
   * a clean slate for the user.
   * 
   * @param newMode - The mode to switch to ('login' or 'register')
   */
  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrors({});
    setLoginData({ username: '', password: '' });
    setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header with mode toggle */}
        <div className="login-header">
          <h1>AI Chatbot</h1>
          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-button ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`mode-button ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              Register
            </button>
          </div>
        </div>

        {/* General error message display */}
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleLoginInputChange}
                className={errors.username ? 'error' : ''}
                placeholder="Enter your username"
                disabled={loading}
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
                disabled={loading}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {/* Registration Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input
                type="text"
                id="reg-username"
                name="username"
                value={registerData.username}
                onChange={handleRegisterInputChange}
                className={errors.username ? 'error' : ''}
                placeholder="Choose a username"
                disabled={loading}
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterInputChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterInputChange}
                className={errors.password ? 'error' : ''}
                placeholder="Create a password"
                disabled={loading}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Confirm your password"
                disabled={loading}
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
