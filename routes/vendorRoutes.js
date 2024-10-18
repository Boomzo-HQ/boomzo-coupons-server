const express = require("express");
const { VendorLogin, ProtectVendor, GetMyActiveCoupons, AcceptIssuanceRequest, GetMyIssuanceRequests, GetMyRedemptionRequests, RejectIssuanceRequest, RejectRedeemRequest, AcceptRedemptionRequest } = require("../controllers/vendorController");

const router = express.Router();

router.post("/login", VendorLogin);

router.use(ProtectVendor);

router.get("/my-coupons", GetMyActiveCoupons);
router.get("/my-issue-requests", GetMyIssuanceRequests);
router.get("/my-redeem-requests", GetMyRedemptionRequests);

router.post("/accept-issuance/:issueid", AcceptIssuanceRequest);
router.post("/reject-issuance/:issueid", RejectIssuanceRequest);
router.post("/accept-redemption/:issueid", AcceptRedemptionRequest);
router.post("/reject-redemption/:issueid", RejectRedeemRequest);

module.exports = router;