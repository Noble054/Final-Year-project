import { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your username or email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must not exceed 100 characters')
});

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setError('');
    try {
      const userData = await login(data.identifier, data.password);
      if (userData.role === 'Admin') navigate('/admin');
      else if (userData.role === 'Station Operator') navigate('/operator');
      else navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-fade-in">
      {/* Decorative gradient blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electricPurple/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 glass-panel p-10 relative z-10 animate-slide-up">
        <div>
          <div className="flex justify-center text-neonCyan animate-pulse-glow w-16 h-16 mx-auto rounded-full items-center bg-white/5 border border-white/10">
            <Zap size={32} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Welcome Back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to continue to ChargeMate
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {location.state?.registrationMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg">
              {location.state.registrationMessage}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <input
                type="text"
                className="input-field"
                placeholder="Username or email"
                autoComplete="username"
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-400">{errors.identifier.message}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                className="input-field"
                placeholder="Password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-neonCyan hover:text-white transition-colors font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
