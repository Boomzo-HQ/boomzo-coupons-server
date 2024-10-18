const { Schema, model } = require("mongoose")

const CouponSchema = new Schema(
    {
        floaterID: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
        category: {
            type: String,
            enum: Object.values(VendorCategory),
            required: true,
        },
        offerTitle: { type: String, required: true },
        validityCriteria: { type: String, required: true },
        issuedTo: [
            {
                type: Schema.Types.ObjectId,
                ref: "IssuanceRequest",
                required: true,
            },
        ],
        isCouponActive: { type: Boolean, default: true },
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
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

const Coupon = model("Coupon", CouponSchema);

module.exports = Coupon;
