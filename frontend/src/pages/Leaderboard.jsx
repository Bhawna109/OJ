import { useState, useEffect } from 'react';
import axios from 'axios';

const badges = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/leaderboard`)
      .then(res => setLeaders(res.data))
      .catch(err => console.error('Failed to load leaderboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Loading leaderboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Leaderboard</h1>
        <p className="text-gray-500 mb-6">Ranked by problems solved</p>

        {leaders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center text-gray-400">
            No submissions yet. Be the first to solve a problem!
          </div>
        ) : (
          <>
            {/* Top 3 Cards */}
            {leaders.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {leaders.slice(0, 3).map((l, i) => (
                  <div key={l._id} className={`bg-white rounded-xl shadow-sm p-5 text-center ${i === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                    <div className="text-3xl mb-1">{badges[i]}</div>
                    <div className="font-bold text-gray-800">{l.user.firstName} {l.user.lastName}</div>
                    <div className="text-sm text-gray-500">{l.user.email}</div>
                    <div className="mt-3 text-2xl font-extrabold text-indigo-600">{l.solved}</div>
                    <div className="text-xs text-gray-400 mt-1">problems solved</div>
                  </div>
                ))}
              </div>
            )}

            {/* Full Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Rank</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">User</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Solved</th>
                    <th className="text-left px-6 py-3 text-gray-500 font-medium">Submissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leaders.map((l, i) => (
                    <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-500">
                        {badges[i] || `#${i + 1}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{l.user.firstName} {l.user.lastName}</div>
                        <div className="text-xs text-gray-400">{l.user.email}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600">{l.solved}</td>
                      <td className="px-6 py-4 text-gray-600">{l.totalSubmissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
