// create vendor
// update vendor
// create coupon
// update coupon
// deactivate coupon

const { createSendToken } = require("../middlewares/authHelpers");
const Coupon = require("../models/coupons");
const Vendor = require("../models/vendor");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { FindVendor } = require("./vendorController");


exports.CreateVendor = catchAsync(async (req, res, next) => {
    const {
        name,
        img,
        phone,
        address,
        category,
        isDistributingCoupon,
        issuanceLimit,
        password,
    } = req.body;

    const existingVendor = FindVendor("", phone);

    if (existingVendor !== null) {
        return res.json({ message: "A vendor exist with this phone number" });
    }

    const createdVendor = await Vendor.create({
        name: name,
        img: img,
        phone: phone,
        address: address,
        category: category,
        password: password,
        isDistributingCoupon: isDistributingCoupon,
        issuanceLimit: issuanceLimit,
    });

    createSendToken(createdVendor, 201, res);
})

exports.GetVendors = catchAsync(async (
    req, res, next
) => {
    const vendors = await Vendor.find();

    if (vendors !== null) {
        return res.json(vendors);
    }

    return res.json({ message: "Vendors data not available" });
})

exports.GetVendorByID = catchAsync(async (
    req, res, next
) => {
    const vendorId = req.params.id;

    const vendors = await Vendor.findById(vendorId).populate("coupons");

    if (vendors !== null) {
        return res.json(vendors);
    }

    return res.json({ message: "Vendors data not available" });
});

exports.UpdateVendor = catchAsync(async (req, res, next) => {
    const {
        name,
        img,
        phone,
        address,
        category,
        isFloater,
        isDistributingCoupon,
        issuanceLimit,
        isActive,
    } = req.body;

    const vendorID = req.params.vendorid;

    if (!vendorID) {
        return next(new AppError("Please provide the Vendor ID!.", 404));
    }

    const existingVendor = await FindVendor(vendorID);

    if (!existingVendor) {
        return next(new AppError("No vendor found with this ID.", 404));
    }

    const updates = {};
    if (name) updates.name = name;
    if (img) updates.img = img;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;
    if (category) updates.category = category;
    if (isFloater !== undefined) updates.isFloater = isFloater;
    if (isDistributingCoupon !== undefined) updates.isDistributingCoupon = isDistributingCoupon;
    if (issuanceLimit !== undefined) updates.issuanceLimit = issuanceLimit;
    if (isActive !== undefined) updates.isActive = isActive;

    const updatedVendor = await Vendor.findByIdAndUpdate(
        vendorID,
        updates,
        { new: true, runValidators: true }
    );

    if (!updatedVendor) {
        return next(new AppError("Vendor couldn't be updated.", 400));
    }

    return res.json(updatedVendor);
})


// <------------ COUPONS ----------------->
exports.CreateCoupon = catchAsync(async (req, res, next) => {
    const { category, floaterID, offerTitle, validityCriteria } = req.body;

    const newCoupon = await Coupon.create({
        floaterID,
        category,
        offerTitle,
        validityCriteria,
        issuedTo: [],
        isCouponActive: true,
    });

    if (!newCoupon) {
        return res.status(404).json({ message: "Coupon couldnt be created!" });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
        floaterID,
        {
            $push: { coupons: newCoupon._id },
        },
        { new: true, runValidators: true }
    );

    res.status(201).json({
        message: "Coupon created for vendor!",
        newCoupon,
        updatedVendor,
    });
})

exports.GetAllCoupons = catchAsync(async (req, res, next) => {
    const coupons = await Coupon.find().sort("-createdAt")

    res.status(200).json({
        message: "success",
        coupons,
    })
})

exports.GetActiveCoupons = catchAsync(async (req, res, next) => {
    const coupons = await Coupon.find({ isCouponActive: true }).sort("-createdAt")

    res.status(200).json({
        message: "success",
        coupons,
    })
})

exports.GetVendorCoupons = catchAsync(async (req, res, next) => {

    const vendorID = req.params.vendorid

    const coupons = await Coupon.find({ floaterID: vendorID, isCouponActive: true }).sort("-createdAt")

    res.status(200).json({
        message: "success",
        coupons,
    })
})

exports.UpdateCoupon = catchAsync(async (req, res, next) => {
    const couponID = req.params.couponid; // Coupon ID from the request parameters
    const { category, offerTitle, validityCriteria } = req.body; // Fields to update

    // Find and update the coupon
    const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponID,
        {
            category,
            offerTitle,
            validityCriteria,
        },
        { new: true, runValidators: true }
    );

    // If no coupon was found
    if (!updatedCoupon) {
        return next(new AppError("No coupon found with that ID", 404));
    }

    // Return success response with updated coupon
    res.status(200).json({
        status: "success",
        message: "Coupon updated successfully!",
        data: {
            coupon: updatedCoupon,
        },
    });
});

exports.DeactivateCoupon = catchAsync(async (req, res, next) => {
    const couponID = req.params.couponid; // Coupon ID from the request parameters

    // Find and update the coupon to deactivate it
    const deactivatedCoupon = await Coupon.findByIdAndUpdate(
        couponID,
        {
            isCouponActive: false,
        },
        { new: true, runValidators: true }
    );

    // If no coupon was found
    if (!deactivatedCoupon) {
        return next(new AppError("No coupon found with that ID", 404));
    }

    // Return success response with deactivated coupon
    res.status(200).json({
        status: "success",
        message: "Coupon deactivated successfully!",
        data: {
            coupon: deactivatedCoupon,
        },
    });
});
