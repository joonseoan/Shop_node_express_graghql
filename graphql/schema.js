const { buildSchema } = require('graphql');

// ! (mandatory mark) : If it does not return string type, an error occurs.
// ----------------------------------------------------------------------
// TestData : Schema Definition

// RootQuery : Query Definition
/*  
    RootQuery: defines:
    1) Resource : defines / collects ScalarType or DataTypes
        (which contains the basic elements like the ones "TestData" has) to be manipulated 

        ****** just remember 
            
            1) that the data elements returned to the cleint are based on the data stored in mongoose schema / DB
            if it is using mongoose schema Type. (return type must be defined like type Post and type User)

            2) that the data elements returned to the client can be indepenant values, (object and arrya) and scalar type,
            if it is not using mongoose schema Type (Also, the type must be defined like type Post, type User, and type AuthData
            even though AuthData is not available in mongoose)

            **** Please note that req.user is type User and req.userId is type String / ID

        More specifically,
        type: RootQuery {
            hello: String! // Scalar Type
        }

        ----------------------------------
        // At resolvers.js
        resolver () {
            // *************
            // "return can be any scalar type, object, and array"
            return 'HELLO WORLD';
        }

    2) *********** manipulation: by graphql's built-in function is called "resolver()"
        - builds logic and manipulates DataTypeElement
            to deliver data the client wants to get
        - returns the final data to the client

    3) return the manipulated data

        For instance, resolver for RootQuery!!!!
        
        // ********************************************************************
        // return : ***********************************************************
        //  1) Type must be defined.
                Type can be scalar Type, mongoose-based Type, 
                or [ new defined Type in graphQL ]
                which is not required to store data in DB.
                For instance, "authData" down below.
        //  2) must be identical with scalar type or userDenfinedType
        //      Must be identical with the elements in it if it is UserDefinedType

        module.exports = {
            hello() {
                return {
                    text: 'Hello World!',
                    views: 1245
                } 
            }
        }

        It should be in the rootQuery object by the way.
*/

// [ Mutation]

// "input UserInputData": defines "arguments" and and their "type"

// "userInput: UserInputData" :
//  - userInput : variable name (type of a plain object)
//  - UserInputData : arguments
/* 
    async function({ 
        userInput: { 
           email, 
           password, 
           name 
       } 
    }, req) { ............ }
*/

// "createUser(userInput: UserInputData): User!"
//  - createuser: mutation name which is used to POST
//  - "User!" : return value to the client ******************8

// login() : query by using variables!!!! **********
//  It should be query instead of mutation
//  because it does not put any data into DB
// as long as using variables, the method is POST.

// PostData: In order to delivere total numbers of posts
//  to do paginations.!!
// Therefore, we need to do query PostData instead of [ Post! ]!

// if the variable is not available in invoker, 
//  it just return postData defined here without pagination.
// "Int" can be null. It does not have "!"
// RootQuery: posts(page : Int): postData!

//************************************************************************
// ID!: When we setup type of mongoose,
//  _id/id/anyId must have "ID" type!!!!!!!!!!!!!
// However, when we send the ID or any object data,
//  it must be string!!!!!! because of json does not allow any objects!!!
// ************************************************************************

module.exports = buildSchema(`   
    type Post {
        _id: ID!
        title: String!
        imageUrl: String!
        content: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        email: String!
        password: String!
        name: String!
        status: String!
        posts: [Post!]!
    }

    type AuthData {
        userId: String!
        token: String!
    }

    type PostData {
        posts: [Post!]!
        totalPosts: Int!
    }

    input UserInputData {
        email: String!
        password: String!
        name: String!
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String
    }

    type RootQuery {
        login(email: String!, password: String!): AuthData!
        posts(page: Int): PostData!
        post(id: ID!): Post!
        user: User!
    }

    type RootMutation {
        createUser(userInput: UserInputData!): User!
        createPost(postInput: PostInputData!): Post!
        updatePost(id: ID!, postInput: PostInputData): Post!
        deletePost(id: ID!): Boolean!
        updateStatus(status: String!): User!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);

// [ Query ]
// ----------------------------------------------------------------------
// Schema: Query Dispatcher
// module.exports = buildSchema(`   
//     type TestData {
//         text: String!
//         views: Int!
//     }

//     type RootQuery {
//         hello: TestData!
//     }

//     schema {
//         query: RootQuery
//     }
// `);