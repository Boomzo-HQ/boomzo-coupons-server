// create account
// protect customer
// get my coupons
// get coupons category wise and vendor wise
// create issue req
// create redeem request

const Coupon = require("../models/coupons");
const Customer = require("../models/customer");
const IssuanceRequest = require("../models/issuanceRequest");
const Vendor = require("../models/vendor");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { FindVendor } = require("./vendorController");

// helper function
const FindCustomer = catchAsync(async (id, phone) => {
    if (phone) {
        return await Customer.findOne({ phone: phone });
    } else {
        return await Customer.findById(id);
    }
})


exports.CreateCustomer = catchAsync(async (req, res, next) => {
    const { name, phone } = req.body;

    const existingCustomer = await Customer.findOne({ phone: phone })

    if (existingCustomer !== null) {
        return res.json({
            message: "A account exist with this phone number already!",
        });
    }

    const createdCustomer = await Customer.create({
        name: name,
        phone: phone,
    });

    return res.json(createdCustomer);
})

exports.GetCustomerCoupons = catchAsync(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
    }

    const customer = await Customer.findOne({ phone: phone }).populate("coupons");

    if (customer == null) {
        return res.json({
            message: "No account exist with this phone number!",
        });
    }

    res.json({
        message: "Customer coupons found!",
        customer,
    });
})

// GET /api/vendors/615f9e43784f4a3e24b8c4f8/coupons?page=2
exports.GetVendorDistributedCoupons = catchAsync(async (req, res, next) => {
    const vendorID = req.params.vendorid;

    if (!vendorID) {
        return res.json({
            message: "Please provide a vendor ID!",
        });
    }

    const vendor = await Vendor.findById(vendorID);

    if (!vendor) {
        return res.json({
            message: "No vendor exisits with this vendor id!",
        });
    }

    if (vendor.issuanceLimit <= 0 || !vendor.isDistributingCoupon) {
        return next(new AppError("The vendor isnt eligible to provide coupons anymore."))
    }

    const vendorCategory = vendor.category;

    // Pagination queries
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 6; // Limit to 6 coupons per load
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    // Query for coupons not matching the vendor's category with pagination
    const coupons = await Coupon.find({
        category: { $ne: vendorCategory },
    })
        .skip(skip)
        .limit(limit);

    if (coupons.length === 0) {
        return res.status(404).json({ message: "No coupons found." });
    }

    // Increment impressions for the queried coupons
    await Promise.all(
        coupons.map((coupon) =>
            Coupon.findByIdAndUpdate(
                coupon._id,
                { $inc: { impressions: 1 } },
                { new: true }
            )
        )
    );

    // Count total matching coupons for pagination
    const totalCoupons = await Coupon.countDocuments({
        category: { $ne: vendorCategory },
    });

    // Return paginated coupons with metadata
    return res.status(200).json({
        coupons,
        totalCoupons,
        currentPage: page,
        totalPages: Math.ceil(totalCoupons / limit),
    });
})

// GET /api/vendors/615f9e43784f4a3e24b8c4f8/coupons/615f9e43784f4a3e24b8c4f8
exports.GetCouponById = catchAsync(async (req, res, next) => {
    const { vendorid, couponid } = req.params;
    if (!vendorid || !couponid) {
        return res.json({
            message: "Please provide a vendor ID and coupon ID!",
        });
    }
    const coupon = await Coupon.findById(couponid);

    if (!coupon) {
        return res.json({
            message: "No coupon exisits with this coupon id!",
        });
    }
    res.json({
        message: "Coupon found!",
        coupon,
    });
})

// check if coupon is valid
// check if issuer has valid issue limit (>0)
exports.CreateIssueRequest = catchAsync(async (req, res, next) => {
    const { customerID, couponID, issuerID, floaterID } = req.body;
    console.log("Test")
    console.log(req.body);

    if (!customerID) {
        return res.json({
            message: "Please login in or create your account! Coustomer ID not valid",
        });
    }

    const customer = await Customer.findById(customerID);

    if (!customer) {
        return res.json({
            message: "Please login in or create your account!",
        });
    }

    const newIssuanceRequest = await IssuanceRequest.create({
        couponID,
        customerID,
        issuerID,
        floaterID,
    });

    if (!newIssuanceRequest) {
        return res.json({
            message: "Couldn't create request! Try again!",
        });
    }

    res.status(200).json({
        message: "Issue request sent to vendor",
    });
})

// create redeem request
exports.CreateRedeemRequest = catchAsync(async (
    req,
    res,
    next
) => {
    const { issuanceID } = req.body;

    if (!issuanceID) {
        return res.json({
            message: "Please login in or create your account!",
        });
    }

    const updatedIssuanceRequest = await IssuanceRequest.findByIdAndUpdate({
        hasAskedRedemption: true
    });

    if (!updatedIssuanceRequest) {
        return res.json({
            message: "Couldn't create request! Try again!",
        });
    }

    res.status(200).json({
        message: "Issue request sent to vendor",
    });
})