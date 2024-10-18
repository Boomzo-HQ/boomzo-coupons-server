const express = require("express");
const { CreateVendor, GetVendors, GetVendorByID, CreateCoupon, UpdateVendor, GetAllCoupons, GetActiveCoupons, UpdateCoupon, DeactivateCoupon, GetVendorActiveCoupons, GetVendorAllCoupons } = require("../controllers/adminController");

const router = express.Router();

router.post("/create-vendor", CreateVendor);
router.get("/all-vendors", GetVendors);
router.get("/vendor/:id", GetVendorByID);
router.patch("/vendor/:vendorid", UpdateVendor);

router.get("/all-coupon", GetAllCoupons);
router.get("/active-coupon", GetActiveCoupons);
router.get("/vendor-coupon/:vendorid/all", GetVendorAllCoupons);
router.get("/vendor-coupon/:vendorid/active", GetVendorActiveCoupons);
router.post("/create-coupon", CreateCoupon);
router.patch("/coupon/:couponid", UpdateCoupon);
router.patch("/coupon/:couponid/deactivate", DeactivateCoupon);

module.exports = router;