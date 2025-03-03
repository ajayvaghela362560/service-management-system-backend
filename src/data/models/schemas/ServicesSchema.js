import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ServicesSchema = new Schema({
    name: {
        type: String,
        required: false
    },
    price: {
        type: String,
        required: false
    },
    duration: {
        type: String,
        required: false,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    description: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        required: false,
        default: true
    }
}, { timestamps: true });

export { ServicesSchema };
