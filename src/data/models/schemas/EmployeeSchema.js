import mongoose from 'mongoose';
import * as index from '../index.js';

const Schema = mongoose.Schema;

const EmployeeSchema = new Schema({
    employeeId: { type: String, unique: true },
    services: [{ type: Schema.Types.ObjectId, ref: "services" }],
    userId: { type: Schema.Types.ObjectId, ref: "users" },
    createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
    weeklyAvailability: [{ type: String }]
}, { timestamps: true });

// Pre-save middleware to generate employeeId
EmployeeSchema.pre("save", async function (next) {
    if (!this.employeeId) {
        const counter = await index.models.Counters.findByIdAndUpdate(
            { _id: "employeeId" },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
        );
        this.employeeId = `EMP${counter.sequence_value.toString().padStart(5, "0")}`;
        next();
    }
});

export { EmployeeSchema };