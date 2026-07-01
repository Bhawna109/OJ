import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const difficultyColor = {
  Easy: 'text-green-600 bg-green-50',
  Medium: 'text-yellow-600 bg-yellow-50',
  Hard: 'text-red-600 bg-red-50',
};

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/problems`)
      .then(res => setProblems(res.data))
      .catch(err => console.error('Failed to load problems:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = problems.filter((p) => {
    const matchDifficulty = filter === 'All' || p.difficulty === filter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchDifficulty && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Problems</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900-500 w-full sm:w-72"
          />
          <div className="flex gap-2">
            {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
              <button
                key={d}
                onClick={() => setFilter(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === d
                    ? 'bg-blue-900 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:border-blue-900'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading problems...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">#</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Title</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Difficulty</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p, i) => (
                  <tr key={p._id} onClick={() => navigate(`/problems/${p._id}`)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-800 hover:text-blue-900 transition-colors">
                        {p.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor[p.difficulty]}`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {p.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">No problems found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
