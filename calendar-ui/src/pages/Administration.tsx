import { Link } from '@fluentui/react-components';

export const Administration = () => {
  const lookupTables = [
    { name: 'Categories', route: 'categories' },
    { name: 'Cities', route: 'cities' },
    { name: 'CommunicationMaterials', route: 'communication-materials' },
    { name: 'GovernmentRepresentatives', route: 'government-representatives' },
    { name: 'HQ Tags', route: 'hq-tags' },
    { name: 'Ministries', route: 'ministries' },
    { name: 'News Subscribe', route: 'news-subscribe' },
    { name: 'NRDistributions', route: 'nr-distributions' },
    { name: 'NROrigins', route: 'nr-origins' },
    { name: 'PremierRequested', route: 'premier-requested' },
    { name: 'Roles', route: 'roles' },
    { name: 'Status', route: 'status' },
    { name: 'SystemUsers', route: 'system-users' },
    { name: 'Themes', route: 'themes' },
  ];

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
        Corporate Calendar Data Administration
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
          href="./dataAdmin/transferActivities"
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
        Corporate Calendar Lookup Tables
      </h2>

      {/* Table */}
      <table
        style={{
          width: '100%',
          backgroundColor: '#fff',
          borderCollapse: 'collapse',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#e8e8f0' }}>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: 600,
                color: '#333',
                fontSize: '14px',
              }}
            >
              Table Name
            </th>
          </tr>
        </thead>
        <tbody>
          {lookupTables.map((table, index) => (
            <tr
              key={table.name}
              style={{
                borderBottom:
                  index < lookupTables.length - 1
                    ? '1px solid #e0e0e0'
                    : 'none',
              }}
            >
              <td style={{ padding: '12px 16px' }}>
                <Link
                  href={`/admin/lookup/${table.route}`}
                  style={{
                    color: '#0078d4',
                    textDecoration: 'underline',
                    fontSize: '14px',
                  }}
                >
                  {table.name}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
