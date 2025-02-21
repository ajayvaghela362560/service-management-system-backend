import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
	type User {
		email: String
		isActive: Boolean
		userRole: String		
	}

	type Query {
		""" Get list of all users registered on database """
		listAllUsers: [User]
	}
`;