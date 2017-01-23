import Redis from 'ioredis';
import shortId from 'shortid';

export default class {
  constructor(options) {
    this.redis = new Redis(options);
  }
  async addUserToRoles(userId, roles, group) {
    const roleIds = [];
    let groupId;
    roles.forEach(async (role) => {
      if (!await this.roleExists(role, group)) {
        const createdRole = await this.createRole(role, group);
        roleIds.push(createdRole.roleId);
        groupId = createdRole.groupId;
      }
    });
    if (roleIds.length > 0) {
      const pipeline = this.redis.pipeline();
      pipeline.sadd(`user:${userId}`, roleIds);
      pipeline.sadd(`group:${groupId}:users`, userId);
      roleIds.forEach(roleId => pipeline.sadd(`role:${roleId}:users`, userId));
      await pipeline.exec();
    }
  }
  async createRole(role, group) {
    if (!await this.roleExists(role, group)) {
      const roleId = shortId.generate();
      const groupId = shortId.generate();
      const pipeline = this.redis.pipeline();
      pipeline.sadd(`group:${group}`, role);
      pipeline.hmset('roles', { [role]: roleId });
      pipeline.hmset('groups', { [group]: groupId });
      await pipeline.exec();
      return {
        roleId,
        groupId,
      };
    }
    return null;
  }
  async roleExists(role, group) {
    const groupId = await this.redis.hget('groups', group);
    console.log(groupId);
    if (groupId) {
      const exists = await this.redis.sismember(`group:${group}`, role);
      return exists === 1;
    }
    return false;
  }
}
