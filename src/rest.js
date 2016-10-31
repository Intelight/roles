// TODO Disable
/* eslint-disable no-unused-vars */

import { defaultsDeep } from 'lodash';

const defaultConfig = {
  path: '',
  prefix: 'roles',
};

const client = (userConfig) => {
  const config = defaultsDeep({}, userConfig, defaultConfig);

  const fetch = (route, args) =>
    fetch(`${config.path}/${config.prefix}/${route}`, {
      ...args,
    });

  return {
    userIsInRole(userId, roles, group) {
    },
    userIsInGroup(userId, groups) {

    },
    addUsersToRole(userId, roles, group) {

    },
    setUserRoles(userId, roles, group) {

    },
  };
};

export default client;
