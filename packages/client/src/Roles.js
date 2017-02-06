export const DEFAULT_GROUP = 'DEFAULT_GROUP';

const defaultOptions = {
  path: '/roles',
};

const Roles = {
  init(options = {}, client) {
    this.options = { ...defaultOptions, ...options };
    if (!client) {
      throw new Error('A client is required');
    }
    this.client = client;
  },
  userIsInRole(role, group = DEFAULT_GROUP) {
    return this.client.userIsInRole(role, group);
  },
  userIsInGroup(group = DEFAULT_GROUP) {
    return this.client.userIsInGroup(group);
  },
};

export default Roles;
