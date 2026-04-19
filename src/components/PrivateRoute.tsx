import { Redirect } from "wouter";
import { useAuth } from "@/lib/useAuthHook";

interface PrivateRouteProps {
  component: React.ComponentType;
  adminOnly?: boolean;
}

export default function PrivateRoute({ component: Component, adminOnly = false }: PrivateRouteProps) {
  const { user } = useAuth();

  if (!user) return <Redirect to="/login" />;
  if (adminOnly && user.role !== "admin") return <Redirect to="/" />;

  return <Component />;
}
