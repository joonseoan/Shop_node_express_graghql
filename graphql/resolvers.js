const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Cannot use "express-validator" that are used in rest and legacy express
//  because graphql can't use rest endpoints like "app.use()"
// Instead, we must use "validator", another 3rd-party package
// BTW, validator is a kind of behind scene of "express-validator"
const validator = require('validator');
const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../utils/clearImages');

module.exports = {
// can use object-based function

    // 3) to use async / await function!!!!!!!!!!!!!!!!!!!!!!!!!!1
    //    // argument should be a plain object because it has only one "arbs"
    createUser: async function({ 
        userInput: { 
            // must be same properties as the ones defined in "input" of schema
            /* 
                UserInputData
            
            */ 
            email, 
            password, 
            name 
        } 
    }, req) {

        const errors = [];
        if(!validator.isEmail(email)) {
            errors.push({message: 'The email is invalid.'});
        }
        if(validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
            errors.push({ message: 'The password is too short!'});
        }
        if(validator.isEmpty(name)) {
            errors.push({ message: 'You must put your name.'});
        }
        
        // In graphql to use cental error control like rest/express srver,
        //  async and await should be used
        //  because the new error in "then" functio cant' get out of it and 
        //  then reach out to the global object environemnt 
        // Just bear in mind that we cannot use next() in the graphql env.
        if(errors.length > 0) {
            const error = new Error('Invalid Input');
            error.data = errors;
            error.code = 422;
            throw error
        }
    
        const existingUser = await User.findOne({ email });

        if(existingUser) {
            const error = new Error('User exists already!');
            throw error;
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const user = new User({
            email,
            password: hashedPassword,
            name
        });

        const createdUser = await user.save();
        console.log(createdUser)
        
        // just to change "_id" object to String
        // by the way, why _doc?
        return { ...createdUser._doc, _id: createdUser._id.toString() }

    // // 2) es6
    //  createUser({ userInput }, req) {
    //      const email = userInput.email;
    // 1)
    // createUser(args, req) {
    //     const email = args.userInput.email;
    },

    //    // argument should be a plain object because it has only one "arbs"
    login: async function({ email, password }) {
        const user = await User.findOne({ email });

        if(!user) {
            const error = new Error('User not found.');
            error.code = 401;
            throw error;
        }
        const isMatched = await bcrypt.compare(password, user.password);
        if (!isMatched) {
            const error = new Error('Password is incorrect');
            error.code = 401;
            throw error;
        }

        // to send the data to the client after successfully login
        const token = await jwt.sign({
            userId: user._id.toString(),
            email: user.email
        }, 'xxxx',
            { expiresIn: '1h' }
        )

        return { userId: user._id.toString(), token };
    },
    //    // argument should be a plain object because it has only one "arbs"
    // review and find ref in mongoose and find ref input when make a instance!!!
    createPost: async function({ postInput: { title, content, imageUrl } }, req) {

        const errors = [];
        
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }
        
        if(validator.isEmpty(title) || !validator.isLength (title, { min: 5 })) {
            errors.push({ message: 'The title is empty or less than 5 characters.' });
        }
        if(validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            errors.push({ message: 'You must put valid content'});
        }
        if(errors.length > 0) {
            const error = new Error('Invalid Input');
            error.data = errors;
            error.code = 422;
            throw error
        }

        const user = await User.findById(req.userId);
        
        if(!user) {
            const error = new Error('You are invalid user.');
            error.code = 401;
            throw error;
        }

        const post = new Post({
            title,
            content,
            imageUrl,
            // get all user data!! not only user._id here!!!!
            creator: user
        });

        const createdPost = await post.save();
        // Add post to users' posts
        user.posts = [ ...user.posts, createdPost ];
        await user.save();

        return { ...createdPost._doc,
                // because graphgl does not understand
                //  ObjectId and date() types. 
                id: createdPost._id.toString(), 
                createdAt: createdPost.createdAt.toISOString(),
                updatedAt: createdPost.updatedAt.toISOString() 
            }
    },
    // argument should be a plain object
    // no arguments

    // args => page for pagination
    posts: async function({ page }, req) {
        
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }

        // get totla number of documents
        const totalPosts = await Post.find().countDocuments();
        const perPage = 2;
        if(!page) {
            page = 1;
        }

        const posts = await Post.find()
            // descending order!!!
            .sort({ createdAt: -1 })

            // sending two elements out of the array
            .skip((page - 1) * 2)
            
            .limit(perPage)
            
            // fetching full user elements
            .populate('creator');
            
            // Please keep checking populate!!!!!1!!!!!!!!!!!!!!!!
            // checkout with populate
            console.log(posts);
               
        return { posts: posts.map(post => {
            // Tye is not related to graphql
            // [Reason]
            // Object value must be String type!!!!
            //  because the client is set to receives String type
            return { 
                ...post._doc,
                // actuall
                _id: post._id.toString(),
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString()
            };
        }) , totalPosts };
    },
    post: async function({ id }, req) {
        console.log(typeof id);

        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(id).populate('creator');
        
        if(!post) {
            const error = new Error('Unable to get the post by post id.');
            error.code = 404;
            throw error;
        }

        console.log(post)

        return {
            ...post._doc,
            _id : post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        };
    },
    updatePost: async function({id, postInput: {
        title,
        content,
        imageUrl
    }}, req) {

        const errors = [];

        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }

        // must valiate first
        if(validator.isEmpty(title) || !validator.isLength (title, { min: 5 })) {
            errors.push({ message: 'The title is empty or less than 5 characters.' });
        }
        if(validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
            errors.push({ message: 'You must put valid content'});
        }
        if(errors.length > 0) {
            const error = new Error('Invalid Input');
            error.data = errors;
            error.code = 422;
            throw error
        }

        const post = await Post.findById(id).populate('creator');
        if(!post) {
            const error = new Error('Unable to get the post by post id.');
            error.code = 404;
            throw error;
        }

        // Authorization
        if(req.userId.toString() !== post.creator._id.toString()) {
            const error = new Error('You are not authorized to edit this post.');
            error.code = 403;
            throw error;
        }

        post.title = title;
        post.content = content;

        
        // only while the user is editing post,
        //  the user did not attach a new file.
        // At this point, imageUrl is "undefined"!!!!!
        // console.log('imageUrl =======>', imageUrl)
        
        // In the case, the user changed the image file.
        if(imageUrl !== 'undefined') {
            post.imageUrl = imageUrl;
        }

        const updatedPost = await post.save();

        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },
    deletePost:  async function({ id }, req) {

        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }

        const post = await Post.findById(id);

        if(!post) {
            const error = new Error('Unable to get the post by post id.');
            error.code = 404;
            throw error;
        }

        // Authorization
        if(req.userId.toString() !== post.creator.toString()) {
            const error = new Error('You are not authorized to edit this post.');
            error.code = 403;
            throw error;
        }

        clearImage(post.imageUrl);

        await Post.findByIdAndDelete(id);

        const user = await User.findById(req.userId);
        // Again, it is a mongodb function
        user.posts.pull(id);
        await user.save();

        return true;

    },
    user: async function(args, req) {

        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }

        const user = await User.findById(req.userId);
        if(!user) {
            const error = new Error('Unable to get the user to find the status.');
            error.code = 404;
            throw error;
        }

        return {
            ...user._doc,
            _id: user._id.toString()
        };
        
    },
    updateStatus: async function({ status }, req) {
        if(!req.isAuth) {
            const error = new Error('Not authenticated');
            error.code = 401;
            throw error;
        }

        const user = await User.findById(req.userId);

        if(!user) {
            const error = new Error('Unable to get the user to find the status.');
            error.code = 404;
            throw error;
        }
        
        if(req.userId.toString() !== user._id.toString()) {
            const error = new Error('You are not authorized to edit this post.');
            error.code = 403;
            throw error;
        }
        
        user.status = status;
        
        await user.save(); 

        return {
            ...user._doc,
            _id: user._id.toString()
        };
       

    }
}

// [ Query ]
// module.exports = {
//     // can use a funtion itself.
//     hello() {
//         return {
//             text: 'Hello World!',
//             views: 1245
//         } 
//     }
// }