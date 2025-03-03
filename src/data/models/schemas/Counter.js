import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const CounterSchema = new Schema({
  _id: String,
  sequence_value: Number,
});

export { CounterSchema };