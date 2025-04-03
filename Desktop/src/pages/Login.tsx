import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Login.css'

interface LoginCredentials {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const user = localStorage.getItem('authToken')
    if(user){
      window.location.href = "/dashboard"
    }
  }, [])
  
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3002/accounts/login', {
        username: credentials?.username,
        password: credentials?.password
      });
      
      if (response.status === 200) {
        setSuccess(true);
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 3000); 
        }
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Network error. Please try again.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
};

  
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Sign in</h2>
        {success ? (
          <div className="success-message">
            Successfully logged in!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>

            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {isLoading && <span className="spinner"></span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;