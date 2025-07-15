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
        //console.log(jsonDataObject);
        return res.status(200).send(jsonDataObject);
    })
}

app.post('/sort', (req, res) =>{
  //console.log(req.body.studentList[0]);
  //console.log(SCHOOLS);
  //console.log(req.body.SCHOOLS);
  //somehow get lists of school obejcts here. send to server?
  //console.log("sort function called 1");
  let studentList = req.body.studentList;
  sort(studentList);
  console.log('starting to return');
  return res.status(200).send(studentList);
})
//should i init all students to having null if they don't already have a school and a bool as false if their school has been reassiged
function sort(studentList){ 
  //console.log("sort function called");
  
  //NOT HANDLING REMOVING STUDNET IF PREF IS HIGHER
  //loop below for loop while schools are not full or students are not sorted, put the round counter in this outer while loop
  //can't handle if number of students available and requested are not the same, will need to hard code so that it is
  let round = 1;
  while(!schoolReports || round < 20){ //arbitrary round stop (set to number of students?)
    for(const school of SCHOOLS){ //iterating through list of schools
      console.log("sorting " + school.name + " at time " + school.time);
      if(school.name == "Unsorted"){ break } //if reached the end of the list (unsorted group), end and start over at beginnign 
      let st = 0; //student list iterator
      for(st = 0; st < studentList.length; st++){ // add one student per round
        if(schoolOffer(school, studentList[st], round)){ //if school has preference for the student 
          if(studentAccept(school, studentList[st])){ //if student has preference for the school
            addStudent(school, studentList[st]);
            break; //next school
          }
        }
      }
    } 
    round++;
  }
  console.log("done sorting")
  checkForDuplicates;
  return studentList;
}

function checkForDuplicates(){
  const studentSchoolMap = {};
  SCHOOLS.forEach(school => {
    school.studentList.forEach(student => {
      if (studentSchoolMap[student.eid]) {
        console.warn(`Duplicate student ${student.eid} in schools:`, studentSchoolMap[student.eid], "and", school.name);
      } else {
        studentSchoolMap[student.eid] = school.name;
      }
    });
  });
  return;
}

function studentAssigned(student){ //schoolName of student not being updated in the list when they are sorted. no longer adding duplicates to the same school but resulting in people being added to two schools. make both studentlist and school configs a state. <-- idk if this is still true?
  if (student.schoolName != null && student.schoolName !== "") {
    return true;
  }
  return false;
}

function schoolOffer(school, student, round){
  if(round === 1){
    if (schoolRankStudent(school, student) >=2){ //wouldn't it be the same for all rounds idk, for how many rounds do i need. maybe go thorugh and do all the same, and just find the highest rank each time and hope that all students get an offer? idk this is what i will do for now.
      return true; //rn rank 2 and 3 are functionally the same
    }
  }
  if(schoolRankStudent(school, student) >=1) {return true;}
  return false;
}

function studentAccept(school, student){ //checking availability
  let curRank = studentRankSchool(school, student);
  if(curRank > 0){ //if student available
    if(studentAssigned(student)){ 
      let prevSchool = SCHOOLS.find(sch => sch.name === student.schoolName);
      if(curRank > studentRankSchool(prevSchool, student)){
        removeStudent(prevSchool, student); 
        return true;
      }
      return false; //if new school and old school are ranked the same, student will not be moved
    }
    return true; //if student not already assigned and available, they will accept
  }
  return false; //if not available
}

function addStudent(school, student){ 
  if (!school) {
    console.error("Attempting to add to an undefined school", student);
  }
  school.studentList.push(student); //doesn't seem to actually update the school. update state?
  school.students++;
  if(student.carSpace){
    school.rides += student.carSpace;
  }
  student.schoolName = school.name;
  return;
}

function removeStudent(school, student){ //rn ranks are the same so no students are being reassigned
  if(!school.studentList.includes(student)){
    //console.log(student.eid + " not in " + school.name);
    return;
  }
  school.studentList.splice(school.studentList.indexOf(student), 1);
  console.log(student.firstName + " " + student.lastName + " has been removed from " + school.name);
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
  if (!school) {
    console.error("Attempting to rank an undefined school", school);
  }
  return student[timeSlotMap[school.time]]; //does not support time pref
}

function schoolFull(school){
  if(school.students < school.capacity){
    return false;
  }
  return true;
}

function schoolReport(school){ //unused, delete?
  console.log(school.name + " at time " + school.time + " has " + school.students + " students and " + school.rides + " rides out of " + school.capacity);
  /*console.log("student list: ");
  for(const st in school.studentList){
    console.log(st.eid);
  } */
  return;
}

function schoolReports(studentList){
  let done = true;
  for(var sch of SCHOOLS){ 
    schoolReport(sch);  
    if(!schoolFull(sch)){done = false}
    //console.log(sch.studentList);
  }
  for(var st of studentList){
    if(!studentAssigned(st)){
      console.log(st.firstName + " " + st.lastName + " is not assigned to a school");
      done = false;
    }
  }
  return done; //this makes it keep going while not all schools or students returned, find a better way to show finished. maybe have round counter
  //oh this is how i have it returning? that's problematic h
}
