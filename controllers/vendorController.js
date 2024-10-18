const { createSendToken } = require("../middlewares/authHelpers");
const Coupon = require("../models/coupons");
const Customer = require("../models/customer");
const IssuanceRequest = require("../models/issuanceRequest");
const Vendor = require("../models/vendor");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");

exports.FindVendor = catchAsync(async (id, phone) => {
  if (phone) {
    return await Vendor.findOne({ phone: phone });
  } else {
    return await Vendor.findById(id);
  }
})

// <-------------------- AUTH ------------------------->
// Vendor Login
exports.VendorLogin = catchAsync(async (req, res, next) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  const user = await Vendor.findOne({ phone }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.ProtectVendor = catchAsync(async (req, res, next) => {
  // 1) fetch token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if user still exists
  const currentVendor = await Vendor.findById(decoded.id);
  if (!currentVendor) {
    return next(
      new AppError(
        "The vendor belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentVendor.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("You recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentVendor;
  next();
});



exports.GetMyActiveCoupons = catchAsync(async (req, res, next) => {
  const vendorId = req.user._id;

  const coupons = await Coupon.find({ floaterID: vendorId }).sort("-createdAt")

  res.status(200).json({
    message: "Success",
    coupons,
  })
});


// COUPONS ISSUANCE AND REDEMPTION
exports.GetMyIssuanceRequests = catchAsync(async (req, res, next) => {
  const vendorId = req.user._id;

  const requests = await IssuanceRequest.find({ issuerID: vendorId }).sort("-createdAt")

  res.status(200).json({
    message: "Success!",
    requests,
  })
});

exports.GetMyRedemptionRequests = catchAsync(async (req, res, next) => {
  const vendorId = req.user._id;

  const requests = await IssuanceRequest.find({ floaterID: vendorId, hasAskedRedemption: true }).sort("-createdAt")

  res.status(200).json({
    message: "Success!",
    requests,
  })
});


// <-------------- ACCEPTANCE --------------------->
exports.AcceptIssuanceRequest = catchAsync(async (
  req,
  res,
  next
) => {
  const vendorID = req.user._id
  const issueRquestID = req.params.issueid;
  const { customerID, couponID } = req.body;

  if (!issueRquestID) {
    return res.json({
      message: "Please provide an issue id!",
    });
  }

  const updatedIssuanceRequest = await IssuanceRequest.findByIdAndUpdate(
    issueRquestID,
    {
      isAccepted: true,
      issuedOn: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedIssuanceRequest) {
    return res.json({
      message: "Couldn't accept request! Try again!",
    });
  }

  console.log(updatedIssuanceRequest);

  const updatedCoupon = await Coupon.findByIdAndUpdate(
    couponID,
    {
      $push: { issuedTo: updatedIssuanceRequest._id },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  const updatedCustomer = await Customer.findByIdAndUpdate(
    customerID,
    {
      $push: { coupons: updatedIssuanceRequest._id },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  const updatedVendor = await Vendor.findByIdAndUpdate(
    vendorID,
    {
      $inc: { issuanceLimit: -1 }
    },
    {
      new: true,
      runValidators: true,
    }
  )

  res.status(200).json({
    message: "Issue request has been approved!",
    updatedIssuanceRequest,
    updatedCoupon,
    updatedCustomer,
    updatedVendor
  });
});

// reject issuance req
exports.RejectIssuanceRequest = catchAsync(async (
  req,
  res,
  next
) => {
  const issueRquestID = req.params.issueid;

  if (!issueRquestID) {
    return res.json({
      message: "Please provide an issue id!",
    });
  }

  const updatedIssuanceRequest = await IssuanceRequest.findByIdAndDelete(
    issueRquestID
  );

  console.log(updatedIssuanceRequest);

  res.status(200).json({
    message: "Issue request rejected!",
  });
});


// <-------------- REDEMPTION --------------------->
// accept redeem request
exports.AcceptRedemptionRequest = catchAsync(async (req, res, next) => {
  const issueRquestID = req.params.issueid;

  if (!issueRquestID) {
    return res.json({
      message: "Please provide an issue id!",
    });
  }

  const updatedIssuanceRequest = await IssuanceRequest.findByIdAndUpdate(
    issueRquestID,
    {
      isRedeemed: true,
      redeemedOn: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedIssuanceRequest) {
    return res.json({
      message: "Couldn't accept request! Try again!",
    });
  }

  res.status(200).json({
    message: "Redemption request has been approved!",
    updatedIssuanceRequest,
  });
});

// reject redeem request
exports.RejectRedeemRequest = catchAsync(async (
  req,
  res,
  next
) => {
  const issueRquestID = req.params.issueid;

  if (!issueRquestID) {
    return res.json({
      message: "Please provide an issue id!",
    });
  }

  const rejectedRedemptionRequest = await IssuanceRequest.findByIdAndUpdate(
    issueRquestID,
    {
      hasAskedRedemption: false,
      isRedeemed: false
    },
    {
      new: true,
      runValidators: true,
    }
  );

  console.log(rejectedRedemptionRequest);

  res.status(200).json({
    message: "Issue request rejected!",
    rejectedRedemptionRequest
  });
});