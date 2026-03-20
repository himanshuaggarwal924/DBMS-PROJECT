import { useGetPopularCities } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3, TrendingUp, Globe } from "lucide-react";

export default function Analytics() {
  const { data: popularCities, isLoading } = useGetPopularCities();

  const chartData = popularCities?.slice(0, 8).map(city => ({
    name: city.name,
    searches: city.searchCount
  })) || [];

  return (
    <div className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold flex items-center gap-3">
            <BarChart3 className="text-primary w-10 h-10" /> Global Travel Trends
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Real-time insights from the WanderSync community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-linear-to-br from-primary to-blue-600 rounded-3xl p-8 text-white shadow-xl">
            <Globe className="w-10 h-10 mb-4 opacity-80" />
            <h3 className="text-lg font-medium opacity-90 mb-1">Most Trending Destination</h3>
            <p className="text-4xl font-display font-bold">{popularCities?.[0]?.name || "Loading..."}</p>
            <p className="mt-4 text-sm opacity-80">Based on recent search activity</p>
          </div>
          
          <div className="lg:col-span-2 bg-card rounded-3xl p-8 border border-border shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-accent"/> Search Volume by City
            </h3>
            <div className="h-72 w-full">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="searches" radius={[6, 6, 0, 0]}>
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(24 95% 53%)' : 'hsl(200 98% 39% / 0.8)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
