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

function sort(studentList){ //being callex dprematurely
  //console.log("sort function called");
  
  //NOT HANDLING REMOVING STUDNET IF PREF IS HIGHER
  //loop below for loop while schools are not full or students are not sorted, put the round counter in this outer while loop
  let round = 1;
  while(!schoolReports || round < 20){ //arbitrary round stop (set to number of students?)
    for(const school of SCHOOLS){ //iterating through list of schools
      console.log("sorting " + school.name + " at time " + school.time);
      if(school.name == "Unsorted"){ break; } //if reached the end of the list (unsorted group), end and start over at beginnign 
      let i = 0; //student list iterator
      for(i = 0; i < studentList.length; i++){ //should add one student per round
        if(schoolOffer(school, studentList[i], round)){
          console.log(school.name + " has made an offer to " + studentList[i].eid + " in round " + round); 
          if(studentAccept(school, studentList[i])){ 
            addStudent(school, studentList[i]);
            console.log(studentList[i].eid + " has ranked " + school.name + " a " + studentRankSchool(school, studentList[i]) + " and been added");
            break; //next school
          }
        }
      }
    } 
    round++;
  }

    //break; //testing just one school
    //console.log("done with first school");
    //somehow rerender new student lust
  //}
  console.log("done sorting")
  return studentList;
}

function studentAssigned(student){ //schoolName of student not being updated in the list when they are sorted. no longer adding duplicates to the same school but resulting in people being added to two schools. make both studentlist and school configs a state.
  if (student.schoolName != null && student.schoolName !== "") {
    console.log(student.eid + " is already assigned to " + student.schoolName);
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

function studentAccept(school, student){ //checking availability and ranking
  if(studentAssigned(student)){
    console.log(student.eid + " already assigned to " + student.schoolName);
    if(studentRankSchool(school, student) > studentRankSchool(SCHOOLS.find(obj => obj.name === student.schoolName), student)){ //issue is here dummmy
  
      console.log(student.eid + " was already assigned to " + SCHOOLS.find(obj => obj.name === student.schoolName).name + " but has accepted " + school.name + "'s offer");
      return true;
    }
    console.log(student.eid + " has rejected " + school.name + "'s offer");
    return false;
  }
  console.log(student.eid + " has accepted " + school.name + "'s offer");
  return true;
}

function addStudent(school, student){ //redundant. update to combine
  if (!school) {
    console.error("Attempting to rank an undefined school", student);
  }
  //console.log("called");
  school.studentList.push(student); //doesn't seem to actually update the school. update state?
  school.students++;
  if(student.carSpace){
    school.rides += student.carSpace;
    //console.log(school.name + " now has " + school.rides + " rides");
  }
  student.schoolName = school.name;
  //console.log(student.firstName + " " + student.lastName + " added to " + school.name);
  return;
}

function removeStudent(school, student){ //untested function
  if(!school.studenList.includes(student)){
    console.log(student.eid + " not in " + school.name);
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
  //console.log("ranking school " + school.name + " at time " + school.time + " for student " + student.eid);
  //console.log(timeSlotMap[school.time]);
  //console.log(typeof(timeSlotMap[school.time]));
  //console.log(typeof(student.timeSlotMap[school.time]));
  //console.log(student[timeSlotMap[school.time]]);
  //console.log(student.timeSlotMap[school.time]);
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

function schoolReport(school){
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
    console.log(sch.name + " has " + sch.students + " students and " + sch.rides + " rides");  
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
}
