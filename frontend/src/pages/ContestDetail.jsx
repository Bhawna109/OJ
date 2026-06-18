import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const statusStyle = {
  Live:     'bg-green-100 text-green-700',
  Upcoming: 'bg-blue-100 text-blue-700',
  Ended:    'bg-gray-100 text-gray-500',
};

const difficultyColor = {
  Easy:   'text-green-600 bg-green-50',
  Medium: 'text-yellow-600 bg-yellow-50',
  Hard:   'text-red-600 bg-red-50',
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

export default function ContestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);

  const endCountdown = useCountdown(contest?.endTime);
  const startCountdown = useCountdown(contest?.startTime);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get(`${import.meta.env.VITE_API_URL}/contests/${id}`, { withCredentials: true })
      .then(res => setContest(res.data))
      .catch(() => setContest(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading contest...</div>;
  if (!contest) return <div className="flex items-center justify-center min-h-screen text-gray-400">Contest not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[contest.status]}`}>
                  {contest.status === 'Live' ? '● Live' : contest.status}
                </span>
                {contest.status === 'Live' && endCountdown && (
                  <span className="text-sm text-red-500 font-mono font-semibold">Ends in {endCountdown}</span>
                )}
                {contest.status === 'Upcoming' && startCountdown && (
                  <span className="text-sm text-blue-500 font-mono font-semibold">Starts in {startCountdown}</span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{contest.title}</h1>
              {contest.description && <p className="text-gray-500 mt-1">{contest.description}</p>}
            </div>
            <Link to="/contests" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
              ← Back
            </Link>
          </div>

          <div className="flex gap-6 mt-4 text-sm text-gray-500">
            <span>Start: {new Date(contest.startTime).toLocaleString()}</span>
            <span>End: {new Date(contest.endTime).toLocaleString()}</span>
            <span>{contest.problems?.length || 0} Problems</span>
          </div>
        </div>

        {/* Problems */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Problems</h2>
          </div>

          {contest.status === 'Upcoming' ? (
            <div className="text-center py-16 text-gray-400">
              Problems will be visible when the contest starts.
            </div>
          ) : contest.problems?.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No problems added yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Title</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Difficulty</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Tags</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contest.problems.map((p, i) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-400 font-medium">{String.fromCharCode(65 + i)}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{p.title}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor[p.difficulty]}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {p.tags?.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/problems/${p._id}`}
                        className="bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Solve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
