import Roles from './Roles';

describe('init', () => {
  it('throws error if db driver not provided', () => {
    expect(() => Roles.init()).toThrowError('A database driver is required');
  });
  it('throws error if user resolver not provided', () => {
    expect(() => Roles.init({})).toThrowError('A user resolver is required');
  });
});

describe('add user to roles', () => {
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
