import Roles from './Roles';

describe('init', () => {
  it('throws error if db driver not provided', () => {
    expect(() => Roles.init()).toThrowError('A database driver is required');
  });
  it('throws error if user resolver not provided', () => {
    expect(() => Roles.init({})).toThrowError('A user resolver is required');
  });
});

describe('addUserToRoles', () => {
  it('throw error if no user id provided', async () => {
    try {
      await Roles.addUserToRoles();
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId is required'));
    }
  });
  it('throw error if no roles are provided', async () => {
    try {
      await Roles.addUserToRoles('123');
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('roles are required'));
    }
  });
  it('throw error if no groups are provided', async () => {
    try {
      await Roles.addUserToRoles('123', ['create'], null);
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('group is required'));
    }
  });
  it('throw error if user id is not found', async () => {
    const findUserById = jest.fn(() => false);
    Roles.init({}, {
      findUserById,
    });
    try {
      await Roles.addUserToRoles('123', ['create']);
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId 123 not found'));
    }
  });
  it('calls db.addUserToRoles', async () => {
    const findUserById = jest.fn(() => Promise.resolve({}));
    const addUserToRoles = jest.fn();
    Roles.init({
      addUserToRoles,
    }, {
      findUserById,
    });
    await Roles.addUserToRoles(['123', '456'], ['create']);
    expect(addUserToRoles.mock.calls.length).toEqual(2);
  });
});

describe('createRole', () => {
  it('throw error if no role is provided', async () => {
    try {
      await Roles.createRole();
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('role is required'));
    }
  });
  it('throw error if no group is provided', async () => {
    try {
      await Roles.createRole('role', null);
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('group is required'));
    }
  });
  it('throw error if role already exists', async () => {
    Roles.init({
      roleExists: () => Promise.resolve(true),
    }, {});
    try {
      await Roles.createRole('role');
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('role already exists'));
    }
  });
  it('calls db.createRole', async () => {
    const createRole = jest.fn(() => Promise.resolve({
      roleId: 'roleId',
      groupId: 'groupId',
    }));
    Roles.init({
      roleExists: () => Promise.resolve(false),
      createRole,
    }, {});

    const res = await Roles.createRole('role');
    expect(res).toEqual({
      roleId: 'roleId',
      groupId: 'groupId',
    });
    expect(createRole.mock.calls.length).toEqual(1);
  });
});

describe('deleteRole', () => {
  it('calls db.deleteRole', () => {
    const deleteRole = jest.fn();
    Roles.init({
      deleteRole,
    }, {});
    Roles.deleteRole('role', 'group');
    expect(deleteRole.mock.calls.length).toEqual(1);
    expect(deleteRole.mock.calls[0][0]).toEqual('role');
    expect(deleteRole.mock.calls[0][1]).toEqual('group');
  });
});

describe('deleteGroup', () => {
  it('calls db.deleteGroup', () => {
    const deleteGroup = jest.fn();
    Roles.init({
      deleteGroup,
    }, {});
    Roles.deleteGroup('group');
    expect(deleteGroup.mock.calls.length).toEqual(1);
    expect(deleteGroup.mock.calls[0][0]).toEqual('group');
  });
});

describe('getAll', () => {
  it('calls db.getAll', async () => {
    const getAll = jest.fn();
    Roles.init({
      getAll,
    }, {});
    await Roles.getAll();
    expect(getAll.mock.calls.length).toEqual(1);
  });
});

describe('getGroupsForUser', () => {
  it('throws error if user not found', async () => {
    Roles.init({

    }, {
      findUserById: () => Promise.resolve(false),
    });
    try {
      await Roles.getGroupsForUser('123');
      throw new Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId 123 not found'));
    }
  });
  it('calls db.getGroupsForUser', async () => {
    Roles.init({
      getGroupsForUser: () => Promise.resolve(['group']),
    }, {
      findUserById: () => Promise.resolve(true),
    });
    const groups = await Roles.getGroupsForUser('123');
    expect(groups).toEqual(['group']);
  });
});

