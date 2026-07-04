import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Admin Panel</h1>
        <p className="text-gray-500 mb-8">Manage problems, test cases and contests</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/admin/problems" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">📝</div>
            <h2 className="text-lg font-bold text-blue-900">Problems</h2>
            <p className="text-sm text-gray-500 mt-1">Add, edit or delete problems</p>
          </Link>
          <Link to="/admin/contests" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">🏆</div>
            <h2 className="text-lg font-bold text-blue-900">Contests</h2>
            <p className="text-sm text-gray-500 mt-1">Create and manage contests</p>
          </Link>
          <Link to="/admin/users" className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-3">👥</div>
            <h2 className="text-lg font-bold text-blue-900">Users</h2>
            <p className="text-sm text-gray-500 mt-1">View all registered users</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
