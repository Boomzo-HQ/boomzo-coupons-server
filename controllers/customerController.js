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


exports.CreateCustomer = catchAsync(async (req, res, next) => {
    const { name, phone, pin } = req.body;

    const existingCustomer = await Customer.findOne({ phone: phone, pin: pin })

    if (existingCustomer !== null) {
        return res.json({
            message: "We found an account with this number!",
            customer: existingCustomer
        });
    }

    const createdCustomer = await Customer.create({
        name: name,
        phone: phone,
        pin: pin
    });

    return res.json({
        message: "New account has been created as there was no existing account with this number!",
        customer: createdCustomer
    });
})

exports.SigninCustomer = catchAsync(async (req, res, next) => {
    const { phone } = req.body;

    const existingCustomer = await Customer.findOne({ phone: phone })

    if (existingCustomer == null) {
        return res.json({
            message: "No account exist with this phone number. Please create an account!",
        });
    }

    return res.json(existingCustomer);
})

exports.GetCustomerCoupons = catchAsync(async (req, res, next) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
    }

    const customer = await Customer.findOne({ phone: phone }).populate({
        path: 'coupons',
        populate: {
            path: 'couponID', // This will populate the `couponID` field inside each `coupon`
            model: 'Coupon',  // Assuming the Coupon model is what you want to populate
        },
    });

    if (customer == null) {
        return res.json({
            message: "No account exist with this phone number!",
        });
    }

    res.status(200).json({
        message: "Customer coupons found!",
        customer,
    });
})

// GET /api/vendors/615f9e43784f4a3e24b8c4f8/coupons?page=2
exports.GetVendorDistributedCoupons = catchAsync(async (req, res, next) => {
    const vendorID = req.params.vendorid;
    const categoryFilter = req.query.category;

    if (!vendorID) {
        return res.json({
            message: "Please provide a vendor ID!",
        });
    }

    const vendor = await Vendor.findById(vendorID);

    if (!vendor) {
        return res.json({
            message: "No such boomzo partner exisits!",
        });
    }

    if (!vendor.isActive) {
        return res.json({
            message: `${vendor.name} has unsubscribed from our services!`,
        });
    }

    if (vendor.issuanceLimit <= 0 || !vendor.isDistributingCoupon) {
        return next(new AppError(`${vendor.name} isnt eligible to provide coupons anymore.`))
    }

    const vendorCategory = vendor.category;

    // Pagination queries
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = 6; // Limit to 6 coupons per load
    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    const query = {
        isCouponActive: true,
        category: { $ne: vendorCategory },
        floaterId: { $ne: vendorID },
    };


    if (categoryFilter) {
        query.category = categoryFilter;
    }


    // Query for coupons not matching the vendor's category with pagination
    const coupons = await Coupon.find(query)
    // .skip(skip)
    // .limit(limit);

    // if (coupons.length === 0) {
    //     return res.status(404).json({ message: "No coupons found." });
    // }

    // Increment impressions for the queried coupons
    // await Promise.all(
    //     coupons.map((coupon) =>
    //         Coupon.findByIdAndUpdate(
    //             coupon._id,
    //             { $inc: { impressions: 1 } },
    //             { new: true }
    //         )
    //     )
    // );

    // Count total matching coupons for pagination
    // const totalCoupons = await Coupon.countDocuments({
    //     category: { $ne: vendorCategory },
    //     floaterId: { $ne: vendorID },
    //     isCouponActive: true,
    // });

    // Return paginated coupons with metadata
    res.status(200).json({
        vendor,
        coupons,
        // totalCoupons,
        // currentPage: page,
        // totalPages: Math.ceil(totalCoupons / limit),
    });

    setImmediate(async () => {
        try {
            await Promise.all(
                coupons.map((coupon) =>
                    Coupon.findByIdAndUpdate(
                        coupon._id,
                        { $inc: { impressions: 1 } },
                        { new: true }
                    )
                )
            );
        } catch (error) {
            console.error("Error updating impressions:", error);
        }
    });
})

// GET /api/vendors/615f9e43784f4a3e24b8c4f8/coupons/615f9e43784f4a3e24b8c4f
// update - inc clicks
exports.GetCouponById = catchAsync(async (req, res, next) => {
    const { couponid } = req.params;
    if (!couponid) {
        return res.json({
            message: "Please provide a vendor ID and coupon ID!",
        });
    }
    // const coupon = await Coupon.findById(couponid);
    const coupon = await Coupon.findByIdAndUpdate(
        couponid,
        { $inc: { clicks: 1 } },
        { new: true }
    );

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
    res
) => {
    const issuanceID = req.params.issuanceid;

    if (!issuanceID) {
        return res.json({
            message: "Please login in or create your account!",
        });
    }

    const updatedIssuanceRequest = await IssuanceRequest.findByIdAndUpdate(issuanceID, {
        hasAskedRedemption: true
    }, { new: true });

    if (!updatedIssuanceRequest) {
        return res.json({
            message: "Couldn't update request! Try again!",
        });
    }

    res.status(200).json({
        message: "Redeem request sent to vendor",
    });
})

// get issuance request
exports.GetIssuanceRequest = catchAsync(async (
    req,
    res,
    next
) => {
    const issuanceID = req.params.issuanceid;

    if (!issuanceID) {
        return res.json({
            message: "Please login in or create your account!",
        });
    }

    const issuanceRequest = await IssuanceRequest.findById(issuanceID)
        .populate({
            path: "couponID",
        })

    if (!issuanceRequest) {
        return res.json({
            message: "Couldn't update request! Try again!",
        });
    }

    res.status(200).json({
        message: "success",
        issuanceRequest
    });
})