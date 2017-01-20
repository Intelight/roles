// import { Component, PropTypes } from 'react';
// import Roles from './roles';
//
// class RoleCheck extends Component {
//   static propTypes = {
//     children: PropTypes.node.isRequired,
//     roles: PropTypes.oneOfType([
//       PropTypes.string,
//       PropTypes.array,
//     ]),
//     group: PropTypes.string.isRequired,
//     userId: PropTypes.string.isRequired,
//   }
//   constructor(props, context) {
//     super(props, context);
//     this.state = {
//       isLoading: true,
//       hasAccess: false,
//     };
//   }
//   componentDidMount() {
//     const { roles, group, userId } = this.props;
//     // TODO Catch and handle promise error
//     const promise = roles
//       ? Roles.userIsInRole(userId, roles, group)
//       : Roles.userIsInGroup(userId, group);
//     promise.then((res) => {
//       this.setState({
//         isLoading: false,
//         hasAccess: res,
//       });
//     });
//   }
//   render() {
//     return this.state.hasAccess && this.props.children;
//   }
// }
//
// export default RoleCheck;
