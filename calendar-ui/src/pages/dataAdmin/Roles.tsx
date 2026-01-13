import { Link } from 'react-router-dom';
import { ChevronLeft24Regular } from '@fluentui/react-icons';

export const Roles = () => {
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
        ROLES
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
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          This lookup table has not been implemented yet. Database schema and
          API endpoints need to be created.
        </p>
      </div>
    </div>
  );
};
