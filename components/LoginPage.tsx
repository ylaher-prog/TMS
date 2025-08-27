import React, { useState } from 'react';
import type { Teacher } from '../types';

interface LoginPageProps {
  teachers: Teacher[];
  onLoginSuccess: (user: Teacher) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ teachers, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = teachers.find(t => t.username?.toLowerCase() === username.toLowerCase());

    // In a real app, you would compare a securely hashed password.
    // Here we use a mock 'password123' -> '12345' hash.
    const mockPasswordHash = '12345';
    
    if (user && user.username && password === 'password123' && user.passwordHash === mockPasswordHash) {
      onLoginSuccess(user);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-bg dark:bg-brand-navy">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800/50 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-navy dark:text-white tracking-wider">QTMS</h1>
          <p className="mt-2 text-brand-text-light dark:text-gray-400">Teacher Management System</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm bg-transparent dark:text-gray-200"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">Password</label>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-slate-600 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm bg-transparent dark:text-gray-200"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

            {error && (
                <div className="text-red-500 text-sm text-center">
                    {error}
                </div>
            )}
            
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Hint: Use <strong>admin</strong> / <strong>password123</strong>
            </p>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-rose-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;