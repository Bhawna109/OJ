import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Logo from '../components/Logo';

const features = [
  { icon: '⚡', title: 'Fast Execution', desc: 'Run C++, Java, and Python code in milliseconds with real-time output.' },
  { icon: '🤖', title: 'AI Code Review', desc: 'Get instant AI-powered feedback on your code quality and efficiency.' },
  { icon: '🏆', title: 'Contests', desc: 'Compete with others in timed programming contests.' },
  { icon: '📊', title: 'Leaderboard', desc: 'Track your rank and see how you compare globally.' },
];

export default function Home() {
  const [stats, setStats] = useState({ users: 0, submissions: 0, contests: 0 });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL.replace('/api', '')}/api/stats`)
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gray-100 pt-12 pb-0 px-6 text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
      </section>

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-6 text-center">
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Practice coding, compete in contests, and level up your problem-solving skills — all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/problems"
            className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Start Solving
          </Link>
          <Link
            to="/register"
            className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-blue-900 transition-colors"
          >
            Join Now
          </Link>
        </div>
      </section>

      {/* Description */}
      <section className="bg-white py-10 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            BhawnaOJ is a competitive programming platform where you can practice coding problems, submit solutions, get AI-powered code reviews, and compete in contests — built for developers who want to level up their skills.
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-extrabold text-blue-900">{stats.users}</div>
              <div className="text-sm text-gray-500 mt-1">Registered Users</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-blue-900">{stats.submissions}</div>
              <div className="text-sm text-gray-500 mt-1">Submissions Processed</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-blue-900">{stats.contests}</div>
              <div className="text-sm text-gray-500 mt-1">Contests Hosted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-blue-900 text-center mb-10">Why BhawnaOJ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow border border-gray-100">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-900 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        <p className="text-blue-100 mb-6">Join thousands of developers improving their skills every day.</p>
        <Link
          to="/register"
          className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Create Free Account
        </Link>
      </section>
    </div>
  );
}
