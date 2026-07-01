import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

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
    <nav className="bg-gray-100 border-b border-gray-200 px-6 py-2 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <Link to="/">
        <Logo size="sm" />
      </Link>

      <div className="flex items-center gap-6">
        {navLinks.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium transition-colors ${
              pathname === to
                ? 'text-blue-900 border-b-2 border-blue-900 pb-0.5'
                : 'text-gray-600 hover:text-blue-900'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link to="/profile" className="text-sm font-medium bg-gray-200 hover:bg-gray-300 text-blue-900 px-4 py-1.5 rounded-lg transition-colors">
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
              className="text-sm font-medium text-gray-600 hover:text-blue-900 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-blue-900 text-white px-4 py-1.5 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
