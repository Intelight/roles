// @flow

export interface DBInterface {
  addUserToRoles(userId: string, roles: [string], group: string): Promise<void>,
  addRole(role: string) : Promise<?string>
}
