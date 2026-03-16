import { lazy, Suspense } from 'react';

import {
  tableBodyRow,
  tableTable,
  tableTd,
  tableTh,
  tableThead,
} from '@/components/Table/tableConstants';
import { Badge, getActivityStatusBadgeVariant } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const LazyBarChart = lazy(() =>
  import('@/components/shared/DashboardBarChart').then((m) => ({
    default: m.default,
  }))
);

// Dummy data for demonstration
const recentChanges = [
  {
    id: 'PSFS-113714',
    title: 'Indigenous learners funding',
    status: 'Changed',
  },
  { id: 'TACS-116305', title: 'Museum Conversations', status: 'Reviewed' },
];

const filteredData = [
  { id: 'HLTH-116081', title: 'Pharmacy Month', category: 'Event' },
  { id: 'MOTI-112502', title: 'Bridge Project', category: 'Release' },
];

const stats = [
  { label: 'Total Entries', value: 120 },
  { label: 'Reviewed', value: 80 },
  { label: 'Changed', value: 25 },
  { label: 'Deleted', value: 15 },
];

const graphData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [
    {
      label: 'Entries',
      data: [30, 45, 28, 17],
      backgroundColor: '#0078d4',
    },
  ],
};

export const Dashboard = () => (
  <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
    {/* Section 1: Stats */}
    <Card>
      <CardHeader>
        <CardTitle>Application Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Section 2: Recent Changes */}
    <Card>
      <CardHeader>
        <CardTitle>Recent Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <table className={tableTable}>
          <thead className={tableThead}>
            <tr>
              <th className={tableTh}>ID</th>
              <th className={tableTh}>Title</th>
              <th className={tableTh}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentChanges.map((change) => (
              <tr key={change.id} className={tableBodyRow}>
                <td className={tableTd}>{change.id}</td>
                <td className={tableTd}>{change.title}</td>
                <td className={tableTd}>
                  <Badge variant={getActivityStatusBadgeVariant(change.status)}>
                    {change.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>

    {/* Section 3: Filtered Data */}
    <Card>
      <CardHeader>
        <CardTitle>Filtered Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <table className={tableTable}>
          <thead className={tableThead}>
            <tr>
              <th className={tableTh}>ID</th>
              <th className={tableTh}>Title</th>
              <th className={tableTh}>Category</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry) => (
              <tr key={entry.id} className={tableBodyRow}>
                <td className={tableTd}>{entry.id}</td>
                <td className={tableTd}>{entry.title}</td>
                <td className={tableTd}>{entry.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>

    {/* Section 4: Graph - chart.js + react-chartjs-2 loaded on demand */}
    <Card>
      <CardHeader>
        <CardTitle>Entries Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <Suspense
            fallback={
              <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
                Loading chart...
              </div>
            }
          >
            <LazyBarChart
              data={graphData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
              }}
            />
          </Suspense>
        </div>
      </CardContent>
    </Card>

    {/* Section 5: Custom Filter */}
    <Card>
      <CardHeader>
        <CardTitle>Quick Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <Input type="text" placeholder="Search by title..." />
      </CardContent>
    </Card>
  </div>
);
