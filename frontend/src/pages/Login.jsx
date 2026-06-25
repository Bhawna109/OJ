import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  if (user) { navigate('/problems'); return null; }
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form, { withCredentials: true });
      login(res.data);
      navigate('/problems');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6">Login to your BhawnaOJ account</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com" required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="••••••••" required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900" />
          </div>

          <button type="submit" disabled={loading}
            className="bg-blue-900 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-900 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
