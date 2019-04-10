// const { validationResult } = require('express-validator/check');
// const fs = require('fs');
// const path = require('path');

// const Post = require('../models/post');
// const User = require('../models/user');
// const io = require('../socketio');

// exports.getPosts = async (req, res, next) => {

//     const currentPage = req.query.page || 1;
//     const perPage = 2;

//     try {
//         // find() is not Promise which will receive the callback.
//         // Instead it supports "then" function that still makes use of async and await.
//         const count = await Post.find().countDocuments();
//         // console.log('count: ', count === 0)
        
//         // count 0 ========================> false!!!!!!!!!!!!!!!!!!!!!! **********************
//         // Therefore, length is better
//         if(!count && count !== 0) {
//             const error = new Error('Unable to get count.');
//             error.statusCode = 422;
//             throw error;
//         }

//         const posts = await Post.find()
//             .populate('creator')
//             // it is a descending order
//             // {} : to get createdAt property out of 'post' out 'posts', an array 
//             // it is like posts.sort(post => post.createdAt === -1)??
//             .sort({ createdAt: -1 })
//             .skip((currentPage - 1) * perPage)
//             .limit(perPage);

//         if(!posts) {
//             const error = new Error('Unable to find the post list.');
//             error.statusCode = 422;
//             throw error;
//         }

//         res.status(200).json({
//             message: 'successfully fetched the post list.',
//             posts,
//             totalItems: count
//         });

//     } catch(e) {
//         if(!e.statusCode) {
//             e.statusCode = 500;
//         }
//         next(e);
//     }
// };

// exports.createPost = async (req, res, next) => {
//     const errors = validationResult(req);
//     if(!errors.isEmpty()) {
//         const error = new Error('Validation Failed. Entered data is incorrect.');
//         error.statusCode = 422;
//         throw error;
//     }
//     if(!req.file) {
//         const error = new Error('Unable to get image file.');
//         error.statusCode = 422;
//         throw error;
//     }

//     const userId = req.userId;
//     const title = req.body.title;
//     const content = req.body.content;
//     const imageUrl = req.file.path.replace("\\" ,"/");    

//     if(!userId) {
//         const error = new Error('Unable to get userId to create post.');
//         error.statusCode = 422;
//         throw error;
//     }

//     const post = new Post({
//         title,
//         imageUrl,
//         content,
//         // need to populate()
//         creator: userId
//     });

//     try {
//         // promise built-in
//         await post.save();

//         /* 
//             [Mongoose queries are not promise!!!]
//             Model.deleteMany()
//             Model.deleteOne()
//             Model.find()
//             Model.findById()
//             Model.findByIdAndDelete()
//             Model.findByIdAndRemove()
//             Model.findByIdAndUpdate()
//             Model.findOne()
//             Model.findOneAndDelete()
//             Model.findOneAndRemove()
//             Model.findOneAndUpdate()
//             Model.replaceOne()
//             Model.updateMany()
//             Model.updateOne()
        
//         */

//         const user = await User.findById(userId);

//         if(!user) {
//             const error = new Error('Unable to find the user who posted');
//             error.statusCode = 422;
//             throw error;
//         }

//         // creatorProfile = user;
//         user.posts = [ ...user.posts, post ];
        
//         await user.save();

//         // io.getIO() for anyone of the clients that has not sent the request
//         // adding socket io implementation here
//         // broadcast: all clients except for the client who sent the request.
//         // emit : all clients including the client who sent the request. 
        
//         // copy the entir document of mongoDB, not copy the mongoose instance.
//         // console.log('post._doc: ', post._doc);
//         io.getIO().emit('posts', { 
//             action: 'create', 
//             post: { ...post._doc, creator: { _id: req.userId, name: user.name }} 
//         });

//         // res.status(201).json({}) for a client who sent the request!!!
//         res.status(201).json({
//             message: 'Post created successfully',
//             post,
//             creator: { _id: user._id, name: user.name }
//         });

//     } catch(e) {        
//         if(!e.statusCode) {
//             // server side error
//             e.statusCode = 500;
//         }
//         next(e);
//     }
// }

