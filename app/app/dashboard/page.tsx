export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Overview
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards Placeholders */}
        <MetricCard title="Total Projects" value="12" />
        <MetricCard title="Active Tasks" value="45" />
        <MetricCard title="Completed This Week" value="28" />
        <MetricCard title="Team Members" value="8" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-4">
            <div className="text-sm text-slate-500">Activity stream placeholder...</div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Upcoming Deadlines</h3>
          <div className="space-y-4">
            <div className="text-sm text-slate-500">Deadlines list placeholder...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