describe('getGroupsForUser', () => {
  it('throws error if user not found', async () => {
    Roles.init({

    }, {
      findUserById: () => Promise.resolve(false),
    });
    try {
      await Roles.getRolesForUser('123');
      throw new Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId 123 not found'));
    }
  });
  it('calls db.getRolesForUser', async () => {
    Roles.init({
      getRolesForUser: () => Promise.resolve(['role']),
    }, {
      findUserById: () => Promise.resolve(true),
    });
    const roles = await Roles.getRolesForUser('123');
    expect(roles).toEqual(['role']);
  });
});

describe('getUsersInRole', () => {
  it('calls db.getUsersInRole', async () => {
    const getUsersInRole = jest.fn(() => Promise.resolve(['user']));
    Roles.init({
      getUsersInRole,
    }, {});
    const res = await Roles.getUsersInRole('role');
    expect(res).toEqual(['user']);
    expect(getUsersInRole.mock.calls.length).toEqual(1);
  });
});

describe('getUsersInGroup', () => {
  it('calls db.getUsersInGroup', async () => {
    const getUsersInGroup = jest.fn(() => Promise.resolve(['user']));
    Roles.init({
      getUsersInGroup,
    }, {});
    const res = await Roles.getUsersInGroup('group');
    expect(res).toEqual(['user']);
    expect(getUsersInGroup.mock.calls.length).toEqual(1);
  });
});

describe('removeUserFromRoles', () => {
  it('throw error if no user id provided', async () => {
    try {
      await Roles.removeUserFromRoles();
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId is required'));
    }
  });
  it('throw error if no roles are provided', async () => {
    try {
      await Roles.removeUserFromRoles('123');
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('roles are required'));
    }
  });
  it('throw error if no groups are provided', async () => {
    try {
      await Roles.removeUserFromRoles('123', ['create'], null);
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('group is required'));
    }
  });
  it('throw error if user id is not found', async () => {
    const findUserById = jest.fn(() => false);
    Roles.init({}, {
      findUserById,
    });
    try {
      await Roles.removeUserFromRoles('123', ['create']);
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId 123 not found'));
    }
  });
  it('calls db.removeUserFromRoles', async () => {
    const findUserById = jest.fn(() => Promise.resolve({}));
    const removeUserFromRoles = jest.fn();
    Roles.init({
      removeUserFromRoles,
    }, {
      findUserById,
    });
    await Roles.removeUserFromRoles(['123', '456'], ['create']);
    expect(removeUserFromRoles.mock.calls.length).toEqual(2);
  });
})
;
describe('removeUserFromGroup', () => {
  it('throw error if no user id provided', async () => {
    try {
      await Roles.removeUserFromGroup();
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId is required'));
    }
  });
  it('throw error if no group is provided', async () => {
    try {
      await Roles.removeUserFromGroup('123', null);
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('group is required'));
    }
  });
  it('throw error if user id is not found', async () => {
    const findUserById = jest.fn(() => false);
    Roles.init({}, {
      findUserById,
    });
    try {
      await Roles.removeUserFromGroup('123', 'admin');
      throw Error();
    } catch (err) {
      expect(err).toEqual(new Error('userId 123 not found'));
    }
  });
  it('calls db.removeUserFromGroup', async () => {
    const findUserById = jest.fn(() => Promise.resolve({}));
    const removeUserFromGroup = jest.fn();
    Roles.init({
      removeUserFromGroup,
    }, {
      findUserById,
    });
    await Roles.removeUserFromGroup(['123', '456'], 'create');
    expect(removeUserFromGroup.mock.calls.length).toEqual(2);
  });
});

describe('userIsInRole', () => {
  it('calls db.userIsInRole', async () => {
    const userIsInRole = jest.fn(() => Promise.resolve(true));
    Roles.init({
      userIsInRole,
    }, {});
    const res = await Roles.userIsInRole('123', 'create', 'admin');
    expect(res).toEqual(true);
    expect(userIsInRole.mock.calls.length).toEqual(1);
  });
});

describe('userIsInGroup', () => {
  it('calls db.userIsInGroup', async () => {
    const userIsInGroup = jest.fn(() => Promise.resolve(true));
    Roles.init({
      userIsInGroup,
    }, {});
    const res = await Roles.userIsInGroup('123', 'admin');
    expect(res).toEqual(true);
    expect(userIsInGroup.mock.calls.length).toEqual(1);
  });
});
