const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');

    // Check is token is there
    if (!token) {
        return res.send(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify Token
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}
