import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import { SCHOOLS, TIMES, timeSlotMap } from '../src/configs.js';

const app = express();

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
  console.log("file uploaded");
  return processArray(req, res);
})

const processArray = (req, res) => { //handles request. send json file and returns json object array
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

app.post('/sort', (req, res) =>{
  //console.log(req.body.studentList[0]);
  //console.log(SCHOOLS);
  //console.log(req.body.SCHOOLS);
  //somehow get lists of school obejcts here. send to server?
  sort(req.body.studentList);
  return ("yes");
})

function sort(studentList){
  for(const school of SCHOOLS){
    let i = 0;
    while((school.rides < school.capacity && (i < studentList.length))){
      if(schoolRankStudent(school, studentList[i]) >= 2 && !studentList[i].school){ 
        addStudent(school, studentList[i]);
      } //fill up schools first, haven't handled taking off students or student preferences yet
      //should if rirst fill all schools with enough drivers and then later take away or add drivers as needed
      i++;
    }
    i = 0;
    while((school.students < school.capacity) && (i < studentList.length)){
      if(schoolRankStudent(school, studentList[i]) >= 1 && !studentList[i].school){ 
        addStudent(school, studentList[i]);
      }
      i++;
    }
    schoolReport(school);
    //break; //testing just one school
    //console.log("done with first school");
  }
  return;
}

function addStudent(school, student){
  school.studentList.push(student);
  school.students++;
  if(student.carSpace){
    school.rides += student.carSpace;
    //console.log(school.name + " now has " + school.rides + " rides");
  }
  student.school = school.name;
  //console.log(student.firstName + " " + student.lastName + " added to " + school.name);
  return;
}

function schoolRankStudent(school, student){
  if(student[timeSlotMap[school.time]]){
    if((school.students > school.rides) && (student.carSpace)){
      return 3;
    }
    if((school.capacity > school.rides) && (student.carSpace)){
      return 2;
    }
    return 1;
  }
  return 0;
}

function studentRankSchool(school, student){
  return student[timeSlotMap[school.time]];
}

function schoolReport(school){
  console.log(school.name + " at time " + school.time + " has " + school.students + " students and " + school.rides + " rides out of " + school.capacity);
  /*console.log("student list: ");
  for(const st in school.studentList){
    console.log(st.eid);
  } */
  return;
}