// exports.getPost = async (req, res, next) => {

//     const postId = req.params.postId;

//     try {
//         // for the mongoose Promise.
//         //  we do not need "exec()"
//         const post = await Post.findById(postId).populate('creator');

//         if(!post) {
//             const error = new Error('Unable to find post.');
//             error.statusCode = 404;
//             throw error;
//         }

//         res.status(200).json({ 
//             message: 'The post successfully fetched.',
//             post 
//         });
//     } catch(e) {
//         if(!e.statusCode) {
//             e.statusCode = 500;
//         }
//         next(e);
//     }

// };

// exports.updatePost = async (req, res, next) => {

//     const postId = req.params.postId;
//     const userId = req.userId;
//     const errors = validationResult(req);

//     if(!errors.isEmpty()) {
//         const error = new Error('Validation Failed. Entered data is incorrect.');
//         error.statusCode = 422;
//         throw error;
//     }

//     const { title, content } = req.body;
//     let imageUrl = req.body.image;

//     // if image is not selected in a while of editing, 
//     //  the default value is the existing file name
//     //  because the client has "this.state.editPost", which is a post value
//     //  including imageUrl!!!
//     //  This imageUrl is assigned to file input value
//     //  even though it is not recognized.

//     // this.state.editPost is delivered to the client 
//     // during "getPost"!
//     console.log('imageUrl of req.body.image: ', imageUrl);

//     if(req.file) {
//         imageUrl = req.file.path.replace("\\" ,"/");
//     }

//     if(!imageUrl) {
//         const error = new Error('Unable to find image Error');
//         error.statusCode = 422;
//         throw error;
//     }

//     try {
//         const post = await Post.findById(postId).populate('creator');
//         // with populate
//         console.log('post: ', post)
        
//         if(!post) {
//             const error = new Error('Unable to find the post to be updated.');
//             error.statusCode = 422;
//             throw error;
//         }

//         if(post.creator._id.toString() !== userId) {
//             const error = new Error('The post is not for the current logged-in user');
//             error.statusCode = 403;
//             throw error;
//         }

//         if(imageUrl !== post.imageUrl) {
//             clearImage(post.imageUrl);
//         }

//         post.title = title;
//         post.imageUrl = imageUrl;
//         post.content = content;

//         const updatedPost = await post.save();

//         // 'posts: ' same name as the one above
//         //  it will be assigned to "posts" object!
//         io.getIO().emit('posts', {
//             action: 'update',
//             post: updatedPost
//         })

//         res.status(200).json({
//             message: 'successfully updated',
//             post: updatedPost
//         });

//     } catch(e) {
//         if(!e.statusCode) {
//             e.statusCode = 500;
//         }
//         next(e);
//     }
// };

// exports.deletePost= async (req, res, next) => {
//     const postId = req.params.postId;
//     const userId = req.userId;

//     try {
//         const post = await Post.findById(postId);

//         if(!post) {
//             const error = new Error('Unable to find the post to delete');
//             error.statusCode = 422;
//             throw error;
//         }
//         // console.log('post in delete ====================================> : ', post)
//         if(post.creator.toString() !== userId) {
//             const error = new Error('The post is not for the current logged-in user');
//             error.statusCode = 403;
//             throw error;
//         }

//         clearImage(post.imageUrl);

//         await Post.findOneAndDelete({_id: postId});

//         const user = await User.findById(userId);
//         user.posts.pull(postId); // ****** when delete ref: Schema.Types.ObjectId !!!

//         await user.save();

//         io.getIO().emit('posts', {
//             action: 'delete',
//             post: postId
//         });

//         res.status(200).json({
//             message: 'successfully deleted',
//         });

//     } catch(e) {
//         if(!e.statusCode){
//             e.statusCode = 500;
//         }
//         next(e);
//     }
// };

// const clearImage = filePath => {
//     console.log('filePath argument in clearImage function', filePath)
//     filePath = path.join(__dirname, '..', filePath);
//     fs.unlink(filePath, err => {
//         console.log(err);
//     });
// };
