// graphql only
const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader) {
        // [GraphQL]
        req.isAuth = false;
        return next();

        // [ REST ]
        // const error = new Error('Not able to get token from your browser.');
        // error.statusCode = 401;
        // throw error;
    }    
    // req.get(): This is a way to get header data
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = await jwt.verify(token, 'xxxx');
    } catch(e) {
        // [GraphQL]
        req.isAuth = false;
        return next();

        // [ REST ]
        // e.statusCode = 500;
        // throw e;
    }
    if(!decodedToken) {
        // [GraphQL]
        req.isAuth = false;
        return next();

        // [ REST ]
        // const error = new Error('Not authenticated');
        // error.statusCode = 401;
        // throw error;
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
       
};