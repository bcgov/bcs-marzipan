import { Link } from '@fluentui/react-components';

export const UserAdmin = () => {
  return (
    <div
      style={{
        padding: '24px',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <h1
        style={{
          margin: '0 0 16px 0',
          fontSize: '24px',
          fontWeight: 400,
          color: '#666',
          letterSpacing: '0.5px',
        }}
      >
        Corportate Calendar Data Administration
      </h1>

      {/* Action Links */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          href="/manage-users"
          style={{
            display: 'block',
            color: '#0078d4',
            textDecoration: 'underline',
            marginBottom: '8px',
            fontSize: '14px',
          }}
        >
          Manage Users
        </Link>
        <Link
          href="/transfer-activities"
          style={{
            display: 'block',
            color: '#0078d4',
            textDecoration: 'underline',
            fontSize: '14px',
          }}
        >
          Transfer Activities
        </Link>
      </div>

      {/* Lookup Tables Section */}
      <h2
        style={{
          margin: '0 0 16px 0',
          fontSize: '18px',
          fontWeight: 400,
          color: '#666',
        }}
      >
        Update Users
      </h2>
      <div>coming soon!</div>
    </div>
  );
};
