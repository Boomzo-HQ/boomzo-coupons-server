const jwt = require("jsonwebtoken");

// Helper function to sign a token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// Helper function to create a token and send it in response
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + 2592000000), // Cookie expires in 30 days
        httpOnly: true, // Prevent access to cookies from JavaScript
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true; // Secure in production

    res.cookie("jwt", token, cookieOptions);

    user.password = undefined; // Don't send password back in the response

    res.status(statusCode).json({
        status: "success",
        token,
        user,
    });
};

module.exports = {
    createSendToken,
};
