import { AuthenticationError, UserInputError } from 'apollo-server-express';
import mongoose from 'mongoose';
import { LoginType, UserRole } from '../../data/models/schemas/UsersSchema.js';
import bcrypt from 'bcrypt';
import { sendEMail } from '../../helpers/mailSend.js';
import { environmentVariablesConfig } from '../../config/appConfig.js';

function generatePassword(length = 12) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:.<>?";
    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }

    return password;
}

export default {
    Query: {
    },
    Mutation: {
        addEmployee: async (parent, { input }, context) => {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const user = await context.di.authValidation.getUser(context);

                // Check if the user is authenticated
                if (!user) {
                    throw new AuthenticationError('You must be logged in to perform this action.');
                }

                const { email, firstName, lastName, profileUrl, services, weeklyAvailability } = input;
                const randomGeneratedPassword = generatePassword(16);
                const hashedPassword = await bcrypt.hash(randomGeneratedPassword, 10);
                let userData = {
                    email,
                    firstName,
                    lastName,
                    password: hashedPassword,
                    profileUrl,
                    loginType: LoginType.EmailAndPassword,
                    userRole: UserRole.Employee
                };

                // Save user details
                const newUser = new context.di.model.Users(userData);
                await newUser.save({ session });

                const servicesIds = services?.map(id => new mongoose.Types.ObjectId(id));

                let employeeData = {
                    userId: newUser?._id,
                    services: servicesIds,
                    createdBy: user?._id,
                    weeklyAvailability
                };

                // save employee details
                const newEmployee = new context.di.model.Employees(employeeData);
                await newEmployee.save({ session });

                await session.commitTransaction();

                // send mail with mailoptions
                const mailOptions = {
                    from: `Support Team <${environmentVariablesConfig.smtp_auth_user}>`,
                    to: newUser.email,
                    subject: "Welcome! Your New Login Credentials",
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <h2 style="color: #333; text-align: center;">Welcome to Our Platform</h2>
                            <p>Dear User,</p>
                            <p>Your account has been successfully created. You can log in using the credentials below:</p>
                            <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
                                <p><strong>Email:</strong> ${newUser.email}</p>
                                <p><strong>Password:</strong> ${randomGeneratedPassword}</p>
                            </div>
                            <p>To access your account, click the button below:</p>
                            <div style="text-align: center; margin: 20px 0;">
                                <a href="${environmentVariablesConfig.business_panel_login_url}" target="_blank" style="background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; display: inline-block;">
                                    Login Now
                                </a>
                            </div>
                            <p>For security reasons, we recommend changing your password after your first login.</p>
                            <p>If you have any questions, feel free to reach out to our support team.</p>
                            <p>Best regards,</p>
                            <p><strong>Support Team</strong></p>
                        </div>
                    `,
                };
                await sendEMail(mailOptions);

                return {
                    message: `Employee created successfully.`,
                };

            } catch (error) {
                await session.abortTransaction();
                console.error("Error :", error);
                throw new Error(error.message ?? "Something went wrong. Please try again.");
            } finally {
                session.endSession();
            }
        },
    },
};
