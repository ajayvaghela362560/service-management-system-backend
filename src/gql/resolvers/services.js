import { AuthenticationError, UserInputError } from 'apollo-server-express';
import mongoose from 'mongoose';
import authMiddleware from '../../helpers/middlewares/auth.js';

export default {
    Query: {
        getServiceById: async (parent, { id }, context) => {
            const user = await context.di.authValidation.getUser(context);

            // Check if the user is authenticated
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action.');
            }

            if (!id) {
                throw new UserInputError('Service ID is required.');
            }

            const serviceId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : "";

            const service = await context.di.model.Services.findById(serviceId);
            if (!service) {
                throw new UserInputError('Service not found.');
            }

            return service;
        },
        getAllServices: async (_, { page = 1, limit = 10, search = "" }, context) => {
            const user = await context.di.authValidation.getUser(context);

            // Ensure the user is authenticated
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action.');
            }

            // Define base filter
            let filter = { createdBy: user._id, isActive: true };

            // Apply search condition if provided
            if (search) {
                filter.name = { $regex: search, $options: "i" }; // Case-insensitive search
            }

            const pipeline = [
                { $match: filter },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        metadata: [{ $count: "total_services" }],
                        services: [
                            { $skip: (page - 1) * limit },
                            { $limit: limit },
                            {
                                $project: {
                                    _id: 0,
                                    id: "$_id",
                                    name: 1,
                                    price: 1,
                                    duration: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        total_services: { $arrayElemAt: ["$metadata.total_services", 0] },
                        services: 1
                    }
                }
            ];

            const result = await context.di.model.Services.aggregate(pipeline);

            return result[0] || { total_services: 0, services: [] };
        },
        fetchServicesWithoutPagination: authMiddleware(async (_, { }, context) => {

            // Define base filter
            let filter = { createdBy: context?.user?._id, isActive: true };

            const pipeline = [
                { $match: filter },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        metadata: [{ $count: "total_services" }],
                        services: [
                            {
                                $project: {
                                    _id: 0,
                                    id: "$_id",
                                    name: 1,
                                    price: 1,
                                    duration: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        total_services: { $arrayElemAt: ["$metadata.total_services", 0] },
                        services: 1
                    }
                }
            ];

            const result = await context.di.model.Services.aggregate(pipeline);

            return result[0] || { total_services: 0, services: [] };
        }),
    },
    Mutation: {
        AddService: async (parent, { input }, context) => {
            const user = await context.di.authValidation.getUser(context);

            // Check if the user is authenticated
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action.');
            }

            const { name, price, duration, description } = input;

            if (!name || !price || !duration || !description) {
                throw new UserInputError('All fields are required.');
            }

            // Check if the same name service already exist
            const alreadyExistService = await context.di.model.Services.findOne({ name, createdBy: user._id });
            if (alreadyExistService) {
                throw new UserInputError('This service name is alredy exist.');
            }

            const newService = new context.di.model.Services({
                name,
                price,
                duration,
                description,
                createdBy: user._id
            });

            await newService.save();

            return {
                message: 'Service added successfully!',
                result: newService,
            };
        },
        EditService: async (parent, { input }, context) => {
            const user = await context.di.authValidation.getUser(context);

            // Check if the user is authenticated
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action.');
            }

            const { id, name, price, duration, description } = input;

            if (!id) {
                throw new UserInputError('Service ID is required for editing.');
            }

            const existingService = await context.di.model.Services.findById(id);
            if (!existingService) {
                throw new UserInputError('Service not found.');
            }

            // Check if the same name service already exists (excluding the current service)
            const alreadyExistService = await context.di.model.Services.findOne({
                name,
                createdBy: user._id,
                _id: { $ne: id }
            });

            if (alreadyExistService) {
                throw new UserInputError('This service name already exists.');
            }

            existingService.name = name || existingService.name;
            existingService.price = price || existingService.price;
            existingService.duration = duration || existingService.duration;
            existingService.description = description || existingService.description;

            await existingService.save();

            return {
                message: 'Service updated successfully!',
                result: existingService,
            };
        },
        deleteService: async (_, { id }, context) => {
            const user = await context.di.authValidation.getUser(context);

            // Check if the user is authenticated
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action.');
            }

            const existingService = await context.di.model.Services.findById(id);
            if (!existingService) {
                throw new UserInputError('Service not found.');
            }

            // Delete the service
            await context.di.model.Services.findByIdAndDelete(id);

            return {
                message: 'Service deleted successfully!',
            };
        },
    },
};
