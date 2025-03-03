import mongoose from 'mongoose';
import { CounterSchema, ServicesSchema, UsersSchema, EmployeeSchema } from './schemas/index.js';

export const models = {
	Users: mongoose.model('users', UsersSchema),
	Services: mongoose.model('services', ServicesSchema),
	Counters: mongoose.model("counters", CounterSchema),
	Employees: mongoose.model("employees", EmployeeSchema),
};
