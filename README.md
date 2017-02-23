# roles

Dead simple role and group management.

[![npm](https://img.shields.io/npm/v/roles-server.svg)](https://www.npmjs.com/package/roles-server)
[![npm](https://img.shields.io/npm/v/roles-client.svg)](https://www.npmjs.com/package/roles-client) [![CircleCI](https://circleci.com/gh/Intelight/roles.svg?style=svg)](https://circleci.com/gh/Intelight/roles)[![Coverage Status](https://coveralls.io/repos/github/intelight/roles/badge.svg?branch=master)](https://coveralls.io/github/intelight/roles?branch=master) ![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)

## Getting Started

Install the core packages

`npm i -S roles-client roles-server`

Install the server transport

`npm i -S roles-rest-express`

Install the data store

`npm i -S roles-redis`

Install the React component

`npm i -S roles-react`

To begin you'll need to initialize `Roles` by calling `Roles.init` both on the client and the server. To `Roles.init` you provide an options object and an object implementing the `userIsInRole` and `userIsInGroup` functions. Below is an example of their implementation using `fetch`.

## Examples

**Browser**
```javascript
import Roles from 'roles-client';

Roles.init({
  path: '/roles' // This is the default
}, {
  async userIsInRole(role, group) {
    const res = await (await fetch(`${process.env.AUTH_SERVER}${Roles.options.path}/userIsInRole`, {
      method: 'POST',
      body: JSON.stringify({
        role,
        group,
      }),
    })).json();
    return res.inRole;
  },
  async userIsInGroup(group) {
    const res = await (await fetch(`${process.env.AUTH_SERVER}${Roles.options.path}/userIsInGroup`, {
      method: 'POST',
      body: JSON.stringify({
        group,
      }),
    })).json();
    return res.inGroup;
  },
});
```

Similar to the initialization of `Roles` on the client, the first paramter of `Roles.init` is an options object, the second parameter is a data store. In the following example it comes from `roles-redis`. There is also a third parameter providing an object with a `findUserById` function. This is used in order to find and verify the existence of userIds passed to `Roles`'s functions. You must provide this function.

Finally on the server, you need to create the REST routes for roles, this is done by using `app.use(rolesExpress(Roles))`.

**Server**
```javascript
import express from 'express';
import bodyParser from 'body-parser';
import Roles from 'roles-server';
import rolesExpress from 'roles-rest-express';
import RolesRedis from 'roles-redis';

Roles.init({
  path: '/roles' // This is the default
}, new RolesRedis({
  port: 6379,
}), {
  findUserById: userId => Accounts.findUserById(userId),
});

const PORT = 3010;

const app = express()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(rolesExpress(Roles));

app.listen(PORT, () => console.log( // eslint-disable-line no-console
  `API Server is now running on http://localhost:${PORT}`,
));
```

### Managing roles

Assign a user to some roles and a group. If the provided roles or group do not exist they will be created.

```javascript
await Roles.addUserToRoles(userId, ['create', 'read', 'update', 'delete'], 'admin')
```

You can check if a user belongs to a role or a group.

```javascript
await Roles.addUserToRoles(userId, ['create', 'read', 'update', 'delete'], 'admin')

await Roles.userIsInRole(userId, 'create', 'admin') // Returns true
await Roles.userIsInRole(userId, ['create', 'bad-role'], 'admin') // Returns false
await Roles.userIsInGroup(userId, 'admin') // Returns true
```

To remove a user from roles or a group

```javascript
await Roles.addUserToRoles(userId, ['create', 'read', 'update', 'delete'], 'admin')

// Remove the user from roles
await Roles.removeUserFromRoles(userId, ['create', 'read', 'update'], 'admin')

await Roles.userIsInRole('delete', 'admin') // Returns true
await Roles.userIsInGroup(userId, 'admin') // Returns true

// Remove the user from group and all the roles in that group
await Roles.removeUserFromGroup(userId, 'admin')

await Roles.userIsInGroup(userId, 'admin') // Returns false

```

Note: if you omit a `group` parameter in API calls the default group will be used.

### Usage in React

The `roles-react` package provides some useful component called `RoleCheck`. This lets you do role checking within your React components. Below the covers `RoleCheck` is calling `Roles.userIsInRole` and `Roles.userIsInGroup` based on the props you pass it. `group` is always required, `roles` are optional and can be a string or an array of strings.

```javascript
import RoleCheck from 'roles-react';

const Example = () =>
  <div>
    Anyone can see this.
    <RoleCheck roles="view-example" group="admin">
      Only users which pass the role check can see this.
    </RoleCheck>
  </div>
```


### Usage with React Router

To use with `react-router` pass `({ children }) => RoleCheck` as the `component` prop of a `Route`. This will only render the Route's children if the role check passes.

```javascript
const adminRoutes = () => (
  <Route component={({ children }) => <RoleCheck roles="manage" group="user">{children}</RoleCheck>}>
    <Route path="/admin" />
  </Route>
  )
```


## API

**Client**

```javascript
init(options: Object, transport: Object) : void
userIsInRole(roles: String | [String], group: String) : Promise<Boolean>
userIsInGroup(group: String) : Promise<Boolean>
```

**Server**
```javascript

type Role = {
  role: String
  roleId: String
  group: String
  groupId: String
}

type AllRoles = {
  [groupId: String]: {
    groupId: String
    group: String
    roles: {
      [roleId: String] : {
        roleId: String
        role: String
      }
    }  
  }
}

type UserRoles = {
  [roleId: String] : {
    role: String
    group: String
    groupId: String
  }
}

type UserGroups = {
  [groupId: String]: String
}

addUserToRoles(userId: String | [String], roles: String | [String], group: String) : Promise<Boolean>
createRole(role: String, group: String) : Promise<Role>
deleteGroup(group: String) : Promise<void>
deleteRole(role: String, group: String) : Promise<void>
findById(roleId: String) : Promise<Role>
getAll() : Promise<AllRoles>
getGroupsForUser(userId: String): Promise<UserGroups>
getRolesForUser(userId: String): Promise<UserRoles>
getUsersInGroup(group: String): Promise<[String]>
getUsersInRole(role: String, group: String): Promise<[String]>
init(options: Object, store: Object, userResolver: Object) : void
removeUserFromGroup(userId: String | [String], group: String) : Promise<Boolean>
removeUserFromRoles(userId: String | [String], roles: String | [String], group: String) : Promise<Boolean>
roleExists(role: String, group: String): Promise<Boolean>
userIsInGroup(group: String) : Promise<Boolean>
userIsInGroup(userId: String, group: String) : Promise<Boolean>
userIsInRole(userId: String, role: String, group: String) : Promise<Boolean>

```
