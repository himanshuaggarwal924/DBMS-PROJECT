import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegisterUser } from "@workspace/api-client-react";
import { Compass, ArrowRight } from "lucide-react";
import authBg from "@/assets/auth-bg.png";
import type { AxiosError } from "axios";

export default function Register() {
  const [, setLocation] = useLocation();
  const registerMutation = useRegisterUser();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await registerMutation.mutateAsync({ name, email, password });
      setLocation("/login");
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        setError(axiosErr?.response?.data?.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img src={authBg} alt="" loading="lazy" className="w-full h-full object-cover scale-x-[-1]" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-tr from-accent to-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg text-white">
              <Compass className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Create Account</h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Join WanderSync and start exploring</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all bg-white text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Email Address</label>
              <input 
                required 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all bg-white text-foreground placeholder:text-muted-foreground"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all bg-white text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Sign Up Button */}
            <button 
              type="submit" 
              disabled={registerMutation.isPending}
              className="w-full bg-accent hover:bg-yellow-500 disabled:bg-accent/50 text-white font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:hover:shadow-md mt-6"
            >
              {registerMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Sign Up <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account? <Link href="/login" className="text-accent font-bold hover:text-yellow-500 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
