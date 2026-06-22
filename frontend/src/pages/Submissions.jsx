import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const statusStyle = {
  'Accepted': 'text-green-600 bg-green-50',
  'Wrong Answer': 'text-red-600 bg-red-50',
  'Compilation Error': 'text-orange-600 bg-orange-50',
  'Runtime Error': 'text-orange-600 bg-orange-50',
  'Time Limit Exceeded': 'text-yellow-600 bg-yellow-50',
};

const langLabel = { cpp: 'C++', java: 'Java', py: 'Python' };

export default function Submissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    axios.get(`${import.meta.env.VITE_API_URL}/submissions`, { withCredentials: true })
      .then(res => setSubmissions(res.data))
      .catch(err => console.error('Failed to load submissions:', err))
      .finally(() => setLoading(false));
  }, [user]);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Submissions</h1>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              No submissions yet.{' '}
              <Link to="/problems" className="text-blue-900 hover:underline">Solve a problem</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Problem</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Language</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Time</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map((s, i) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/problems/${s.problemId?._id}`}
                        className="font-medium text-blue-900 hover:underline"
                      >
                        {s.problemId?.title || 'Unknown Problem'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{langLabel[s.language] || s.language}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[s.status] || 'text-gray-600 bg-gray-100'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{s.compilationTime ? `${s.compilationTime}ms` : '—'}</td>
                    <td className="px-6 py-4 text-gray-400">{timeAgo(s.createdAt)}</td>
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
