const express = require("express");
const { CreateCustomer, GetCustomerCoupons, GetVendorDistributedCoupons, CreateRedeemRequest, CreateIssueRequest } = require("../controllers/customerController");

const router = express.Router();

router.post("/signup", CreateCustomer);
router.post("/my-coupons", GetCustomerCoupons);

// here vendor id is the vendor being scanned
router.get("/vendors/:vendorid/coupons", GetVendorDistributedCoupons);
router.post("/vendors/:vendorid/issue", CreateIssueRequest);
// here vendor id is the floating vendor
router.post("/vendors/:vendorid/redeem", CreateRedeemRequest);

module.exports = router;