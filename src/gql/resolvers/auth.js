import bcrypt from 'bcrypt';
import nodemailer from "nodemailer";
import { UserInputError } from 'apollo-server-express';
import { OAuth2Client } from 'google-auth-library';
import { isValidEmail, isStrongPassword } from '../../helpers/validations.js';
import { validateAuthToken } from '../auth/jwt.js';
import { LoginType } from '../../data/models/schemas/UsersSchema.js';
import { environmentVariablesConfig } from '../../config/appConfig.js';
import mongoose from 'mongoose';
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

async function sendResetMail(email, resetLink) {
	try {
		// Create transporter for cPanel email
		const transporter = nodemailer.createTransport({
			host: environmentVariablesConfig.smtp_host, // cPanel SMTP host
			port: environmentVariablesConfig.smtp_port, // Convert port to number (465 or 587)
			secure: environmentVariablesConfig.smtp_secure, // true for SSL, false for TLS
			auth: {
				user: environmentVariablesConfig.smtp_auth_user, // Your cPanel email
				pass: environmentVariablesConfig.smtp_auth_pass, // Your cPanel email password
			},
		});

		// Email content
		const mailOptions = {
			from: `"Support Team" <${environmentVariablesConfig.smtp_auth_user}>`,
			to: email,
			subject: "Password Reset Request",
			html: `
				<p>We received a request to reset your password.</p>
				<p>Click the link below to reset your password:</p>
				<a href="${resetLink}" target="_blank">${resetLink}</a>
				<p>If you did not request this, please ignore this email.</p>
				<p>Thank you,<br/>Support Team</p>
			`,
		};

		// Send the email
		const info = await transporter.sendMail(mailOptions);
		console.log("Password reset email sent: ", info.response);

		return { success: true, message: "Password reset link has been sent to your email." };
	} catch (error) {
		console.error("Error sending reset email:", error);
		return { success: false, message: "Failed to send password reset email." };
	}
};

const validateToken = async (token) => {
	try {
		const user = await validateAuthToken(token);
		return ({ success: true, data: user, message: "Suceess" });
	} catch (error) {
		return ({ success: false, data: null, message: error.message });
	}
};

export default {
	Query: {
	},
	Mutation: {
		registerUser: async (parent, { input }, context) => {
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

			const serializeUserId = user?._id?.toString();

			return {
				token: context.di.jwt.createAuthToken(serializeUserId)
			};
		},
		loginUser: async (parent, { input }, context) => {
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

				const serializeUserId = user?._id?.toString();

				return {
					token: context.di.jwt.createAuthToken(serializeUserId)
				};
			} else {
				throw new UserInputError('Invalid login type');
			}
		},
		deleteMyUserAccount: async (parent, args, context) => {
			context.di.authValidation.ensureThatUserIsLogged(context);

			const user = await context.di.authValidation.getUser(context);

			return context.di.model.Users.deleteOne({ uuid: user.uuid });
		},
		forgotPassword: async (_, { email }, context) => {
			try {
				// Check if user exists
				const user = await context.di.model.Users.findOne({ email, isActive: true }).lean();
				if (!user) {
					throw new UserInputError('The email address you entered is not associated with any account in our system. Please check for typos or try a different email.');
				}

				// Generate a reset token (You can use JWT or crypto for this)
				const resetToken = await context.di.jwt.createAuthToken(user?._id);
				const resetLink = (`${environmentVariablesConfig.ResetLinkUrl}${resetToken}`);

				// Send reset email
				const { success, message } = await sendResetMail(email, resetLink);
				if (!success) {
					throw new Error(message);
				}

				return { message };
			} catch (error) {
				console.error("Forgot Password Error:", error);
				throw new Error(error.message ?? "Something went wrong. Please try again.");
			}
		},
		resetPassword: async (_, { token, password }, context) => {
			try {
				// Validate token
				const { success, data, message } = await validateToken(token);
				if (!success) throw new UserInputError(message);

				if (!password || !isStrongPassword(password)) {
					throw new UserInputError('A strong password is required.');
				}

				// Validate user ID
				if (!mongoose.Types.ObjectId.isValid(data?.userId)) {
					throw new UserInputError('Invalid user ID.');
				}

				// Hash new password
				const hashedPassword = await bcrypt.hash(password, 10);

				// Update user password directly
				const user = await context.di.model.Users.findByIdAndUpdate(
					data.userId,
					{ password: hashedPassword },
					{ new: true }
				);

				if (!user || !user.isActive) {
					throw new UserInputError('User not found or inactive.');
				}

				return { message: "Password reset successfully" };
			} catch (error) {
				console.error("Error:", error);
				throw new Error(error.message ?? "Something went wrong. Please try again.");
			}
		}
	}
};
