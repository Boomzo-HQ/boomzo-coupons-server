const express = require("express");
const AdminRouter = require("./adminRoutes")
const VendorRouter = require("./vendorRoutes")
const CustomerRouter = require("./customerRoutes")


const router = express.Router();

router.use("/api/v1/admin", AdminRouter);
router.use("/api/v1/vendor", VendorRouter);
router.use("/api/v1/customer", CustomerRouter);


module.exports = router;