import { AuthenticationError } from "apollo-server-express";
import { validateAuthToken } from "../../gql/auth/jwt.js";
import { models } from '../../data/models/index.js';
import mongoose from "mongoose";

const authMiddleware = (resolver) => {
    return async (parent, args, context, info) => {
        const token = context.req.headers.authorization;

        if (!token) {
            throw new AuthenticationError("Authentication token is required");
        }

        try {
            // Verify token (Replace "YOUR_SECRET_KEY" with your actual secret key)
            const decoded = await validateAuthToken(token?.replace("Bearer ", ""));

            const _id = new mongoose.Types.ObjectId(decoded.userId);
            const user = await models.Users.findOne({ _id, isActive: true }).lean();
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action');
            }

            // Attach user to context
            context.user = user;

            // Proceed with the resolver
            return resolver(parent, args, context, info);
        } catch (error) {
            throw new AuthenticationError(error.message ?? "Invalid or expired token");
        }
    };
};

export default authMiddleware;
