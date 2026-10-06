import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from 'react-simple-code-editor';
import ReactMarkdown from 'react-markdown';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL.replace('/api', '');

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
  'Time Limit Exceeded': 'text-yellow-700 bg-yellow-100',
  'Memory Limit Exceeded': 'text-purple-700 bg-purple-100',
};

export default function ProblemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  const storageKey = `code_${id}`;
  const savedLang = localStorage.getItem(`${storageKey}_lang`) || 'cpp';
  const savedCode = localStorage.getItem(`${storageKey}_${savedLang}`) || defaultCode[savedLang];

  const [language, setLanguage] = useState(savedLang);
  const [code, setCode] = useState(savedCode);
  const [input, setInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [output, setOutput] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [submitResult, setSubmitResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState('testcases');
  const [leftWidth, setLeftWidth] = useState(40);
  const isDragging = useRef(false);

  const handleMouseDown = () => { isDragging.current = true; };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    const pct = (e.clientX / window.innerWidth) * 100;
    if (pct > 20 && pct < 80) setLeftWidth(pct);
  }, []);

  const handleMouseUp = () => { isDragging.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/problems/${id}`)
      .then(res => {
        setProblem(res.data);
        if (res.data.sampleInput) {
          setInput(res.data.sampleInput);
          setSampleInput(res.data.sampleInput);
        }
      })
      .catch(() => setProblem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCodeChange = (val) => {
    setCode(val);
    localStorage.setItem(`${storageKey}_${language}`, val);
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    localStorage.setItem(`${storageKey}_${language}`, code);
    setLanguage(lang);
    localStorage.setItem(`${storageKey}_lang`, lang);
    const saved = localStorage.getItem(`${storageKey}_${lang}`);
    setCode(saved || defaultCode[lang]);
  };

  const handleResetCode = () => {
    setCode(defaultCode[language]);
    localStorage.removeItem(`${storageKey}_${language}`);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setActiveTab('result');
    setSubmitResult(null);
    try {
      const { data } = await axios.post(import.meta.env.VITE_BACKEND_URL, { language, code, input });
      let out = data.output || '(no output)';
      // If the program tried to read input but the Custom Input box was empty,
      // the raw EOF error is confusing — point the user to where they add input.
      const readEmptyStdin = !input.trim() &&
        /EOFError|NoSuchElementException|No line found|EOF when reading|InputMismatchException/.test(out);
      if (readEmptyStdin) {
        out += '\n\n⚠️ Your program is waiting for input, but the Custom Input box is empty.\n' +
               'Open the "Test Cases" tab, type your input under "Custom Input", then click Run again.';
      }
      setOutput(out);
    } catch (error) {
      setOutput('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setActiveTab('result');
      setOutput('Please login or register to submit your solution and track your progress.');
      return;
    }
    setIsSubmitting(true);
    setActiveTab('result');
    setSubmitResult(null);
    setOutput('');
    try {
      // Submit returns immediately with a Pending submission; the worker judges
      // it asynchronously. A WebSocket pushes the result the instant it's ready,
      // with polling as a fallback in case the socket can't connect.
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/submit`,
        { problemId: id, code, language },
        { withCredentials: true }
      );
      const submissionId = data.submissionId;

      let settled = false;
      let socket = null;
      const finish = (sub) => {
        if (settled) return;
        settled = true;
        setSubmitResult({
          _id: sub._id || sub.submissionId,
          status: sub.status,
          language: sub.language,
          compilationTime: sub.compilationTime,
          createdAt: sub.createdAt,
          failedTestCase: sub.failedTestCase,
          compilerOutput: sub.compilerOutput !== undefined
            ? sub.compilerOutput
            : (['Compilation Error', 'Runtime Error'].includes(sub.status) ? sub.output : undefined),
        });
        setIsSubmitting(false);
        if (socket) socket.disconnect();
      };

      // Primary: WebSocket push
      socket = io(SOCKET_URL, { withCredentials: true });
      socket.on('connect', () => socket.emit('subscribe', submissionId));
      socket.on('result', (sub) => {
        if (sub && sub.status && sub.status !== 'Pending') finish(sub);
      });

      // Fallback: poll every 3s (also covers rare infra failures the socket won't push)
      const poll = async (attempts = 0) => {
        if (settled) return;
        if (attempts > 40) {
          if (!settled) { setOutput('Judging is taking longer than expected. Check "Submissions" in a moment.'); setIsSubmitting(false); if (socket) socket.disconnect(); }
          return;
        }
        try {
          const { data: sub } = await axios.get(
            `${import.meta.env.VITE_API_URL}/submissions/${submissionId}`,
            { withCredentials: true }
          );
          if (sub.status !== 'Pending') { finish(sub); return; }
        } catch { /* keep polling */ }
        setTimeout(() => poll(attempts + 1), 3000);
      };
      setTimeout(() => poll(), 3000);
    } catch (error) {
      setOutput('Submit error: ' + (error.response?.data?.error || error.message));
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
    <div className="h-[calc(100vh-56px)] flex overflow-hidden bg-gray-50" style={{ userSelect: isDragging.current ? 'none' : 'auto' }}>
      {/* Left: Problem Description */}
      <div style={{ width: `${leftWidth}%` }} className="border-r border-gray-200 bg-white flex flex-col overflow-hidden">
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
          {problem.sampleInput && (
            <div className="not-prose mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sample Test Case</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Input</p>
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-800 whitespace-pre-wrap">{problem.sampleInput}</pre>
                </div>
                {problem.sampleOutput && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Expected Output</p>
                    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-800 whitespace-pre-wrap">{problem.sampleOutput}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1 bg-gray-200 hover:bg-blue-900 cursor-col-resize transition-colors"
      />

      {/* Right: Editor + I/O */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-gray-900 relative">
          <Editor
            value={code}
            onValueChange={handleCodeChange}
            highlight={(code) => highlight(code, language === 'py' ? languages.python : language === 'java' ? languages.java : languages.cpp)}
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
        <div className="h-72 border-t border-gray-200 bg-white flex flex-col">
          <div className="flex items-center gap-4 px-4 pt-2 border-b border-gray-100">
            <button onClick={() => setActiveTab('testcases')}
              className={`text-sm pb-2 font-medium border-b-2 transition-colors ${activeTab === 'testcases' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500'}`}>
              Test Cases
            </button>
            <button onClick={() => setActiveTab('result')}
              className={`text-sm pb-2 font-medium border-b-2 transition-colors ${activeTab === 'result' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500'}`}>
              Result
            </button>
            <button onClick={() => setActiveTab('ai')}
              className={`text-sm pb-2 font-medium border-b-2 transition-colors ${activeTab === 'ai' ? 'border-blue-900 text-blue-900' : 'border-transparent text-gray-500'}`}>
              AI Review
            </button>

            <div className="ml-auto flex items-center gap-2">
              <select value={language} onChange={handleLanguageChange}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-900">
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <button onClick={handleResetCode}
                className="text-sm border border-gray-300 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                title="Reset to default template">
                Reset
              </button>
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

          <div className="flex-1 overflow-y-auto p-3 text-sm">
            {activeTab === 'testcases' && (
              <div className="flex flex-col h-full gap-2">
                {problem.sampleInput && (
                  <div className="border border-gray-100 rounded-lg p-2 bg-gray-50">
                    <div className="text-xs font-medium text-gray-500 mb-1.5">Sample Test Case</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">Input</div>
                        <pre className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-14 overflow-y-auto">{problem.sampleInput}</pre>
                      </div>
                      {problem.sampleOutput && (
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Expected Output</div>
                          <pre className="bg-white border border-gray-200 rounded px-2 py-1 text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-14 overflow-y-auto">{problem.sampleOutput}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="text-xs font-medium text-gray-500 mb-1">Custom Input</div>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter custom input here..."
                    className="flex-1 resize-none focus:outline-none text-gray-700 text-sm font-mono bg-gray-50 border border-gray-100 rounded p-2" />
                </div>
              </div>
            )}
            {activeTab === 'result' && (
              <div className="font-mono">
                {submitResult ? (
                  <div className="space-y-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${statusColor[submitResult.status] || 'text-gray-700 bg-gray-100'}`}>
                      {submitResult.status === 'Accepted' ? '✓' : '✗'} {submitResult.status}
                    </div>
                    {submitResult.compilationTime && (
                      <div className="text-xs text-gray-400">Time: {submitResult.compilationTime}ms</div>
                    )}
                    {submitResult.compilerOutput && (
                      <div className="mt-2 bg-orange-50 rounded p-3 text-xs">
                        <div className="text-orange-700 font-medium mb-1">Compiler Output:</div>
                        <pre className="text-orange-800 whitespace-pre-wrap font-mono">{submitResult.compilerOutput}</pre>
                      </div>
                    )}
                    {submitResult.failedTestCase && !submitResult.compilerOutput && (
                      <div className="text-xs space-y-1.5 mt-2">
                        <div className="text-gray-500 font-medium">Failed on Test Case #{submitResult.failedTestCase.index}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-red-50 rounded p-2">
                            <span className="text-gray-400 block mb-0.5">Your Output:</span>
                            <pre className="text-red-700">{submitResult.failedTestCase.got || '(empty)'}</pre>
                          </div>
                          <div className="bg-green-50 rounded p-2">
                            <span className="text-gray-400 block mb-0.5">Expected:</span>
                            <pre className="text-green-700">{submitResult.failedTestCase.expected}</pre>
                          </div>
                        </div>
                      </div>
                    )}
                    {submitResult.status === 'Accepted' && (
                      <div className="text-xs text-green-600 mt-1">All test cases passed!</div>
                    )}
                  </div>
                ) : isSubmitting ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-blue-900 bg-blue-100">
                    <span className="animate-pulse">●</span> Judging your submission...
                  </div>
                ) : output ? (
                  <div className="space-y-2">
                    {problem.sampleOutput && input.trim() === (problem.sampleInput || '').trim() ? (
                      <>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${output.trim() === problem.sampleOutput.trim() ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                          {output.trim() === problem.sampleOutput.trim() ? '✓ Sample Passed' : '✗ Wrong Answer'}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                          <div className="bg-red-50 border border-red-100 rounded p-2">
                            <p className="text-gray-500 mb-0.5 font-medium">Your Output</p>
                            <pre className="font-mono whitespace-pre-wrap text-gray-800">{output.trim()}</pre>
                          </div>
                          <div className="bg-green-50 border border-green-100 rounded p-2">
                            <p className="text-gray-500 mb-0.5 font-medium">Expected Output</p>
                            <pre className="font-mono whitespace-pre-wrap text-green-800">{problem.sampleOutput.trim()}</pre>
                          </div>
                        </div>
                      </>
                    ) : (
                      <pre className="text-gray-800 whitespace-pre-wrap text-sm">{output}</pre>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Run your code to see output...</p>
                )}
              </div>
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
