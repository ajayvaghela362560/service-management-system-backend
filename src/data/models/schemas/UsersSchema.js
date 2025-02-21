import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

export const UserRole = {
	User: 'User',
	Admin: 'Admin',
	Business: 'Business'
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

// UsersSchema.pre('save', function (next) {
// 	if (!this.isModified('password')) {
// 		return next();
// 	}
// 	bcrypt.genSalt((err, salt) => {
// 		if (err) {
// 			return next(err);
// 		}
// 		bcrypt.hash(this.password, salt, (err, hash) => {
// 			if (err) {
// 				return next(err);
// 			}
// 			this.password = hash;
// 			next();
// 		});
// 	});
// });

export { UsersSchema };
