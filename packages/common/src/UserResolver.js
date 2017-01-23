// @flow

export interface UserResolver {
  findUserById(userId: string): Promise<?Object>
}
