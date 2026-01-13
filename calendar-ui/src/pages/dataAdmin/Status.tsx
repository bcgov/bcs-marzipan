import { useQuery } from '@tanstack/react-query';
import { fetchActivityStatuses } from '../../api/lookupsApi';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell,
  Spinner,
} from '@fluentui/react-components';
import { Link } from 'react-router-dom';
import { ChevronLeft24Regular } from '@fluentui/react-icons';

export const Status = () => {
  const {
    data: statuses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activityStatuses'],
    queryFn: fetchActivityStatuses,
  });

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          margin: '0 0 16px 0',
          fontSize: '24px',
          fontWeight: 400,
          color: '#666',
          letterSpacing: '0.5px',
        }}
      >
        STATUS
      </h1>

      <Link
        to="/administration"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          color: '#0078d4',
          textDecoration: 'none',
          marginBottom: '24px',
          fontSize: '14px',
        }}
      >
        <ChevronLeft24Regular style={{ marginRight: '4px' }} />
        Back to administration
      </Link>

      <div
        style={{ backgroundColor: '#fff', padding: '24px', marginTop: '16px' }}
      >
        {isLoading && <Spinner label="Loading statuses..." />}
        {error && <div style={{ color: 'red' }}>Error loading statuses</div>}
        {statuses && statuses.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Display Name</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell>{status.id}</TableCell>
                  <TableCell>{status.name}</TableCell>
                  <TableCell>{status.displayName || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {statuses && statuses.length === 0 && <div>No statuses found</div>}
      </div>
    </div>
  );
};
