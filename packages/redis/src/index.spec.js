import RedisDBDriver from './index';

const config = {
  port: 6379,
};

describe('RedisDBDriver', () => {
  const db = new RedisDBDriver(config);

  beforeEach(async () => {
    await db.redis.flushall();
  });
  afterEach(async () => {
    await db.redis.flushall();
  });

  describe('addUserToRoles', () => {
    it('adds and creates roles', async () => {
      // db.roleExists = jest.fn(false);
      // db.createRole = jest.fn(db.createRole);
      // const userId = '123';
      // const roles = ['create', 'remove'];
      // const group = 'admin';
      // await db.addUserToRoles(userId, roles, group);
      // expect(db.roleExists.mock.calls.length > 0).toEqual(true);
      // expect(db.createRole.mock.calls.length > 0).toEqual(true);
    });
  });
  describe('roleExists', () => {
    it('exists', async () => {
      await db.redis.hmset('groups', { admin: '123' });
      await db.redis.sadd('group:123', 'create');
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
});
