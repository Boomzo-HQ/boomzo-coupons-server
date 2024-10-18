const mongoose = require("mongoose")

const IssuanceRequestSchema = new mongoose.Schema(
    {
        couponID: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
        customerID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        issuerID: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
        floaterID: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
        isAccepted: { type: Boolean, default: false },
        issuedOn: { type: Date },
        hasAskedRedemption: { type: Boolean, default: false },
        isRedeemed: { type: Boolean, default: false },
        redeemedOn: { type: Date },
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

const IssuanceRequest = mongoose.model("IssuanceRequest", IssuanceRequestSchema);

module.exports = IssuanceRequest;
