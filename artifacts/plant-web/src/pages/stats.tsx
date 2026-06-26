import { Layout } from "@/components/layout";
import { useGetStats, useGetActivity, getGetStatsQueryKey, getGetActivityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Droplet, Sprout, Flame, Calendar, BookOpen, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

export default function Stats() {
  const { data: stats, isLoading: isStatsLoading } = useGetStats({
    query: { queryKey: getGetStatsQueryKey() }
  });
  
  const { data: activity, isLoading: isActivityLoading } = useGetActivity({
    query: { queryKey: getGetActivityQueryKey() }
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-serif tracking-tight font-medium text-foreground mb-2">Garden Overview</h1>
          <p className="text-muted-foreground">Track your plant care habits and garden health over time.</p>
        </div>

        {isStatsLoading || !stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><Sprout className="w-4 h-4" /></div>
                  <p className="text-sm font-medium text-muted-foreground">Total Plants</p>
                </div>
                <p className="text-3xl font-serif font-medium">{stats.totalPlants}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Droplet className="w-4 h-4" /></div>
                  <p className="text-sm font-medium text-muted-foreground">Watered this week</p>
                </div>
                <p className="text-3xl font-serif font-medium">{stats.wateredThisWeek}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Flame className="w-4 h-4" /></div>
                  <p className="text-sm font-medium text-muted-foreground">Care Streak</p>
                </div>
                <p className="text-3xl font-serif font-medium">{stats.careStreak} <span className="text-sm text-muted-foreground font-sans font-normal">days</span></p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><BookOpen className="w-4 h-4" /></div>
                  <p className="text-sm font-medium text-muted-foreground">Journal Entries</p>
                </div>
                <p className="text-3xl font-serif font-medium">{stats.totalLogs}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-serif font-medium">Health Breakdown</h2>
            
            {isStatsLoading || !stats ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-green-700 dark:text-green-400">Healthy</span>
                        <span className="text-muted-foreground">{stats.healthyCount} plants</span>
                      </div>
                      <Progress 
                        value={stats.totalPlants > 0 ? (stats.healthyCount / stats.totalPlants) * 100 : 0} 
                        className="h-2 bg-secondary" 
                        indicatorClassName="bg-green-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-amber-600 dark:text-amber-400">Due Soon</span>
                        <span className="text-muted-foreground">{stats.dueSoonCount} plants</span>
                      </div>
                      <Progress 
                        value={stats.totalPlants > 0 ? (stats.dueSoonCount / stats.totalPlants) * 100 : 0} 
                        className="h-2 bg-secondary"
                        indicatorClassName="bg-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-red-600 dark:text-red-400">Overdue</span>
                        <span className="text-muted-foreground">{stats.overdueCount} plants</span>
                      </div>
                      <Progress 
                        value={stats.totalPlants > 0 ? (stats.overdueCount / stats.totalPlants) * 100 : 0} 
                        className="h-2 bg-secondary"
                        indicatorClassName="bg-red-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-medium">Recent Activity</h2>
            
            {isActivityLoading || !activity ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : activity.length === 0 ? (
              <div className="text-center py-12 bg-card/30 rounded-xl border border-dashed border-border/50">
                <p className="text-muted-foreground text-sm">No recent activity.</p>
              </div>
            ) : (
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <div className="divide-y divide-border/50">
                  {activity.map((item) => (
                    <Link key={item.id} href={`/plants/${item.plantId}`} className="block p-4 hover:bg-muted/50 transition-colors group">
                      <div className="flex gap-4">
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === 'watered' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {item.type === 'watered' ? <Droplet className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.type === 'watered' ? 'Watered' : 'Journal Entry'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.plantName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 self-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
