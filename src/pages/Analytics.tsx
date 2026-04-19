import { BarChart3, Lock, MapPin, Star, TrendingUp, Users } from "lucide-react";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/useAuthHook";

function StatCard({
  icon,
  label,
  value,
  color = "text-primary",
  bg = "bg-primary/10",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex items-start gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg} ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-display font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: { day: string | Date; activeUsers: number }[] }) {
  const max = Math.max(...data.map((d) => d.activeUsers), 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => {
        const height = Math.max((d.activeUsers / max) * 100, 2);
        const date = typeof d.day === "string" ? d.day : d.day.toISOString().split("T")[0];
        const dayLabel = new Date(date + "T00:00:00").toLocaleDateString("en", { weekday: "short" });
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold text-primary">{d.activeUsers > 0 ? d.activeUsers : ""}</span>
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${height}%`,
                background: d.activeUsers > 0
                  ? "linear-gradient(to top, hsl(200 98% 39%), hsl(200 98% 55%))"
                  : "hsl(210 40% 92%)",
              }}
            />
            <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryPill({ category }: { category: string }) {
  const map: Record<string, string> = {
    Hotel: "badge-hotel",
    Restaurant: "badge-restaurant",
    Attraction: "badge-attraction",
  };
  return (
    <span className={`badge ${map[category] ?? "badge-primary"}`}>
      {category}
    </span>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const dashboardQuery = useGetAdminDashboard({ enabled: user?.role === "admin" });

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background py-10">
        <div className="mx-auto max-w-md rounded-4xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {!user ? "Sign in required" : "Admin only"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {!user
              ? "Please sign in to access the admin dashboard."
              : "This dashboard is protected by JWT role checks. Only accounts with role = 'admin' can view it."}
          </p>
        </div>
      </div>
    );
  }

  const dashboard = dashboardQuery.data;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 rounded-4xl border border-border bg-card p-8 shadow-sm">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
            <BarChart3 className="h-4 w-4 text-primary" />
            Admin dashboard
          </p>
          <h1 className="text-4xl font-display font-bold text-foreground">Platform Overview</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Real-time platform metrics: total counts, most popular city searches, most saved
            place, 7-day user activity powered by a recursive CTE, and city-level stats.
          </p>
        </div>

        {dashboardQuery.isLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 skeleton rounded-3xl" />
            ))}
          </div>
        ) : dashboardQuery.isError || !dashboard ? (
          <div className="rounded-4xl border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="font-semibold">Dashboard data could not be loaded.</p>
            <p className="mt-1 text-sm">Check that your account has the admin role and the backend is running.</p>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid gap-5 md:grid-cols-3">
              <StatCard
                icon={<Users className="h-6 w-6" />}
                label="Total registered users"
                value={dashboard.summary.totalUsers}
                color="text-primary"
                bg="bg-primary/10"
              />
              <StatCard
                icon={<MapPin className="h-6 w-6" />}
                label="Cities in the cache"
                value={dashboard.summary.totalCities}
                color="text-accent"
                bg="bg-accent/10"
              />
              <StatCard
                icon={<BarChart3 className="h-6 w-6" />}
                label="Total cached places"
                value={dashboard.summary.totalPlaces}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
            </div>

            {/* Highlights + 7-day activity */}
            <div className="mt-6 grid gap-6 xl:grid-cols-2">

              {/* Highlights */}
              <section className="rounded-4xl border border-border bg-card p-8 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-display font-bold text-foreground">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Platform Highlights
                </h2>
                <div className="space-y-4">
                  <div className="rounded-3xl border border-border bg-secondary/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Most searched city</p>
                    {dashboard.mostPopularCity ? (
                      <>
                        <p className="mt-2 text-2xl font-display font-bold text-foreground">
                          {dashboard.mostPopularCity.cityName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dashboard.mostPopularCity.searchCount} search{dashboard.mostPopularCity.searchCount !== 1 ? "es" : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-muted-foreground">No searches recorded yet</p>
                    )}
                  </div>

                  <div className="rounded-3xl border border-border bg-secondary/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Most saved place</p>
                    {dashboard.mostSavedPlace ? (
                      <>
                        <p className="mt-2 text-2xl font-display font-bold text-foreground">
                          {dashboard.mostSavedPlace.placeName}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          Saved {dashboard.mostSavedPlace.saveCount} time{dashboard.mostSavedPlace.saveCount !== 1 ? "s" : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-muted-foreground">No favorites recorded yet</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 7-day activity bar chart */}
              <section className="rounded-4xl border border-border bg-card p-8 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 text-xl font-display font-bold text-foreground">
                  <Users className="h-5 w-5 text-primary" />
                  User Activity — Last 7 Days
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Unique active users per day (searches + trips + favorites + reviews), built with a recursive CTE.
                </p>
                <MiniBarChart data={dashboard.userActivityLast7Days} />

                <div className="mt-6 grid grid-cols-7 gap-1.5">
                  {dashboard.userActivityLast7Days.map((d, i) => (
                    <div key={i} className="rounded-2xl bg-secondary/60 px-1 py-2 text-center">
                      <p className="text-base font-display font-bold text-foreground">{d.activeUsers}</p>
                      <p className="text-[10px] text-muted-foreground">users</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* City-wise stats table */}
            <section className="mt-6 rounded-4xl border border-border bg-card p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-display font-bold text-foreground">City-wise Statistics</h2>
              <div className="overflow-x-auto rounded-3xl border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>City</th>
                      <th>Cached places</th>
                      <th>Avg cost</th>
                      <th>Top category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.cityWiseStats.map((row, idx) => (
                      <tr key={row.cityId}>
                        <td className="text-muted-foreground">{idx + 1}</td>
                        <td className="font-semibold text-foreground">{row.cityName}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {row.totalPlaces}
                          </span>
                        </td>
                        <td className="text-foreground">
                          {row.averageCost > 0 ? `$${row.averageCost.toFixed(0)}` : "—"}
                        </td>
                        <td>
                          {row.mostCommonCategory && row.mostCommonCategory !== "N/A" ? (
                            <CategoryPill category={row.mostCommonCategory} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
