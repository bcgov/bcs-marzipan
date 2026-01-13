import { useQuery } from '@tanstack/react-query';
import { fetchGovernmentRepresentatives } from '../../api/lookupsApi';
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

export const GovernmentRepresentatives = () => {
  const {
    data: representatives,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['governmentRepresentatives'],
    queryFn: fetchGovernmentRepresentatives,
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
        GOVERNMENT REPRESENTATIVES
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
        {isLoading && <Spinner label="Loading government representatives..." />}
        {error && (
          <div style={{ color: 'red' }}>
            Error loading government representatives
          </div>
        )}
        {representatives && representatives.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Display Name</TableHeaderCell>
                <TableHeaderCell>Title</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {representatives.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell>{rep.id}</TableCell>
                  <TableCell>{rep.name}</TableCell>
                  <TableCell>{rep.displayName || '-'}</TableCell>
                  <TableCell>{rep.title || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {representatives && representatives.length === 0 && (
          <div>No government representatives found</div>
        )}
      </div>
    </div>
  );
};
