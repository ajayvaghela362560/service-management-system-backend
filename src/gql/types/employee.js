import { gql } from 'apollo-server-express';

export default gql`
	type Employee_Mutation_Response {
		message: String
	}

	input EmployeeInput {
		id: String
		email: String!
		firstName: String!
		lastName: String!
		profileUrl:	String!
		services: [String!]
		weeklyAvailability: [String!]
	}

	type Mutation {
		""" Add New Employees """
		addEmployee(input: EmployeeInput!): Employee_Mutation_Response		
	}
`;