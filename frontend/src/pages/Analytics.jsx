import UsageAnalytics from '../components/UsageAnalytics';

const Analytics = () => {
  return (
    <div className="p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold">Usage Analytics</h1>
        <p className="text-gray-400 mt-2">Track your charging history, spending patterns, and usage trends.</p>
      </header>
      <UsageAnalytics />
    </div>
  );
};

export default Analytics;