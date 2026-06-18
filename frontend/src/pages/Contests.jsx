import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const statusStyle = {
  Live:     'bg-green-100 text-green-700',
  Upcoming: 'bg-blue-100 text-blue-700',
  Ended:    'bg-gray-100 text-gray-500',
};

function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [targetDate]);
  return time;
}

function ContestCard({ c, onRegister }) {
  const endCountdown  = useCountdown(c.endTime);
  const startCountdown = useCountdown(c.startTime);

  const duration = () => {
    const mins = (new Date(c.endTime) - new Date(c.startTime)) / 60000;
    if (mins < 60) return `${mins}m`;
    return `${(mins / 60).toFixed(1).replace('.0','')}h`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[c.status]}`}>
            {c.status === 'Live' ? '● Live' : c.status}
          </span>
          {c.status === 'Live' && endCountdown && (
            <span className="text-xs text-red-500 font-mono">Ends in {endCountdown}</span>
          )}
          {c.status === 'Upcoming' && startCountdown && (
            <span className="text-xs text-blue-500 font-mono">Starts in {startCountdown}</span>
          )}
        </div>
        <h3 className="font-semibold text-gray-800 text-lg">{c.title}</h3>
        {c.description && <p className="text-sm text-gray-500 mt-0.5">{c.description}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(c.startTime).toLocaleString()} · {duration()} · {c.problems?.length || 0} problems
          {c.participantCount > 0 && ` · ${c.participantCount} registered`}
        </p>
        {c.problems?.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {c.problems.map(p => (
              <span key={p._id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{p.title}</span>
            ))}
          </div>
        )}
      </div>
      <div className="ml-4 flex flex-col gap-2 items-end">
        {c.status !== 'Ended' && (
          <button
            onClick={() => onRegister(c)}
            className={`text-sm font-medium px-5 py-2 rounded-lg transition-colors ${
              c.isRegistered
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {c.status === 'Live' ? (c.isRegistered ? '✓ Joined' : 'Join Now') : (c.isRegistered ? '✓ Registered' : 'Register')}
          </button>
        )}
        {(c.isRegistered || c.status === 'Ended') && (
          <Link
            to={`/contests/${c._id}`}
            className="text-sm font-medium px-5 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors text-center"
          >
            {c.status === 'Ended' ? 'View Problems' : 'Solve Problems →'}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Contests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchContests();
  }, [user]);

  const fetchContests = () => {
    axios.get(`${import.meta.env.VITE_API_URL}/contests`, { withCredentials: true })
      .then(res => setContests(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleRegister = async (c) => {
    const action = c.isRegistered ? 'unregister' : 'register';
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/contests/${c._id}/${action}`, {}, { withCredentials: true });
      fetchContests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading contests...</div>;

  const live     = contests.filter(c => c.status === 'Live');
  const upcoming = contests.filter(c => c.status === 'Upcoming');
  const ended    = contests.filter(c => c.status === 'Ended');

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Contests</h1>

        {live.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Live Now</h2>
            <div className="flex flex-col gap-3">
              {live.map(c => <ContestCard key={c._id} c={c} onRegister={handleRegister} />)}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Upcoming</h2>
            <div className="flex flex-col gap-3">
              {upcoming.map(c => <ContestCard key={c._id} c={c} onRegister={handleRegister} />)}
            </div>
          </section>
        )}

        {ended.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Past Contests</h2>
            <div className="flex flex-col gap-3">
              {ended.map(c => <ContestCard key={c._id} c={c} onRegister={handleRegister} />)}
            </div>
          </section>
        )}

        {contests.length === 0 && (
          <div className="text-center py-16 text-gray-400">No contests available.</div>
        )}
      </div>
    </div>
  );
}
