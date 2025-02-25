import dotenv from 'dotenv';
dotenv.config();

import { ENVIRONMENT } from './environment.js';

const serverPortByDefault = 4000;
const limitOfUsersRegistered = 0;

export const environmentVariablesConfig = Object.freeze({
	formatConnection: process.env.MONGO_FORMAT_CONNECTION || 'standard',
	mongoDNSseedlist: process.env.MONGO_DNS_SEEDLIST_CONNECTION || '',
	dbHost: process.env.MONGO_HOST || '127.0.0.1',
	dbPort: process.env.MONGO_PORT || '27017',
	database: process.env.MONGO_DB || 'service_management_system',
	mongoUser: process.env.MONGO_USER || '',
	mongoPass: process.env.MONGO_PASS || '',
	environment: (process.env.ENVIRONMENT === ENVIRONMENT.DEVELOPMENT) ? ENVIRONMENT.DEVELOPMENT : ENVIRONMENT.PRODUCTION,
	port: Number(process.env.PORT) || serverPortByDefault,
	ResetLinkUrl: process.env.FRONTEND_RESET_LINK_URL || '',
});

export const securityVariablesConfig = Object.freeze({
	secret: process.env.SECRET || 'yoursecret',
	timeExpiration: process.env.DURATION || '2h'
});

export const globalVariablesConfig = Object.freeze({
	limitOfUsersRegistered: Number(process.env.LIMIT_USERS_REGISTERED) || limitOfUsersRegistered
});
