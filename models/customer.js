const { Schema, model } = require("mongoose")

// Define the Customer schema
const CustomerSchema = new Schema(
    {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        coupons: [
            {
                type: Schema.Types.ObjectId,
                ref: "IssuanceRequest",
                required: true,
            },
        ],
    },
    {
        toJSON: {
            transform(doc, ret) {
                delete ret.__v;
            },
        },
        timestamps: true,
    }
);

const Customer = model("Customer", CustomerSchema);

module.exports = Customer;
