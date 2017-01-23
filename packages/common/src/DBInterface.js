// @flow

export interface DBInterface {
  addUserToRoles(userId: string, roles: [string], group: string): Promise<void>,
  addRole(role: string, group: string) : Promise<?string>,
  roleExists(role: string, group: string) : Promise<boolean>
}
