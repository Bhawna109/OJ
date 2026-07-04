import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;
const blank = { title: '', description: '', startTime: '', endTime: '' };

function statusLabel(c) {
  const now = Date.now();
  if (now < new Date(c.startTime)) return { label: 'Upcoming', color: '#1d4ed8' };
  if (now > new Date(c.endTime)) return { label: 'Ended', color: '#6b7280' };
  return { label: 'Live', color: '#16a34a' };
}

export default function AdminContests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
    else fetchContests();
  }, [user]);

  const fetchContests = async () => {
    const { data } = await axios.get(`${API}/contests`, { withCredentials: true });
    setContests(data);
  };

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      await axios.post(`${API}/contests`, form, { withCredentials: true });
      await fetchContests();
      setShowForm(false);
      setForm(blank);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create contest');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Contests</h1>
            <p className="text-gray-500 text-sm">{contests.length} contests total</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            className="bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800"
          >
            + Create Contest
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="font-semibold text-gray-800 mb-4">New Contest</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.title}
                  onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="Weekly Contest #1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  value={form.description}
                  onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  placeholder="Contest description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={form.startTime}
                    onChange={e => setForm(f => ({...f, startTime: e.target.value}))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">End Time</label>
                  <input
                    type="datetime-local"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={form.endTime}
                    onChange={e => setForm(f => ({...f, endTime: e.target.value}))}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Contest'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm(blank); }}
                  className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Start</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">End</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Registered</th>
              </tr>
            </thead>
            <tbody>
              {contests.map(c => {
                const { label, color } = statusLabel(c);
                return (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                    <td className="px-4 py-3">
                      <span style={{ color }} className="font-medium">{label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.startTime).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.endTime).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{c.registrations?.length || 0}</td>
                  </tr>
                );
              })}
              {contests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No contests yet. Click + Create Contest to add one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
