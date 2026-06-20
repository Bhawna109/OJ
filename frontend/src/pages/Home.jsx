import { Link } from 'react-router-dom';

const features = [
  { icon: '⚡', title: 'Fast Execution', desc: 'Run C++ code in milliseconds with real-time output.' },
  { icon: '🤖', title: 'AI Code Review', desc: 'Get instant AI-powered feedback on your code quality.' },
  { icon: '🏆', title: 'Contests', desc: 'Compete with others in timed programming contests.' },
  { icon: '📊', title: 'Leaderboard', desc: 'Track your rank and see how you compare globally.' },
];

const stats = [
  { value: '500+', label: 'Problems' },
  { value: '10K+', label: 'Users' },
  { value: '50+', label: 'Contests' },
  { value: '1M+', label: 'Submissions' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-24 px-6 text-center">
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
          BhawnaOJ Online Judge
        </h1>
        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
          Practice coding, compete in contests, and level up your problem-solving skills — all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/problems"
            className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Start Solving
          </Link>
          <Link
            to="/register"
            className="border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white hover:text-indigo-600 transition-colors"
          >
            Join Now
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-indigo-600">{value}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Why BhawnaOJ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        <p className="text-indigo-100 mb-6">Join thousands of developers improving their skills every day.</p>
        <Link
          to="/register"
          className="bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          Create Free Account
        </Link>
      </section>
    </div>
  );
}
