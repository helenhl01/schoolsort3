import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import { SCHOOLS, TIMES, timeSlotMap } from '../src/configs.js'; //right now server is receiving hard coded configs and updating them in server, but not returning updated school lists. rest of code is using school state variables and udpating based on studentList state (in timeSlots useEffect). later update server to update state too?

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
      cb(new Error('Only JSON files are allowed.')); 
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

function sort(studentList){ 

  //loop below for loop while schools are not full or students are not sorted, chnage stopping conditions
  //can't handle if number of students available and requested are not the same, will need to hard code so that it is
  let round = 1;
  while(!doneSorting(studentList) ){ //arbitrary round stop (set to number of students?)
    for(const school of SCHOOLS){ //iterating through list of schools
      //console.log("sorting " + school.name + " at time " + school.time);
      if(school.name == "Unsorted"){ break } //if reached the end of the list (unsorted group), end and start over at beginnign 
      let st = 0; //student list iterator
      for(st = 0; st < studentList.length; st++){ // add one student per round
        if(schoolOffer(school, studentList[st])){ //if school has preference for the student 
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
  //checkForDuplicates;
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

function studentAssigned(student){
  //console.log(`Checking ${student.eid}:`, student.schoolName);
  const name = student.schoolName?.trim().toLowerCase();
  return name && name !== "unsorted";
}

function bestStudent(school, studentList){ //but if i do this wont there be sone students who never get fofers
  const bestStudent = students.reduce((best, current) => {
    return studentRankSchool(school, current) > studentRankSchool(school, best)
      ? current
      : best;
  });
}
function schoolOffer(school, student){
    if (schoolRankStudent(school, student) >=2){ //wouldn't it be the same for all rounds idk, for how many rounds do i need. maybe go thorugh and do all the same, and just find the highest rank each time and hope that all students get an offer? idk this is what i will do for now.
      return true; //rn rank 2 and 3 are functionally the same
    }
  if(schoolRankStudent(school, student) >=1) {return true;}
  return false;
}

function studentAccept(school, student){ //checking availability
  let newRank = studentRankSchool(school, student);
  if(newRank > 0){ //if student available
    if(studentAssigned(student)){ 
      let prevSchool = SCHOOLS.find(sch => sch.name === student.schoolName);
      if(newRank > studentRankSchool(prevSchool, student)){
        removeStudent(prevSchool, student); //should i handle removal in the sorting loop?
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
  school.studentList.push(student); 
  school.students++;
  if(student.carSpace){
    school.rides += student.carSpace;
  }
  student.schoolName = school.name;
  return;
}

function removeStudent(school, student){ //rn ranks are the same so no students are being reassigned
  if(!school.studentList.includes(student)){return}
  school.studentList.splice(school.studentList.indexOf(student), 1);
  //console.log(student.firstName + " " + student.lastName + " has been removed from " + school.name);
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

function schoolReport(school){ //redundant?
  console.log(`${school.name} ${school.time} has ${school.students} / ${school.capacity} students and ${school.rides} rides.`);
  /*console.log("student list: ");
  for(const st in school.studentList){
    console.log(st.eid);
  } */
  return;
}

function doneSorting(studentList){
  let done = false;
  done = !SCHOOLS.some(sch => sch.students < sch.capacity);
  done = !studentList.some(st => !studentAssigned(st)); //checks if all students are sorted (priority over schools filled?)
  return done; //this makes it keep going while not all schools or students returned, find a better way to show finished. maybe have round counter
  //oh this is how i have it returning? that's problematic h
}
