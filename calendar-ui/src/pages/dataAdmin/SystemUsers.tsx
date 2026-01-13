import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '../../api/lookupsApi';
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

export const SystemUsers = () => {
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['systemUsers'],
    queryFn: () => fetchUsers(),
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
        SYSTEM USERS
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
        {isLoading && <Spinner label="Loading system users..." />}
        {error && (
          <div style={{ color: 'red' }}>Error loading system users</div>
        )}
        {users && users.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Username</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.name || user.label}</TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {users && users.length === 0 && <div>No system users found</div>}
      </div>
    </div>
  );
};
