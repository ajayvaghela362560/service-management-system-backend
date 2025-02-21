import { gql } from 'apollo-server-express';

export default /* GraphQL */ gql`
	type Token {
		token: String
	}

	input RegisterUserInput {
		email: String
		password: String
		firstName: String
		lastName: String
		phoneNumber: String
		loginType: String!
		userRole: String!		
		googleToken: String
	}

	input LoginUserInput {
		email: String
		password: String
		loginType: String!
		googleToken: String
	}


	type Mutation {
		""" It allows users to register """
		registerUser(input: RegisterUserInput!): Token

		""" It allows users to authenticate """
		loginUser(input: LoginUserInput!): Token

		""" It allows to user to delete their account permanently """
		deleteMyUserAccount: DeleteResult
	}
`;