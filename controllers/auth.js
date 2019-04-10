// const { validationResult } = require('express-validator/check');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const User = require('../models/user');

// exports.signup = async (req, res, next) => {
//     const errors = validationResult(req);
    
//     if(!errors.isEmpty()) {
//         const error = new Error('Validation Failed.');
//         error.StatusCode = 422;
//         error.data = errors.array();
//         throw error;
//     }

//     const { email, password, name } = req.body;

//     try {
//         const hashedPassword = await bcrypt.hash(password, 12)
//         const user = new User({
//             email,
//             password: hashedPassword,
//             name           
//         });
    
//         const newUser = await user.save();       
//         if(!newUser) {
//             const error = new Error('Unable to save the user.');
//             error.statusCode = 422;
//             throw error;
//         }
    
//         res.status(201).json({
//             message: 'User is created.',
//             userId: newUser._id
//         });

//     } catch(e) {
//         if(!e.statusCode) {
//             e.statusCode = 500;
//         }
//         next(e);
//     }
    
// }

// exports.login = async (req, res, next) => {
    
//     const errors = validationResult(req);

//     if(!errors.isEmpty()) {
//         const error = new Error('Login Validation failed');
//         error.statusCode = 422;
//         // object to an array!
//         error.data = errors.array();
//         throw error;
//     }

//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ email });
        
//         if(!user) {
//             const error = new Error('Unable to find your account.');
//             error.statusCode = 401;
//             throw error;
//         }
        
//         const isMatched = await bcrypt.compare(password, user.password);
        
//         if(!isMatched) {
//             const error = new Error('Password is wrong.');
//             error.statusCode = 401;
//             throw error;
//         }
        
//         const token = jwt.sign({
//             email : user.email,
//             userId: user._id.toString()
//             // setup expiring time : 1hour
//             // It is for security reason that the token can be stolen.
//             // ************************************
//         }, 'xxxx', { expiresIn : '1h' });
        
//         console.log('token ===============>: ', token);
//         res.status(200).json({
//             token,
//             userId: user._id.toString()
//         });

//     } catch(e) {
//         if(!e.statusCode) {
//             e.statusCode = 500;
//         }
//         next(e);
//     } 
// }

// exports.getStatus = async (req, res, next) => {
//     const userId = req.userId;
//     if(!userId) {
//         const error = new Error('No logged-in user exists, now.');
//         error.statusCode = 401;
//         throw error;
//     }

//     try {
//         const user = await User.findById(userId);
        
//         if(!user) {
//             const error = new Error('No logged-in user exists, now.');
//             error.statusCode = 401;
//             throw error;
//         }

//         res.status(200).json({
//             status: user.status
//         });
//     } catch(e) {
//         if(!e.statusCode) {
//             e.statusCode = 500;
//         }
//         next(e);
//     }
// }

// exports.updateStatus = async (req, res, next) => {
//     const errors = validationResult(req);
//     if(!errors.isEmpty()) {
//         const error = new Error('Login Validation failed');
//         error.statusCode = 422;
//         // object to an array!
//         error.data = errors.array();
//         throw error;
//     }

//     const { status } = req.body;

//     try {
//         const user = await User.findById(req.userId);
//         if(!user) {
//             const error = new Error('No logged-in user exists, now.');
//             error.statusCode = 401;
//             throw error;
//         }
//         user.status = status;

//         const updatedUser = await user.save();
//         if(!updatedUser) {
//             const error = new Error('No logged-in user exists, now.');
//             error.statusCode = 401;
//             throw error;
//         }
//         res.status(200).json({
//             message: 'user updated!',
//             status: updatedUser.status
//         });
//     } catch(e) {
//         if(!e.statuscode){
//             e.statuscode = 500;
//         }
//         next();
//     }
// }