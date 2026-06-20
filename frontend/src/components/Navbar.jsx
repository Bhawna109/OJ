import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/problems', label: 'Problems' },
  { to: '/contests', label: 'Contests' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/submissions', label: 'Submissions' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <Link to="/" className="text-xl font-bold text-indigo-600 tracking-tight">
        BhawnaOJ
      </Link>

      <div className="flex items-center gap-6">
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium transition-colors ${
              pathname === to
                ? 'text-indigo-600 border-b-2 border-indigo-600 pb-0.5'
                : 'text-gray-600 hover:text-indigo-600'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link to="/profile" className="text-sm text-gray-700 font-medium hover:text-indigo-600 transition-colors">
              Hi, {user.firstName}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
