const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({

    title: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // creator: {
    //     // type: Object will work as well******************
    //    type: Object,
    //    required: String
    // },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
  
}, { 
    // mongoose will automaticall create time stamp!! like the ones below
    /* 
        createdAt: 2019-03-26T17:03:31.185Z,
        updatedAt: 2019-03-26T17:03:31.185Z,
    */
    timestamps: true
});

module.exports = mongoose.model('Post', postSchema);