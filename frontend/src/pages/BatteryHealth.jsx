import BatteryHealthTracking from '../components/BatteryHealthTracking';

const BatteryHealth = () => {
  return (
    <div className="p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold">Battery Health Tracking</h1>
        <p className="text-gray-400 mt-2">Monitor your battery performance, swap history, and health trends.</p>
      </header>
      <BatteryHealthTracking />
    </div>
  );
};

export default BatteryHealth;