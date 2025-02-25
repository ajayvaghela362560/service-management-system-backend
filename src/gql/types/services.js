import { gql } from 'apollo-server-express';

export default gql`
	type Service {
		id: String
		name: String
		price: String
		duration: String
	}

	type Service_Mutation_Response {
		message: String
		result: Service
	}
	
	type Service_Query_Response {
		total_services: Int!
		services: [Service!]!
	}

	input ServiceInput {
		id: String
		name: String!
		price: String!
		duration: String!
	}

	type Query {
		""" Get a service by its ID """
		getServiceById(id: String!): Service

		""" Get all services """
		getAllServices(page: Int, limit: Int, search: String): Service_Query_Response
	}

	type Mutation {
		""" Add New Services """
		AddService(input: ServiceInput!): Service_Mutation_Response

		""" Edit New Services """
		EditService(input: ServiceInput!): Service_Mutation_Response
	}
`;