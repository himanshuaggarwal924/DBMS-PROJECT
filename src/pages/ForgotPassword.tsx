import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Compass, Mail, ArrowRight, Check } from "lucide-react";
import authBg from "@/assets/auth-bg.png";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      // Simulate API call - in production, this would send a reset link email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock validation - just check if email matches any pattern
      if (!email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      setSubmitted(true);
      // Auto-redirect after 5 seconds
      setTimeout(() => {
        setLocation("/login");
      }, 5000);
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      setError("Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img src={authBg} alt="" loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-linear-to-tr from-primary to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg text-white">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Reset Password</h1>
          <p className="text-muted-foreground mt-2">We'll send you a link to reset your password</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
              <p className="text-muted-foreground text-sm">
                We've sent a password reset link to <br/>
                <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">Didn't receive the email?</p>
              <ul className="text-left text-xs space-y-1 ml-4 list-disc">
                <li>Check your spam folder</li>
                <li>Make sure the email address is correct</li>
              </ul>
            </div>

            <p className="text-muted-foreground text-sm">
              Redirecting to login in a few seconds...
            </p>

            <Link href="/login" className="inline-block text-primary font-semibold hover:text-primary/80 transition-colors">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm mb-6 text-center font-medium">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full bg-secondary/70 border border-border/50 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="you@example.com" 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 ml-1">Enter the email address associated with your account</p>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:hover:shadow-lg disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                Remember your password? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
