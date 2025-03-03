import mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const UserRole = {
	User: 'User',
	Admin: 'Admin',
	Business: 'Business',
	Employee: 'Employee',
};

export const LoginType = {
	Google: 'Google',
	EmailAndPassword: 'EmailAndPassword'
};

const UsersSchema = new Schema({
	firstName: {
		type: String,
		required: false
	},
	lastName: {
		type: String,
		required: false
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	password: {
		type: String,
		required: false,
		default: null
	},
	phoneNumber: {
		type: String,
		required: false
	},
	profileUrl: {
		type: String,
		required: false
	},
	loginType: {
		type: String,
		enum: Object.keys(LoginType),
		required: true,
		default: LoginType.EmailAndPassword
	},
	isActive: {
		type: Boolean,
		required: false,
		default: true
	},
	userRole: {
		type: String,
		enum: Object.keys(UserRole),
		required: true,
		default: UserRole.User
	}
}, { timestamps: true });

export { UsersSchema };
