import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/common/Button.jsx';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setIsLoading(true);
    try {
      await login(demoEmail, demoPass);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            Collab<span className="text-brand-600">Space</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
        <p className="mt-1 text-xs text-slate-500">Sign in to your team workspace</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-modal sm:rounded-2xl sm:px-10 border border-slate-200/80">
          {/* Quick Demo Logins */}
          <div className="mb-6 p-3 bg-brand-50/60 rounded-xl border border-brand-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>1-Click Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoFill('owner@collabspace.io', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-800 hover:bg-brand-50 font-medium text-left truncate shadow-2xs"
              >
                👑 Sarah (Owner)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin@collabspace.io', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-800 hover:bg-brand-50 font-medium text-left truncate shadow-2xs"
              >
                🛡️ Marcus (Admin)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('pm@collabspace.io', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-800 hover:bg-brand-50 font-medium text-left truncate shadow-2xs"
              >
                📋 Elena (PM)
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('member@collabspace.io', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-800 hover:bg-brand-50 font-medium text-left truncate shadow-2xs"
              >
                💻 Alex (Member)
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
