import React, { useState, useEffect } from "react";
import type { User } from "@workspace/api-client-react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("travel_user");
      const storedToken = localStorage.getItem("travel_token");
      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser({
          ...parsedUser,
          role: parsedUser.role || "user",
        });
        setToken(storedToken);
      }
    } catch (err) {
      console.error("Failed to parse stored auth", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (newUser: User, newToken: string) => {
    const normalizedUser = {
      ...newUser,
      role: newUser.role || "user",
    };
    setUser(normalizedUser);
    setToken(newToken);
    localStorage.setItem("travel_user", JSON.stringify(normalizedUser));
    localStorage.setItem("travel_token", newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("travel_user");
    localStorage.removeItem("travel_token");
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

