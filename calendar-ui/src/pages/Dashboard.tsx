import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@fluentui/react-components';
import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import React from 'react';
// You can use a chart library like recharts or chart.js for graphs
import { Bar } from 'react-chartjs-2';

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

Chart.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export const Dashboard = () => (
  <div
    style={{
      display: 'grid',
      gap: '24px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      padding: '32px',
    }}
  >
    {/* Section 1: Stats */}
    <Card>
      <h3>Application Stats</h3>
      <div style={{ display: 'flex', gap: '16px' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {stat.value}
            </div>
            <div>{stat.label}</div>
          </div>
        ))}
      </div>
    </Card>

    {/* Section 2: Recent Changes */}
    <Card>
      <h3>Recent Changes</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentChanges.map((change) => (
            <TableRow key={change.id}>
              <TableCell>{change.id}</TableCell>
              <TableCell>{change.title}</TableCell>
              <TableCell>
                <Badge appearance="tint">{change.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>

    {/* Section 3: Filtered Data */}
    <Card>
      <h3>Filtered Entries</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>ID</TableHeaderCell>
            <TableHeaderCell>Title</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.id}</TableCell>
              <TableCell>{entry.title}</TableCell>
              <TableCell>{entry.category}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>

    {/* Section 4: Graph */}
    <Card>
      <h3>Entries Over Time</h3>
      <div style={{ height: '200px' }}>
        <Bar
          data={graphData}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
          }}
        />
      </div>
    </Card>

    {/* Section 5: Custom Filter */}
    <Card>
      <h3>Quick Filter</h3>
      <input
        type="text"
        placeholder="Search by title..."
        style={{ width: '100%', padding: '8px' }}
      />
      {/* You can add filter logic here */}
    </Card>
  </div>
);
