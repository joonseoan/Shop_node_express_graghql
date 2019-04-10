const path = require('path');
const fs = require('fs');

exports.clearImage = filePath => {
  
    console.log('filePath argument in clearImage function', filePath)
    filePath = path.join(__dirname, '../', filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    });
};

