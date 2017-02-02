import { isEmpty } from 'lodash';

export const DEFAULT_GROUP = 'DEFAULT_GROUP';

const defaultOptions = {
  path: '/roles',
};

const Roles = {
  init(options = {}, db, userResolver) {
    this.options = { ...defaultOptions, ...options };
    if (!db) {
      throw new Error('A database driver is required');
    }
    this.db = db;
    if (!userResolver) {
      throw new Error('A user resolver is required');
    }
    this.userResolver = userResolver;
  },
  async addUserToRoles(userId, roles, group = DEFAULT_GROUP) {
    if (isEmpty(userId)) {
      throw new Error('userId is required');
    }
    if (isEmpty(roles)) {
      throw new Error('roles are required');
    }
    if (isEmpty(group)) {
      throw new Error('group is required');
    }
    // eslint-disable-next-line no-param-reassign
    userId = Array.isArray(userId) ? userId : [userId];
    // eslint-disable-next-line no-param-reassign
    roles = Array.isArray(roles) ? roles : [roles];

    await Promise.all(userId.map(async (id) => {
      const foundUser = await this.userResolver.findUserById(id);
      if (foundUser) {
        await this.db.addUserToRoles(id, roles, group);
      } else {
        throw new Error(`userId ${id} not found`);
      }
    }));
  },
  async createRole(role, group = DEFAULT_GROUP) {
    if (isEmpty(role)) {
      throw new Error('role is required');
    }
    if (isEmpty(group)) {
      throw new Error('group is required');
    }
    if (await this.db.roleExists(role, group)) {
      throw new Error('role already exists');
    }
    return this.db.createRole(role, group);
  },
  deleteRole(role, group = DEFAULT_GROUP) {
    return this.db.deleteRole(role, group);
  },
  deleteGroup(group = DEFAULT_GROUP) {
    return this.db.deleteGroup(group);
  },
  getAll() {
    return this.db.getAll();
  },
  async getGroupsForUser(userId) {
    const foundUser = await this.userResolver.findUserById(userId);
    if (foundUser) {
      return await this.db.getGroupsForUser(userId);
    }
    throw new Error(`userId ${userId} not found`);
  },
  async getRolesForUser(userId) {
    const foundUser = await this.userResolver.findUserById(userId);
    if (foundUser) {
      return await this.db.getRolesForUser(userId);
    }
    throw new Error(`userId ${userId} not found`);
  },
  getUsersInRole(role, group = DEFAULT_GROUP) {
    return this.db.getUsersInRole(role, group);
  },
  getUsersInGroup(group = DEFAULT_GROUP) {
    return this.db.getUsersInGroup(group);
  },
  async removeUserFromRoles(userId, roles, group = DEFAULT_GROUP) {
    if (isEmpty(userId)) {
      throw new Error('userId is required');
    }
    if (isEmpty(roles)) {
      throw new Error('roles are required');
    }
    if (isEmpty(group)) {
      throw new Error('group is required');
    }
    // eslint-disable-next-line no-param-reassign
    userId = Array.isArray(userId) ? userId : [userId];
    // eslint-disable-next-line no-param-reassign
    roles = Array.isArray(roles) ? roles : [roles];

    await Promise.all(userId.map(async (id: string) => {
      const foundUser = await this.userResolver.findUserById(id);
      if (foundUser) {
        await this.db.removeUserFromRoles(id, roles, group);
      } else {
        throw new Error(`userId ${id} not found`);
      }
    }));
  },
  async removeUserFromGroup(userId, group = DEFAULT_GROUP) {
    if (isEmpty(userId)) {
      throw new Error('userId is required');
    }
    if (isEmpty(group)) {
      throw new Error('group is required');
    }
    // eslint-disable-next-line no-param-reassign
    userId = Array.isArray(userId) ? userId : [userId];

    await Promise.all(userId.map(async (id: string) => {
      const foundUser = await this.userResolver.findUserById(id);
      if (foundUser) {
        await this.db.removeUserFromGroup(id, group);
      } else {
        throw new Error(`userId ${id} not found`);
      }
    }));
  },
  userIsInRole(userId, role, group = DEFAULT_GROUP) {
    return this.db.userIsInRole(userId, role, group);
  },
  userIsInGroup(userId, group = DEFAULT_GROUP) {
    return this.db.userIsInGroup(userId, group);
  },
  findById(roleId) {
    if (isEmpty(roleId)) {
      throw new Error('roleId is required');
    }
    return this.db.findById(roleId);
  },
};

export default Roles;
