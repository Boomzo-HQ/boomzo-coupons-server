const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const VendorCategory = require("../utils/categories");

const VendorSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        img: { type: String },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        category: {
            type: String,
            enum: VendorCategory,
            required: true,
        },
        password: { type: String, required: true },
        isFloater: { type: String, default: false },
        coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true }],
        isDistributingCoupon: { type: Boolean, default: false },
        issuanceLimit: { type: Number },
        isActive: { type: Boolean, default: true },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
    },
    {
        toJSON: {
            transform(doc, ret) {
                delete ret.__v;
                delete ret.password;
                delete ret.salt;
            },
        },
        timestamps: true,
    }
);

VendorSchema.pre("save", async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified("password")) return next();

    // Hashing the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    next();
});

VendorSchema.pre("save", function (next) {
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

VendorSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

VendorSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    // NOT changed
    return false;
};

// create password reset token func
VendorSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    console.log({ resetToken }, this.passwordResetToken);

    // date + 10 mins
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const Vendor = mongoose.model("Vendor", VendorSchema);

module.exports = Vendor;
