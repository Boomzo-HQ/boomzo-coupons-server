const express = require("express");
const { CreateCustomer, GetCustomerCoupons, GetVendorDistributedCoupons, GetCouponById, CreateRedeemRequest, CreateIssueRequest, GetIssuanceRequest } = require("../controllers/customerController");

const router = express.Router();

router.post("/signup", CreateCustomer);
router.post("/my-coupons", GetCustomerCoupons);
router.get("/vendors/:vendorid/coupons/:couponid", GetCouponById);

// here vendor id is the vendor being scanned
router.get("/vendors/:vendorid/coupons", GetVendorDistributedCoupons);

router.post("/vendors/:vendorid/issue", CreateIssueRequest);

// redeem
router.post("/redeem/:issuanceid", CreateRedeemRequest);
router.get("/issuance-request/:issuanceid", GetIssuanceRequest);

module.exports = router;