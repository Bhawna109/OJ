import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const statusStyle = {
  'Accepted': 'text-green-600 bg-green-50',
  'Wrong Answer': 'text-red-600 bg-red-50',
  'Compilation Error': 'text-orange-600 bg-orange-50',
  'Runtime Error': 'text-orange-600 bg-orange-50',
};

const langLabel = { cpp: 'C++', java: 'Java', py: 'Python' };

export default function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [submissions, setSubmissions] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' });

    axios.get(`${import.meta.env.VITE_API_URL}/submissions`, { withCredentials: true })
      .then(res => setSubmissions(res.data))
      .catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/profile/${user._id}`,
        form,
        { withCredentials: true }
      );
      login({ ...user, ...res.data });
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const solved = new Set(
    submissions.filter(s => s.status === 'Accepted').map(s => s.problemId?._id)
  ).size;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-900-600 flex items-center justify-center text-white text-2xl font-bold">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{user.firstName} {user.lastName}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-900-100 text-blue-900-700'}`}>
                  {user.role}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="text-sm border border-gray-300 px-4 py-1.5 rounded-lg hover:border-blue-900-400 hover:text-blue-900-600 transition-colors">
                  Edit Profile
                </button>
              )}
              <button onClick={handleLogout}
                className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-extrabold text-blue-900-600">{solved}</div>
              <div className="text-xs text-gray-500 mt-1">Problems Solved</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-extrabold text-blue-900-600">{submissions.length}</div>
              <div className="text-xs text-gray-500 mt-1">Total Submissions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-extrabold text-blue-900-600">
                {submissions.length > 0 ? Math.round((submissions.filter(s => s.status === 'Accepted').length / submissions.length) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Acceptance Rate</div>
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              {error && <div className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</div>}
              {success && <div className="text-green-600 text-sm bg-green-50 px-4 py-2 rounded-lg">{success}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-900-500" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving}
                  className="bg-blue-900-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-900-700 disabled:bg-blue-900-400 transition-colors">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => { setEditing(false); setError(''); }}
                  className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {success && !editing && (
            <div className="text-green-600 text-sm bg-green-50 px-4 py-2 rounded-lg">{success}</div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Recent Submissions</h2>
          </div>
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No submissions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Problem</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Language</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-6 py-3 text-gray-500 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.slice(0, 10).map(s => (
                  <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-blue-900-600">{s.problemId?.title || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{langLabel[s.language] || s.language}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[s.status] || 'text-gray-600 bg-gray-100'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{timeAgo(s.createdAt)}</td>
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
