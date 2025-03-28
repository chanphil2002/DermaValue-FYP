import { InferSchemaType, Schema, model } from 'mongoose';

const appointmentSchema = new Schema({
    email: { type: String, required: true },
    name: { type: String },
}, { timestamps: true });

type Appointment = InferSchemaType<typeof appointmentSchema>;

export default model<Appointment>('Appointment', appointmentSchema);

