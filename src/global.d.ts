declare module "lucide-react" {
  import * as React from "react";
  export const Star: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const MapPin: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Heart: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Plus: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Map: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const User: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const UserIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Send: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Search: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Sparkles: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const TrendingUp: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Filter: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Compass: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const LogOut: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const BarChart3: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const ArrowUpRight: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Globe: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Calendar: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Navigation: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Frown: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Mail: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Lock: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const ArrowRight: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  export const Check: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

declare module "framer-motion" {
  import * as React from "react";
  namespace motion {
    const div: React.ComponentType<React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>>;
    const span: React.ComponentType<React.HTMLAttributes<HTMLSpanElement> & Record<string, unknown>>;
  }
  export const AnimatePresence: React.ComponentType<Record<string, unknown>>;
}

declare module "recharts" {
  export const BarChart: React.ComponentType<Record<string, unknown>>;
  export const Bar: React.ComponentType<Record<string, unknown>>;
  export const XAxis: React.ComponentType<Record<string, unknown>>;
  export const YAxis: React.ComponentType<Record<string, unknown>>;
  export const Tooltip: React.ComponentType<Record<string, unknown>>;
  export const ResponsiveContainer: React.ComponentType<Record<string, unknown>>;
  export const Cell: React.ComponentType<Record<string, unknown>>;
}

declare module "date-fns" {
  export function format(date: Date | number, formatString: string): string;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.webp";
declare module "*.svg";
