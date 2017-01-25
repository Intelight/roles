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
      const createRoleId = await db.redis.hget('roles', 'create');
      const removeRoleId = await db.redis.hget('roles', 'remove');
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
      await db.redis.hmset('roles', { create: '456' });
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
    });
  });
  describe('createRole', () => {
    const db = init();
    it('create roles', async () => {
      const role = 'create';
      const group = 'admin';
      const { roleId, groupId } = await db.createRole(role, group);
      expect(await db.redis.hget('roles', role)).toBeTruthy();
      expect(await db.redis.hget('groups', group)).toBeTruthy();
      expect(await db.redis.sismember(`group:${groupId}`, roleId)).toBeTruthy();
    });
    it('does not create role if already exists', async () => {
      const role = 'create';
      const group = 'admin';
      await db.createRole(role, group);
      expect(await db.createRole(role, group)).toBeFalsy();
    });
  });
  describe('getGroupsForUser', () => {
    const db = init();
    it('gets groups for user', async () => {
      // expect(await db.getAllRoles()).toEqual({
      //
      // });
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
});
