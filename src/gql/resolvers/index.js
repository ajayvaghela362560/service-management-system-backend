import merge from 'lodash.merge';

import users from './users.js';
import auth from './auth.js';
import services from './services.js';

export const resolvers = merge(
	users,
	auth,
	services
);
