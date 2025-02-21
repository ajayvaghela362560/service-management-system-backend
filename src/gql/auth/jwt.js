import jwt from 'jsonwebtoken';

import { securityVariablesConfig } from '../../config/appConfig.js';

export const createAuthToken = (userId) => {
	return jwt.sign({ userId }, securityVariablesConfig.secret, { expiresIn: securityVariablesConfig.timeExpiration });
};

export const validateAuthToken = async (token) => {
	const user = jwt.verify(token, securityVariablesConfig.secret);
	return user;
};