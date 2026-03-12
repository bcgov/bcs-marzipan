import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

Chart.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export interface DashboardBarChartProps {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
}

export default function DashboardBarChart({
  data,
  options,
}: DashboardBarChartProps) {
  return <Bar data={data} options={options} />;
}
