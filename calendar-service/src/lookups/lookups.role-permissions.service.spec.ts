import {
  rolePermissionAudit,
  rolePermissions,
  sessions,
  teams,
  users,
  userTeams,
} from '@corpcal/database/schema';
import { SYSTEM_ROLE_IDS } from '@corpcal/shared';

import { LookupsService } from './lookups.service';

type SelectResult = unknown[];

function createSelectBuilder(
  result: SelectResult,
  onFrom?: (table: unknown) => void
) {
  const builder: Record<string, any> = {};
  for (const method of [
    'from',
    'where',
    'limit',
    'orderBy',
    'leftJoin',
    'innerJoin',
    'for',
  ]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.from = vi.fn((table: unknown) => {
    onFrom?.(table);
    return builder;
  });
  builder.then = (
    resolve: (value: SelectResult) => unknown,
    reject: (reason: unknown) => unknown
  ) => Promise.resolve(result).then(resolve, reject);
  return builder;
}

function createService(options: {
  transactionSelects: SelectResult[];
  resultRows: { id: number; key: string; isActive: boolean }[];
}) {
  const inserted: { table: unknown; values: Record<string, unknown> }[] = [];
  const upserts: { table: unknown; values: Record<string, unknown> }[] = [];
  const deletes: { table: unknown; whereCalled: boolean }[] = [];
  const transactionSelects = [...options.transactionSelects];
  const transactionFromTables: unknown[] = [];
  const finalSelects: SelectResult[] = [
    [{ id: SYSTEM_ROLE_IDS.ADMIN }],
    options.resultRows,
  ];

  const tx = {
    select: vi.fn(() =>
      createSelectBuilder(transactionSelects.shift() ?? [], (table) =>
        transactionFromTables.push(table)
      )
    ),
    insert: vi.fn((table: unknown) => ({
      values: vi.fn((values: Record<string, unknown>) => {
        inserted.push({ table, values });
        return {
          onConflictDoUpdate: vi.fn(() => {
            upserts.push({ table, values });
            return Promise.resolve();
          }),
          then: (
            resolve: (value: void) => unknown,
            reject: (reason: unknown) => unknown
          ) => Promise.resolve().then(resolve, reject),
        };
      }),
    })),
    delete: vi.fn((table: unknown) => ({
      where: vi.fn(() => {
        deletes.push({ table, whereCalled: true });
        return Promise.resolve();
      }),
    })),
  };

  const db = {
    transaction: vi.fn((callback: (executor: typeof tx) => Promise<unknown>) =>
      callback(tx)
    ),
    select: vi.fn(() => createSelectBuilder(finalSelects.shift() ?? [])),
  };
  const service = new LookupsService({ db } as never, {} as never);

  return { service, inserted, upserts, deletes, transactionFromTables, tx, db };
}

const permissionCatalog = [
  { id: 10, key: 'activities.view' },
  { id: 99, key: 'system.manage_permissions' },
];

function transactionSelects(
  activePermissionIds: number[],
  includeAffectedUsers = true
): SelectResult[] {
  return [
    [{ id: SYSTEM_ROLE_IDS.ADMIN }],
    permissionCatalog,
    activePermissionIds.map((permissionId) => ({
      permissionId,
      isActive: true,
    })),
    ...(includeAffectedUsers
      ? [[{ id: 101 }], [{ id: 201 }], [{ id: 301 }]]
      : []),
  ];
}

describe('LookupsService role permission updates', () => {
  it('audits and soft-enables a permission and invalidates direct and team users', async () => {
    const context = createService({
      transactionSelects: transactionSelects([99]),
      resultRows: [
        { id: 10, key: 'activities.view', isActive: true },
        { id: 99, key: 'system.manage_permissions', isActive: true },
      ],
    });

    await context.service.updateAdminRolePermissions(
      SYSTEM_ROLE_IDS.ADMIN,
      [10, 99],
      42
    );

    expect(context.inserted).toContainEqual({
      table: rolePermissionAudit,
      values: expect.objectContaining({
        roleId: SYSTEM_ROLE_IDS.ADMIN,
        permissionId: 10,
        oldValue: false,
        newValue: true,
        changedBy: 42,
      }),
    });
    expect(context.upserts).toContainEqual({
      table: rolePermissions,
      values: expect.objectContaining({
        roleId: SYSTEM_ROLE_IDS.ADMIN,
        permissionId: 10,
        isActive: true,
      }),
    });
    expect(context.deletes).toContainEqual({
      table: sessions,
      whereCalled: true,
    });
    expect(context.transactionFromTables).toEqual(
      expect.arrayContaining([users, teams, userTeams])
    );
    expect(context.tx.select).toHaveBeenCalledTimes(6);
  });

  it('audits and soft-disables a permission', async () => {
    const context = createService({
      transactionSelects: transactionSelects([10, 99]),
      resultRows: [
        { id: 10, key: 'activities.view', isActive: false },
        { id: 99, key: 'system.manage_permissions', isActive: true },
      ],
    });

    await context.service.updateAdminRolePermissions(
      SYSTEM_ROLE_IDS.ADMIN,
      [99],
      42
    );

    expect(context.inserted).toContainEqual({
      table: rolePermissionAudit,
      values: expect.objectContaining({
        permissionId: 10,
        oldValue: true,
        newValue: false,
      }),
    });
    expect(context.upserts).toContainEqual({
      table: rolePermissions,
      values: expect.objectContaining({ permissionId: 10, isActive: false }),
    });
    expect(context.deletes).toContainEqual({
      table: sessions,
      whereCalled: true,
    });
  });

  it('does not audit, upsert, or invalidate sessions for a no-op update', async () => {
    const context = createService({
      transactionSelects: transactionSelects([10, 99], false),
      resultRows: [
        { id: 10, key: 'activities.view', isActive: true },
        { id: 99, key: 'system.manage_permissions', isActive: true },
      ],
    });

    await context.service.updateAdminRolePermissions(
      SYSTEM_ROLE_IDS.ADMIN,
      [10, 99],
      42
    );

    expect(context.inserted).toEqual([]);
    expect(context.upserts).toEqual([]);
    expect(context.deletes).toEqual([]);
    expect(context.transactionFromTables).not.toEqual(
      expect.arrayContaining([users, teams, userTeams])
    );
    expect(context.tx.select).toHaveBeenCalledTimes(3);
  });
});
