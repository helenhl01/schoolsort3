const express = require("express")
const app = express()
const cors = require('cors');
const multer = require('multer');
const { json } = require('express');
const bodyParser = require('body-parser');

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.get("/", function(req, res) {
  res.send("It's working!")
})

app.listen(8000, () => {
  console.log("app listening on port 8000")
})

/* app.get('/upload', (req, res) => { //endpoint
    res.json({ message: "this is the upload page" });
});
 */

var upload = multer({ //multer middleware to handle file uploads
    fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed.')); //send this as an alert to the client
    }
  },}).single('file')

app.post('/upload', (req, res) =>{
    return processArray(req, res);
})

processArray = (req, res) => { //handles request. send json file and returns json object array
    upload(req, res, (err) => {
        if(err){
            if(!req.file){console.log("no file")}
            console.log("error: " + err)
            res.status(400).send("Something went wrong!");
        }
        const jsonDataObject = JSON.parse(req.file.buffer.toString());
        return res.status(200).send(jsonDataObject);
    })
}