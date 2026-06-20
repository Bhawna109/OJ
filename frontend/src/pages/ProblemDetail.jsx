import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import ReactMarkdown from 'react-markdown';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'Python', value: 'py' },
];

const defaultCode = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your solution here
    }
}`,
  py: `# Write your solution here
`,
};

const difficultyColor = {
  Easy: 'text-green-600 bg-green-50',
  Medium: 'text-yellow-600 bg-yellow-50',
  Hard: 'text-red-600 bg-red-50',
};

const statusColor = {
  'Accepted': 'text-green-700 bg-green-100',
  'Wrong Answer': 'text-red-700 bg-red-100',
  'Compilation Error': 'text-orange-700 bg-orange-100',
  'Runtime Error': 'text-orange-700 bg-orange-100',
};

export default function ProblemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const storageKey = `code_${id}`;
  const savedLang = localStorage.getItem(`${storageKey}_lang`) || 'cpp';
  const savedCode = localStorage.getItem(storageKey) || defaultCode[savedLang];

  const [language, setLanguage] = useState(savedLang);
  const [code, setCode] = useState(savedCode);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState('output');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/problems/${id}`)
      .then(res => setProblem(res.data))
      .catch(() => setProblem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCodeChange = (val) => {
    setCode(val);
    localStorage.setItem(storageKey, val);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    localStorage.setItem(`${storageKey}_lang`, lang);
    const saved = localStorage.getItem(`${storageKey}_${lang}`);
    const newCode = saved || defaultCode[lang];
    setCode(newCode);
    localStorage.setItem(storageKey, newCode);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('output');
    setSubmitResult(null);
    try {
      const { data } = await axios.post(import.meta.env.VITE_BACKEND_URL, { language, code, input });
      setOutput(data.output || '(no output)');
    } catch (error) {
      setOutput('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setActiveTab('output');
      setOutput('Please login or register to submit your solution and track your progress.');
      return;
    }
    setIsSubmitting(true);
    setActiveTab('output');
    setSubmitResult(null);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/submit`,
        { problemId: id, code, language },
        { withCredentials: true }
      );
      setSubmitResult(data);
      setOutput('');
    } catch (error) {
      setOutput('Submit error: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiReview = async () => {
    if (!user) {
      setActiveTab('ai');
      setAiReview('Please login or register to use AI code review.');
      return;
    }
    setIsReviewing(true);
    setActiveTab('ai');
    try {
      const { data } = await axios.post(import.meta.env.VITE_GOOGLE_GEMINI_API_URL, { code });
      setAiReview(data.aiReview);
    } catch (error) {
      setAiReview('Error: ' + error.message);
    } finally {
      setIsReviewing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Loading problem...</div>;
  }

  if (!problem) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Problem not found.</div>;
  }

  const problemMarkdown = `${problem.statement}

**Input Format:**
${problem.inputFormat}

**Output Format:**
${problem.outputFormat}

**Constraints:**
${problem.constraints}`;

  return (
    <div className="h-[calc(100vh-56px)] flex overflow-hidden bg-gray-50">
      {/* Left: Problem Description */}
      <div className="w-2/5 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">{problem.title}</h1>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          {problem.tags?.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {problem.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none text-gray-700">
          <ReactMarkdown>{problemMarkdown}</ReactMarkdown>
        </div>
      </div>

      {/* Right: Editor + I/O */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-gray-900">
          <Editor
            value={code}
            onValueChange={handleCodeChange}
            highlight={(code) => highlight(code, languages.clike)}
            padding={16}
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: 13,
              minHeight: '100%',
              color: '#e5e7eb',
              backgroundColor: '#111827',
            }}
          />
        </div>

        {/* Bottom Panel */}
        <div className="h-56 border-t border-gray-200 bg-white flex flex-col">
          <div className="flex items-center gap-4 px-4 pt-3 border-b border-gray-100">
            <button onClick={() => setActiveTab('input')}
              className={`text-sm pb-2 font-medium border-b-2 transition-colors ${activeTab === 'input' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500'}`}>
              Input
            </button>
            <button onClick={() => setActiveTab('output')}
              className={`text-sm pb-2 font-medium border-b-2 transition-colors ${activeTab === 'output' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500'}`}>
              Output
            </button>
            <button onClick={() => setActiveTab('ai')}
              className={`text-sm pb-2 font-medium border-b-2 transition-colors ${activeTab === 'ai' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500'}`}>
              AI Review
            </button>

            <div className="ml-auto flex items-center gap-2">
              <select
                value={language}
                onChange={handleLanguageChange}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <button onClick={handleRun} disabled={isRunning}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                {isRunning ? 'Running...' : 'Run'}
              </button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="bg-blue-900 hover:bg-blue-800 disabled:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              <button onClick={handleAiReview} disabled={isReviewing}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                {isReviewing ? 'Reviewing...' : 'AI Review'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-sm font-mono">
            {activeTab === 'input' && (
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input..."
                className="w-full h-full resize-none focus:outline-none text-gray-700 text-sm" />
            )}
            {activeTab === 'output' && (
              <>
                {submitResult ? (
                  <div className="space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${statusColor[submitResult.status] || 'text-gray-700 bg-gray-100'}`}>
                      {submitResult.status === 'Accepted' ? '✓' : '✗'} {submitResult.status}
                    </div>
                    {submitResult.failedTestCase && (
                      <div className="text-xs space-y-1.5 mt-2">
                        <div className="text-gray-500 font-medium">Failed on Test Case #{submitResult.failedTestCase.index}</div>
                        <div className="bg-gray-50 rounded p-2">
                          <span className="text-gray-400">Input:</span>
                          <pre className="text-gray-700 mt-0.5">{submitResult.failedTestCase.input}</pre>
                        </div>
                        <div className="bg-green-50 rounded p-2">
                          <span className="text-gray-400">Expected:</span>
                          <pre className="text-green-700 mt-0.5">{submitResult.failedTestCase.expected}</pre>
                        </div>
                        <div className="bg-red-50 rounded p-2">
                          <span className="text-gray-400">Your Output:</span>
                          <pre className="text-red-700 mt-0.5">{submitResult.failedTestCase.got || '(empty)'}</pre>
                        </div>
                      </div>
                    )}
                    {submitResult.status === 'Accepted' && (
                      <div className="text-xs text-green-600 mt-1">All test cases passed!</div>
                    )}
                  </div>
                ) : (
                  <pre className="text-gray-800 whitespace-pre-wrap">{output || 'Run your code to see output...'}</pre>
                )}
              </>
            )}
            {activeTab === 'ai' && (
              <div className="prose prose-sm max-w-none overflow-y-auto">
                {aiReview ? <ReactMarkdown>{aiReview}</ReactMarkdown> : 'Click AI Review to get feedback on your code.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
