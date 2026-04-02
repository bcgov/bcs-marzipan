import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { getAuthTokenForRole, startTestServer } from '../test/utils';

// This test file assumes test helpers exist to start the server and obtain tokens.
describe('Banner API permissions', () => {
  let app: any;

  beforeAll(async () => {
    app = await startTestServer();
  });

  it('forbids non-admin users from updating banner', async () => {
    const token = await getAuthTokenForRole('user');
    const res = await request(app)
      .post('/api/admin/banner')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '<p>test</p>' });

    expect(res.status).toBe(403);
  });

  it('allows system admins to update banner', async () => {
    const token = await getAuthTokenForRole('system-admin');
    const res = await request(app)
      .post('/api/admin/banner')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '<p>test</p>' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });
});
