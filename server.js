const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const uuidv4 = require('uuid/v4')
const graphqlHttp = require('express-graphql');

// GraphQL
const auth = require('./middleware/auth');
const schema = require('./graphql/schema');
const resolver = require('./graphql/resolvers');
const { clearImage } = require('./utils/clearImages');

// const feedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');

const { mongoKey } = require('./config/keys');
const Mongo_URI = `mongodb+srv://joon:${mongoKey}@firstatlas-drwhc.mongodb.net/messages`;

const app = express();



const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  }
});

// "formData" moves through this file filter over req.body.
// Then, if it is "file" of image it will return req.file.
// Therefore, if the form data is not availalbe,
//  in other words, the user does not enter a file in editing the post,
//  it does not 
const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(bodyParser.json());


// Please remind that it is building "req.file" 
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // [Only in Express-GraphQL]
  //  When method === 'OPTIONS' stop here and sends success codes
  // Then, when the client access to the server with the other mothods it won't stop here.
  if(req.method === 'OPTIONS') {
    // stop app.use and won't go to next app.use()
    return res.sendStatus(200);
  }
  next();
});



// [ GraphQL ]
// just before graphQL
// when we are suing graphQL,
//  it must move to app.use('./graphql') that is the graphql endpoint
app.use(auth);

// [ Issue with GraphQL to upload file ]
// GraphQL just send and receive json data.

// One of the solution for this,
//  is to use app.use('/end point').

// [ working flow]
// 1) First request from the client to "a end point"
// 2) Then, the endpoint stores tge image we did in rest / legacy express.
//    response with a path of the image
// 3) And then, the client sends another request with that path data to the grapql end point.

// 1) REST END POINT TO GET/STORE/SEND FILE PATH
// put is better than post because it will be used in 'edit'
app.put('/post-image', (req, res, next) => {

  if(!req.isAuth) {
    throw new Error('Not authorized.');
  }

  // req.file: Because of app.use(multer) up and above
  // when editing, req.body.oldPath is always availalbe
  //  however, bear in mind that this middleware stops
  //  req.file is not available.
  // console.log('req.body: ', req.body);

  if(!req.file) {
    // status(200) can be ok.
    // because when we edit a post, we can't attach the new file
    //  and just we can use the existing file from database.
    return res.status(200).json({ message: 'Unable to get image file.'});
  }

  // if req.file(or req.body.image) && "req.body.oldPath" are available, 
  // it must remove the old image, req.body.oldPath

  // In other words, "req.body.oldPath" is required only when the user edits the post
  //   and when the user enters a new image file.

  // Again, if the req.file is not available, req.body.oldPath
  //  can not arrive here. ************************
  if(req.body.oldPath) {
    clearImage(req.body.oldPath);
  }

  /* 
    // when posting
    - reb.body.oldImage:  undefined
    - req.body.image: [Object]
     ==> req.file.path:  images\f867775e-657c-4115-b2c9-71843010ee99

    // when editing with no new file
    no logs!!! in cosole here becaus it stops at "return" up and above

    // when editing with new file
    // => oldImage is available. then it will be deleted in the image folder.

    // because it sends this image  by using this.state.edit.imageUrl
    reb.body.oldImage:  images/f867775e-657c-4115-b2c9-71843010ee99
    req.file.path:  images\c8282841-90e8-4fc0-af70-32714e1ace21

  */
  console.log('reb.body.oldImage: ', req.body.oldPath);
  console.log('req.file.path: ', req.file.path.replace('\\', '/'));

  return res.status(201).json({
    message: 'File stored',
    // *********
    // when the user did not attach any file, it is "file: undefined"
    //  then the front can manipulate "file: undefined"
    filePath: req.file.path.replace('\\', '/')
  });

});

// [ REST ]
// app.use('/feed', feedRoutes);
// app.use('/auth', authRoutes);

// [ GraphQL ]
// comes after all the middleware except for the error is done!!!
app.use('/graphql', graphqlHttp({
  schema,
  rootValue: resolver,
  graphiql: true,

  // Control Errors like app.use((error, req, res, next) => {})
  formatError(err) {
    // error made by the user
    if(!err.originalError) {
      // error generated by graphql
      return err;
    }
    console.log('err: ', err)
    // data: an array contains user's error message
    const data = err.originalError.data;
    // invalid email
    const message = err.message || 'An error occurred.';
    const code = err.originalError.code || 500;

    // return to the client through json({})
    return { message, status: code, data };
  }
}));

// [ REST ]
// app.use((error, req, res, next) => {
//     console.log('error in server.js', error);
//     const status = error.statusCode || 500;
//     const message = error.message;
//     const data = error.data;
//     res.status(status).json({ message, data });
// });

mongoose
  .connect(Mongo_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('DB is connected!');
    console.log('Server is up!');
    app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });
