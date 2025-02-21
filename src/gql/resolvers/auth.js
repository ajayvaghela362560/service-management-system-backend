import { UserInputError } from 'apollo-server-express';
import bcrypt from 'bcrypt';
import { isValidEmail, isStrongPassword } from '../../helpers/validations.js';
import { LoginType } from '../../data/models/schemas/UsersSchema.js';
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// validate email and check if user already exists
async function validateAndCheckUserExistence(email, model) {
	if (!email || !isValidEmail(email)) {
		throw new UserInputError('Valid email is required');
	}

	const existingUser = await model.Users.findOne({ email, isActive: true }).lean();
	if (existingUser) {
		throw new UserInputError('Email is already registered');
	}
}

export default {
	Query: {
	},
	Mutation: {

		registerUser: async (parent, {input}, context) => {
			const { email, password, firstName, lastName, phoneNumber, loginType, userRole, googleToken } = input;

			let userData = { email, firstName, lastName, phoneNumber, loginType, userRole };

			// Process data based on loginType
			if (loginType === LoginType.Google) {
				if (!googleToken) {
					throw new UserInputError('Google token is required for Google login');
				}

				// Verify Google token
				const ticket = await client.verifyIdToken({
					idToken: googleToken,
					audience: process.env.GOOGLE_CLIENT_ID
				});

				const payload = ticket.getPayload();

				if (!payload || payload.email !== email) {
					throw new UserInputError('Google authentication failed');
				}

				await validateAndCheckUserExistence(payload?.email, context.di.model);

				// Use Google name if not provided
				userData.firstName = firstName || payload.given_name;
				userData.lastName = lastName || payload.family_name;

			} else if (loginType === LoginType.EmailAndPassword) {

				await validateAndCheckUserExistence(email, context.di.model);

				if (!password || !isStrongPassword(password)) {
					throw new UserInputError('A strong password is required');
				}

				// Hash password before saving
				userData.password = await bcrypt.hash(password, 10);
			} else {
				throw new UserInputError('Invalid login type');
			}

			// Save user in the database
			const newUser = new context.di.model.Users(userData);
			await newUser.save();

			// Fetch saved user
			const user = await context.di.model.Users.findOne({ email, isActive: true }).lean();

			// Generate Token and return response
			return {
				token: context.di.jwt.createAuthToken(user._id)
			};
		},
		loginUser: async (parent, {input}, context) => {
			const { email, password, loginType, googleToken } = input;

			// Process data based on loginType
			if (loginType === LoginType.Google) {
				if (!googleToken) {
					throw new UserInputError('Google token is required for Google login');
				}

				// Verify Google token
				const ticket = await client.verifyIdToken({
					idToken: googleToken,
					audience: process.env.GOOGLE_CLIENT_ID
				});

				const payload = ticket.getPayload();

				if (!payload || !payload?.email) {
					throw new UserInputError('Google authentication failed');
				}

				const user = await context.di.model.Users.findOne({ email: payload?.email, loginType, isActive: true }).lean();

				if (!user) {
					throw new UserInputError('User not found or login not allowed');
				}

				return {
					token: context.di.jwt.createAuthToken(user._id)
				};

			} else if (loginType === LoginType.EmailAndPassword) {

				if (!email || !password) {
					throw new UserInputError('Invalid credentials');
				}

				const user = await context.di.model.Users.findOne({ email, loginType, isActive: true }).lean();

				if (!user) {
					throw new UserInputError('User not found or login not allowed');
				}

				const isCorrectPassword = await bcrypt.compare(password, user.password);

				if (!isCorrectPassword) {
					throw new UserInputError('Invalid credentials');
				}

				return {
					token: context.di.jwt.createAuthToken(user._id)
				};
			} else {
				throw new UserInputError('Invalid login type');
			}
		},
		/**
		 * It allows to user to delete their account permanently (this action does not delete the records associated with the user, it only deletes their user account)
		 */
		deleteMyUserAccount: async (parent, args, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			const user = await context.di.authValidation.getUser(context);

			return context.di.model.Users.deleteOne({ uuid: user.uuid });
		}
	}
};
