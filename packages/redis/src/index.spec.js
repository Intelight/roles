import RedisDBDriver from './index';

const config = {
  port: 6379,
};

const init = () => {
  const db = new RedisDBDriver(config);

  beforeEach(async () => {
    await db.redis.flushall();
  });

  afterEach(async () => {
    await db.redis.flushall();
  });

  return db;
};

describe('RedisDBDriver', () => {
  describe('addUserToRoles', () => {
    const db = init();
    it('adds and creates roles', async () => {
      db.roleExists = jest.fn(false);
      db.createRole = jest.fn(db.createRole);
      const userId = '123';
      const roles = ['create', 'remove'];
      const group = 'admin';
      await db.addUserToRoles(userId, roles, group);
      expect(db.roleExists.mock.calls.length > 0).toEqual(true);
      expect(db.createRole.mock.calls.length > 0).toEqual(true);
      const groupId = await db.findGroup(group);
      const groupUsers = await db.redis.smembers(`group:${groupId}:users`);
      expect(groupUsers).toEqual([userId]);
      const createRoleId = await db.redis.hget('roles', 'admin:create');
      const removeRoleId = await db.redis.hget('roles', 'admin:remove');
      const usersRoles = await db.redis.smembers(`user:${userId}:roles`);
      expect(usersRoles.includes(createRoleId)).toEqual(true);
      expect(usersRoles.includes(removeRoleId)).toEqual(true);
      const usersGroups = await db.redis.smembers(`user:${userId}:groups`);
      expect(usersGroups.includes(groupId)).toEqual(true);
      const createRoleUsers = await db.redis.smembers(`role:${createRoleId}:users`);
      expect(createRoleUsers.includes(userId)).toEqual(true);
      const removeRoleUsers = await db.redis.smembers(`role:${removeRoleId}:users`);
      expect(removeRoleUsers.includes(userId)).toEqual(true);
    });
  });
  describe('findRole', () => {
    const db = init();
    it('finds role', async () => {
      await db.createRole('create', 'admin');
      const res = await db.findRole('create', 'admin');
      expect(res.roleId).toBeTruthy();
      expect(res.groupId).toBeTruthy();
    });
    it('does not find role', async () => {
      const res = await db.findRole('create', 'admin');
      expect(res).toEqual(null);
    });
  });
  describe('findGroup', () => {
    const db = init();
    it('finds group', async () => {
      await db.createRole('create', 'admin');
      const groupId = db.findGroup('admin');
      expect(groupId).toBeTruthy();
    });
    it('does not find role', async () => {
      const res = await db.findRole('create', 'admin');
      expect(res).toEqual(null);
    });
  });
  describe('roleExists', () => {
    const db = init();
    it('exists', async () => {
      await db.redis.hmset('groups', { admin: '123' });
      await db.redis.hmset('roles', { 'admin:create': '456' });
      await db.redis.sadd('group:123', '456');
      const res = await db.roleExists('create', 'admin');
      expect(res).toEqual(true);
    });
    it('does not exist', async () => {
      await db.redis.hmset('groups', { admin: '123' });
      await db.redis.sadd('group:123', 'create');
      const res = await db.roleExists('delete', 'user');
      expect(res).toEqual(false);
    });
  });
  describe('deleteRole', () => {
    const db = init();
    it('deletes role', async () => {
      const userId = '123';
      const role = 'create';
      const group = 'admin';
      await db.addUserToRoles(userId, [role], group);
      const { roleId, groupId } = await db.findRole(role, group);
      await db.deleteRole(role, group);
      expect(await db.redis.sismember(`user:${userId}:roles`, roleId));
      expect(await db.redis.hget('roles', role)).toBeFalsy();
      expect(await db.redis.get(`roles:${roleId}:users`)).toBeFalsy();
      expect(await db.redis.sismember(`groups:${groupId}`, roleId)).toBeFalsy();
      expect(await db.redis.get(`role:${roleId}`)).toBeFalsy();
    });
  });
  describe('deleteGroup', () => {
    const db = init();
    it('deletes group', async () => {
      const userId = '123';
      const role = 'create';
      const group = 'admin';
      await db.addUserToRoles(userId, [role], group);
      const groupId = await db.findGroup(group);
      await db.deleteGroup(group);
      expect(await db.redis.hget('groups', group)).toBeFalsy();
      expect(await db.redis.get(`group:${groupId}`)).toBeFalsy();
      expect(await db.redis.get(`group:${groupId}:users`)).toBeFalsy();
      expect(await db.findRole(role, group)).toBeFalsy();
      expect(await db.redis.sismember(`user:${userId}:groups`, groupId)).toBeFalsy();
      expect(await db.redis.hget('groups:id:name', groupId)).toBeFalsy();
    });
  });
  describe('createRole', () => {
    const db = init();
    it('create roles', async () => {
      const role = 'create';
      const group = 'admin';
      const { roleId, groupId } = await db.createRole(role, group);
      expect(await db.redis.hget('roles', `${group}:${role}`)).toBeTruthy();
      expect(await db.redis.hget('groups', group)).toBeTruthy();
      expect(await db.redis.sismember(`group:${groupId}`, roleId)).toBeTruthy();
      expect(await db.redis.hget('roles:id:name', roleId)).toEqual(role);
      expect(await db.redis.get(`role:${roleId}`)).toEqual(groupId);
    });
    it('does not create role if already exists', async () => {
      const role = 'create';
      const group = 'admin';
      await db.createRole(role, group);
      expect(await db.createRole(role, group)).toBeFalsy();
    });
  });
  describe('userIsInGroup', () => {
    const db = init();
    it('in group', async () => {
      const userId = '123';
      const role = 'create';
      const group = 'admin';
      await db.addUserToRoles(userId, [role], group);
      expect(await db.userIsInGroup(userId, group)).toEqual(true);
    });
    it('not in group', async () => {
      const userId = '123';
      const group = 'admin';
      expect(await db.userIsInGroup(userId, group)).toEqual(false);
    });
  });
  describe('userIsInRole', () => {
    const db = init();
    it('in role', async () => {
      const userId = '123';
      const role = 'create';
      const group = 'admin';
      await db.addUserToRoles(userId, [role], group);
      expect(await db.userIsInRole(userId, role, group)).toEqual(true);
    });
    it('not in role', async () => {
      const userId = '123';
      const role = 'create';
      const group = 'admin';
      expect(await db.userIsInRole(userId, role, group)).toEqual(false);
    });
  });
  describe('getGroupsForUser', () => {
    const db = init();
    it('get groups', async () => {
      const userId = '123';
      const role = 'create';
      const adminGroup = 'admin';
      const userGroup = 'user';
      await db.addUserToRoles(userId, [role], adminGroup);
      await db.addUserToRoles(userId, [role], userGroup);
      const adminGroupId = await db.findGroup(adminGroup);
      const userGroupId = await db.findGroup(userGroup);
      const groups = await db.getGroupsForUser(userId);
      expect(groups[adminGroupId]).toEqual('admin');
      expect(groups[userGroupId]).toEqual('user');
    });
  });
  describe('getRolesForUser', () => {
    const db = init();
    it('get groups', async () => {
      const userId = '123';
      const adminRole = 'create';
      const adminGroup = 'admin';
      const userRole = 'edit';
      const userGroup = 'user';
      await db.addUserToRoles(userId, [adminRole], adminGroup);
      await db.addUserToRoles(userId, [userRole], userGroup);
      const adminRoleId = await db.redis.hget('roles', `${adminGroup}:${adminRole}`);
      const adminGroupId = await db.redis.hget('groups', adminGroup);
      const userRoleId = await db.redis.hget('roles', `${userGroup}:${userRole}`);
      const userGroupId = await db.redis.hget('groups', userGroup);
      const roles = await db.getRolesForUser(userId);
      expect(roles[adminRoleId]).toEqual({
        role: adminRole,
        group: adminGroup,
        groupId: adminGroupId,
      });
      expect(roles[userRoleId]).toEqual({
        role: userRole,
        group: userGroup,
        groupId: userGroupId,
      });
    });
  });
  describe('removeUserFromRoles', () => {
    const db = init();
    it('remove user from roles', async () => {
      const userId = '123';
      const roles = ['create', 'remove'];
      const adminGroup = 'admin';
      await db.addUserToRoles(userId, roles, adminGroup);
      await db.removeUserFromRoles(userId, roles, adminGroup);
      const res = await db.getRolesForUser(userId);
      expect(res.length).toEqual(0);
    });
  });
  describe('removeUserFromGroup', () => {
    const db = init();
    it('remove user from group', async () => {
      const userId = '123';
      const roles = ['create', 'remove'];
      const adminGroup = 'admin';
      await db.addUserToRoles(userId, roles, adminGroup);
      await db.removeUserFromGroup(userId, adminGroup);
      const res = await db.getGroupsForUser(userId);
      expect(res.length).toEqual(0);
    });
  });
});
