import mongoose from 'mongoose';
import { ServicesSchema, UsersSchema } from './schemas/index.js';

export const models = {
	Users: mongoose.model('users', UsersSchema),
	Services: mongoose.model('services', ServicesSchema),
};
