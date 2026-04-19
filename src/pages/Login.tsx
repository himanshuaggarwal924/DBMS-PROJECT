import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/useAuthHook";
import { Compass, ArrowRight } from "lucide-react";
import authBg from "@/assets/auth-bg.png";
import type { AxiosError } from "axios";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const loginMutation = useLoginUser();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginMutation.mutateAsync({ email, password });
      login(res.user, res.token);
      setLocation("/");
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        setError(axiosErr?.response?.data?.message || "Invalid credentials");
      } else {
        setError("Invalid credentials");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img src={authBg} alt="" loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-tr from-primary to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg text-white">
              <Compass className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Welcome Back</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Sign in to continue planning your trip</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
              <input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Sign In Button */}
            <button 
              type="submit" 
              disabled={loginMutation.isPending}
              className="w-full bg-primary hover:bg-blue-700 disabled:bg-primary/50 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:hover:shadow-md"
            >
              {loginMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Forgot Password & Sign Up */}
          <div className="mt-6 space-y-3 text-center">
            <Link href="/forgot-password" className="text-primary hover:text-blue-700 text-sm font-semibold transition-colors">
              Forgot your password?
            </Link>
            <p className="text-muted-foreground text-sm">
              Don't have an account? <Link href="/register" className="text-primary font-bold hover:text-blue-700">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
