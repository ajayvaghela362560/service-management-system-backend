import { AuthenticationError, ForbiddenError, ValidationError } from 'apollo-server-express';
import { models } from '../../data/models/index.js';
import { globalVariablesConfig } from '../../config/appConfig.js';
import mongoose from 'mongoose';

export const authValidations = {
	ensureLimitOfUsersIsNotReached: (numberOfCurrentlyUsersRegistered) => {
		const usersLimit = globalVariablesConfig.limitOfUsersRegistered;
		if (usersLimit === 0) {
			return;
		}

		if (numberOfCurrentlyUsersRegistered >= usersLimit) {
			throw new ValidationError('The maximum number of users allowed has been reached. You must contact the administrator of the service in order to register');
		}
	},

	ensureThatUserIsLogged: (context) => {
		if (!context.user) {
			throw new AuthenticationError('You must be logged in to perform this action');
		}
	},

	ensureThatUserIsAdministrator: (context) => {
		if (!context.user || !context.user.isAdmin) {
			throw new ForbiddenError('You must be an administrator to perform this action');
		}
	},

	getUser: async (context) => {
		if (!context.user) {
			return null;
		}
	
		const userId = context.user.userId || null;
		const _id = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : "";
		const user = await models.Users.findOne({ _id, isActive: true }).lean();
		if (!user) {
			throw new AuthenticationError('You must be logged in to perform this action');
		}

		return user;
	},
};