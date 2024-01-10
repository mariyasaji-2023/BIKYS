const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Define the upload directory (create it if it doesn't exist)
    },
    filename: function (req, file, cb) {
        req.body.Imagename = Date.now() + '-' + file.originalname
        cb(null, Date.now() + '-' + file.originalname); // Define the filename
    }
});

const upload = multer({ storage: storage });

module.exports = { storage, upload }
