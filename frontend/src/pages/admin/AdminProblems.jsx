import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;
const blank = { title: '', statement: '', inputFormat: '', outputFormat: '', constraints: '', difficulty: 'Easy', tags: '', sampleInput: '', sampleOutput: '' };
const diffColor = { Easy: '#16a34a', Medium: '#d97706', Hard: '#dc2626' };

export default function AdminProblems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [view, setView] = useState('list');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [testcases, setTestcases] = useState([]);
  const [tcForm, setTcForm] = useState({ input: '', expectedOutput: '', isSample: false });
  const [tcSaving, setTcSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
    else fetchProblems();
  }, [user]);

  const fetchProblems = async () => {
    const { data } = await axios.get(`${API}/problems`, { withCredentials: true });
    setProblems(data);
  };

  const openAdd = () => { setEditing(null); setForm(blank); setError(''); setView('form'); };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      title: p.title, statement: p.statement, inputFormat: p.inputFormat,
      outputFormat: p.outputFormat, constraints: p.constraints, difficulty: p.difficulty,
      tags: (p.tags || []).join(', '), sampleInput: p.sampleInput || '', sampleOutput: p.sampleOutput || '',
    });
    setError('');
    setView('form');
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editing) await axios.put(`${API}/problems/${editing._id}`, payload, { withCredentials: true });
      else await axios.post(`${API}/problems`, payload, { withCredentials: true });
      await fetchProblems();
      setView('list');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem and all its test cases?')) return;
    await axios.delete(`${API}/problems/${id}`, { withCredentials: true });
    fetchProblems();
  };

  const openTestCases = async (p) => {
    setSelectedProblem(p);
    const { data } = await axios.get(`${API}/testcases/${p._id}`, { withCredentials: true });
    setTestcases(data);
    setTcForm({ input: '', expectedOutput: '', isSample: false });
    setView('testcases');
  };

  const addTestCase = async () => {
    if (!tcForm.input || !tcForm.expectedOutput) return;
    setTcSaving(true);
    const { data } = await axios.post(`${API}/testcases`, { ...tcForm, problemId: selectedProblem._id }, { withCredentials: true });
    setTestcases(prev => [...prev, data]);
    setTcForm({ input: '', expectedOutput: '', isSample: false });
    setTcSaving(false);
  };

  const deleteTestCase = async (id) => {
    await axios.delete(`${API}/testcases/${id}`, { withCredentials: true });
    setTestcases(prev => prev.filter(tc => tc._id !== id));
  };

  if (view === 'form') return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setView('list')} className="text-blue-600 mb-4 text-sm hover:underline">← Back to Problems</button>
        <h1 className="text-2xl font-bold text-blue-900 mb-6">{editing ? 'Edit Problem' : 'Add Problem'}</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.difficulty} onChange={e => setForm(f => ({...f, difficulty: e.target.value}))}>
                <option>Easy</option><option>Medium</option><option>Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="Array, DP, Sorting" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Problem Statement</label>
            <textarea rows={6} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" value={form.statement} onChange={e => setForm(f => ({...f, statement: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Input Format</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.inputFormat} onChange={e => setForm(f => ({...f, inputFormat: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Output Format</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.outputFormat} onChange={e => setForm(f => ({...f, outputFormat: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.constraints} onChange={e => setForm(f => ({...f, constraints: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Input</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" value={form.sampleInput} onChange={e => setForm(f => ({...f, sampleInput: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sample Output</label>
              <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" value={form.sampleOutput} onChange={e => setForm(f => ({...f, sampleOutput: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving...' : (editing ? 'Update Problem' : 'Create Problem')}
            </button>
            <button onClick={() => setView('list')} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (view === 'testcases') return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => setView('list')} className="text-blue-600 mb-4 text-sm hover:underline">← Back to Problems</button>
        <h1 className="text-2xl font-bold text-blue-900 mb-1">Test Cases</h1>
        <p className="text-gray-500 text-sm mb-6">{selectedProblem?.title}</p>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Add Test Case</h2>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Input</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" value={tcForm.input} onChange={e => setTcForm(f => ({...f, input: e.target.value}))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Expected Output</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" value={tcForm.expectedOutput} onChange={e => setTcForm(f => ({...f, expectedOutput: e.target.value}))} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={tcForm.isSample} onChange={e => setTcForm(f => ({...f, isSample: e.target.checked}))} />
              Sample test case
            </label>
            <button onClick={addTestCase} disabled={tcSaving} className="bg-blue-900 text-white px-5 py-2 rounded-lg text-sm disabled:opacity-50">
              {tcSaving ? 'Adding...' : 'Add Test Case'}
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {testcases.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No test cases yet.</p>}
          {testcases.map((tc, i) => (
            <div key={tc._id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Test Case #{i + 1}</span>
                  {tc.isSample && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sample</span>}
                </div>
                <button onClick={() => deleteTestCase(tc._id)} className="text-red-500 hover:text-red-700 text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">Delete</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Input</p>
                  <pre className="text-xs bg-gray-50 p-2 rounded font-mono whitespace-pre-wrap border border-gray-100">{tc.input}</pre>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected Output</p>
                  <pre className="text-xs bg-gray-50 p-2 rounded font-mono whitespace-pre-wrap border border-gray-100">{tc.expectedOutput}</pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Problems</h1>
            <p className="text-gray-500 text-sm">{problems.length} problems total</p>
          </div>
          <button onClick={openAdd} className="bg-blue-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">+ Add Problem</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">#</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Difficulty</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Tags</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p, i) => (
                <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: diffColor[p.difficulty] }} className="font-medium">{p.difficulty}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(p.tags || []).join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openTestCases(p)} className="text-xs border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50 text-gray-600">Test Cases</button>
                      <button onClick={() => openEdit(p)} className="text-xs border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50 text-blue-700">Edit</button>
                      <button onClick={() => handleDelete(p._id)} className="text-xs border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 text-red-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {problems.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No problems yet. Click + Add Problem to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
