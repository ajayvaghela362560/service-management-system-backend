import { AuthenticationError, UserInputError } from 'apollo-server-express';
import mongoose from 'mongoose';

export default {
    Query: {
        // Get a service by ID
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
        // Get all services
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
    },
    Mutation: {
        // Add a new service
        AddService: async (parent, { input }, context) => {
            const user = await context.di.authValidation.getUser(context);

            // Check if the user is authenticated
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action.');
            }

            const { name, price, duration } = input;

            if (!name || !price || !duration) {
                throw new UserInputError('All fields (name, price, duration) are required.');
            }

            const newService = new context.di.model.Services({
                name,
                price,
                duration,
                createdBy: user._id
            });

            await newService.save();

            return {
                message: 'Service added successfully!',
                result: newService,
            };
        },

        // Edit an existing service
        EditService: async (parent, { input }, context) => {
            const user = await context.di.authValidation.getUser(context);

            // Check if the user is authenticated
            if (!user) {
                throw new AuthenticationError('You must be logged in to perform this action.');
            }
            
            const { id, name, price, duration } = input;

            if (!id) {
                throw new UserInputError('Service ID is required for editing.');
            }

            const existingService = await context.di.model.Services.findById(id);
            if (!existingService) {
                throw new UserInputError('Service not found.');
            }

            existingService.name = name || existingService.name;
            existingService.price = price || existingService.price;
            existingService.duration = duration || existingService.duration;

            await existingService.save();

            return {
                message: 'Service updated successfully!',
                result: existingService,
            };
        },
    },
};
