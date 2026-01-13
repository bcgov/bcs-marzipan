import { useQuery } from '@tanstack/react-query';
import { fetchTags } from '../../api/lookupsApi';
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

export const HQTags = () => {
  const {
    data: tags,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
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
        HQ TAGS
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
        {isLoading && <Spinner label="Loading HQ tags..." />}
        {error && <div style={{ color: 'red' }}>Error loading HQ tags</div>}
        {tags && tags.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Key</TableHeaderCell>
                <TableHeaderCell>Display Name</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>{tag.id}</TableCell>
                  <TableCell>{tag.key || '-'}</TableCell>
                  <TableCell>{tag.displayName || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {tags && tags.length === 0 && <div>No HQ tags found</div>}
      </div>
    </div>
  );
};
