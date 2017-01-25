import Redis from 'ioredis';
import shortId from 'shortid';

export default class {
  constructor(options) {
    this.redis = new Redis(options);
  }
  async addUserToRoles(userId, roles, group) {
    const roleIds = [];
    let groupId;
    await Promise.all(roles.map(async (role) => {
      if (!await this.roleExists(role, group)) {
        const createdRole = await this.createRole(role, group);
        roleIds.push(createdRole.roleId);
        groupId = createdRole.groupId;
      }
    }));
    if (roleIds.length > 0) {
      const pipeline = this.redis.multi();
      pipeline.sadd(`user:${userId}:roles`, roleIds);
      pipeline.sadd(`user:${userId}:groups`, groupId);
      pipeline.sadd(`group:${groupId}:users`, userId);
      roleIds.forEach(roleId => pipeline.sadd(`role:${roleId}:users`, userId));
      await pipeline.exec();
    }
  }
  async createRole(role, group) {
    if (!await this.roleExists(role, group)) {
      const roleId = shortId.generate();
      const pipeline = this.redis.multi();
      pipeline.hmset('roles', { [`${group}:${role}`]: roleId });
      pipeline.hmset('roles:id:name', { [roleId]: role });
      let groupId = await this.findGroup(group);
      if (!groupId) {
        groupId = shortId.generate();
        pipeline.hmset('groups', { [group]: groupId });
        pipeline.hmset('groups:id:name', { [groupId]: group });
      }
      pipeline.sadd(`group:${groupId}`, roleId);
      pipeline.set(`role:${roleId}`, groupId);
      await pipeline.exec();
      return {
        roleId,
        groupId,
      };
    }
    return null;
  }
  async roleExists(role, group) {
    const exists = await this.findRole(role, group) !== null;
    return exists;
  }
  async findRole(role, group) {
    const groupId = await this.redis.hget('groups', group);
    const roleId = await this.redis.hget('roles', `${group}:${role}`);
    const exists = await this.redis.sismember(`group:${groupId}`, roleId) === 1;
    if (exists) {
      return {
        roleId,
        groupId,
      };
    }
    return null;
  }
  async findGroup(group) {
    const groupId = await this.redis.hget('groups', group);
    return groupId || null;
  }
  async deleteRole(role, group) {
    const ids = await this.findRole(role, group);
    if (ids) {
      const { roleId, groupId } = ids;
      const pipeline = this.redis.multi();
      const usersWithRole = await this.redis.smembers(`role:${roleId}:users`);
      usersWithRole.forEach(userId => pipeline.srem(`user:${userId}:roles`, roleId));
      pipeline.hdel('roles', `${role}:${group}`);
      pipeline.del(`role:${roleId}`);
      pipeline.del(`roles:${roleId}:users`);
      pipeline.srem(`group:${groupId}`, roleId);
      await pipeline.exec();
    }
  }
  async deleteGroup(group) {
    const groupId = await this.findGroup(group);
    if (groupId) {
      const pipeline = this.redis.multi();
      const rolesInGroup = await this.redis.smembers(`group:${groupId}`);
      await Promise.all(rolesInGroup.map(async role => await this.deleteRole(role, group)));
      const usersWithGroup = await this.redis.smembers(`group:${groupId}:users`);
      usersWithGroup.forEach(userId => pipeline.srem(`user:${userId}:groups`, groupId));
      pipeline.hdel('groups', group);
      pipeline.hdel('groups:id:name', groupId);
      pipeline.del(`group:${groupId}`);
      pipeline.del(`group:${groupId}:users`);
      await pipeline.exec();
    }
  }
  async userIsInRole(userId, role, group) {
    const res = await this.findRole(role, group);
    if (res) {
      const { roleId } = res;
      const exists = await this.redis.sismember(`user:${userId}:roles`, roleId) === 1;
      return exists;
    }
    return false;
  }
  async userIsInGroup(userId, group) {
    const groupId = await this.findGroup(group);
    if (groupId) {
      const exists = await this.redis.sismember(`user:${userId}:groups`, groupId) === 1;
      return exists;
    }
    return false;
  }
  async getGroupsForUser(userId) {
    const groupIds = await this.redis.smembers(`user:${userId}:groups`);
    if (!groupIds || groupIds.length === 0) {
      return [];
    }
    const res = {};
    await Promise.all(groupIds.map(async (id) => {
      const name = await this.redis.hget('groups:id:name', id);
      res[id] = name;
    }));
    return res;
  }
  async getRolesForUser(userId) {
    const roleIds = await this.redis.smembers(`user:${userId}:roles`);
    if (!roleIds || roleIds.length === 0) {
      return [];
    }
    const res = {};
    await Promise.all(roleIds.map(async (id) => {
      const role = await this.redis.hget('roles:id:name', id);
      const groupId = await this.redis.get(`role:${id}`);
      const groupName = await this.redis.hget('groups:id:name', groupId);
      res[id] = {
        role,
        group: groupName,
        groupId,
      };
    }));
    return res;
  }
  async removeUserFromRoles(userId, roles, group) {
    const roleIds = await Promise.all(
      roles.map(async role => await this.redis.hget('roles', `${group}:${role}`)),
    );
    await this.redis.srem(`user:${userId}:roles`, roleIds);
  }
  async removeUserFromGroup(userId, group) {
    const groupId = await this.redis.hget('groups', group);
    const roleIds = await this.redis.smembers(`group:${groupId}`);
    const pipeline = this.redis.multi();
    roleIds.forEach(roleId => pipeline.srem(`role:${roleId}:users`, userId));
    pipeline.srem(`user:${userId}:roles`, roleIds);
    pipeline.srem(`group:${groupId}:users`, userId);
    pipeline.srem(`user:${userId}:groups`, groupId);
    await pipeline.exec();
  }
  async getAll() {
    const groups = await this.redis.hgetall('groups:id:name');
    let res = {};
    await Promise.all(Object.keys(groups).map(async (id) => {
      const roleIds = await this.redis.smembers(`group:${id}`);
      let roles = {};
      await Promise.all(roleIds.map(async (roleId) => {
        const role = await this.redis.hget('roles:id:name', roleId);
        roles = {
          [roleId]: {
            roleId,
            role,
          },
          ...roles,
        };
      }));
      res = {
        [id]: {
          groupId: id,
          group: groups[id],
          roles,
        },
        ...res,
      };
    }));
    return res;
  }
}
