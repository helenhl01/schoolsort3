import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bodyParser from 'body-parser';
import { SCHOOLS, TIMES } from '../src/configs.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.listen(8000, () => {
  console.log("app listening on port 8000")
})

var upload = multer({ //multer middleware to handle file uploads
    fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed.')); //csv files are converted to json internally
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
  let studentList = req.body.studentList;
  const schools = buildSchools(studentList); // fresh working copy per request, never mutate the shared SCHOOLS config
  sort(studentList, schools);
  console.log('starting to return');
  return res.status(200).send(studentList);
})

function buildSchools(studentList){ // reconstruct school rosters/counts from studentList.schoolName, using SCHOOLS only for static config (name/time/capacity)
  const schools = SCHOOLS.map(school => ({
    ...school,
    studentList: [],
    students: 0,
    rides: 0,
  }));
  for(const student of studentList){
    const school = schools.find(s => s.name === student.schoolName) || schools.find(s => s.name === "Unsorted");
    if(school){
      school.studentList.push(student);
      school.students++;
      if(student.carSpace){ school.rides += student.carSpace; }
    }
  }
  return schools;
}

function sort(studentList, schools){  //rn no regard to school capacity
  while(!doneSorting(studentList, schools) ){ //maybe implement a second round to correct first round sort? in first round don't allow schools to go over ccap, then in second round do?
    for(const school of schools.filter(s => s.name !== "Unsorted").sort((a, b) => schoolFull(a) - schoolFull(b))){
      if(school.name == "Unsorted"){ break } //if reached the end of the list (unsorted group), end and start over at beginnign 
      let studentAdded = false;
      const rejectedOffers = new Set(); // make set to store students who reject
      while(!studentAdded){
        const st = nextBestStudent(school, studentList, rejectedOffers); // school finds best student
        if(!st){break}
        if(studentAccept(school, st, schools)){ // school makes offer
          if(studentAssigned(st)){removeStudent(schools.find(sch => sch.name === st.schoolName), st);}//if student is already assigned but this offer is better remove from prev school
          addStudent(school, st); //if student accepts, add student and move to next school
          studentAdded = true;
        }
        rejectedOffers.add(st.eid);//  if student rejects, add student to set, find next best student and loop until student accepts
      } 
    }   
  }
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

function studentAssigned(student){
  const name = student.schoolName?.trim().toLowerCase();
  return name && name !== "unsorted";
}

function nextBestStudent(school, studentList, rejectedOffers){
  let bestRank = -1;

  for(const cur of studentList){
    if(rejectedOffers.has(cur.eid)) continue; //what happens to students in rejected offers? does this set actually do anything or just prevent school from reoffering

    const rank = schoolRankStudent(school, cur);
    if(best === null || rank > bestRank){
      best = cur;
      bestRank = rank;
    }
  }
  return best;
}

function schoolOffer(school, student){
    if (schoolRankStudent(school, student) >=2){ 
      return true; //rn rank 2 and 3 are functionally the same, fix this later. maybe prioritize 3 in first round
    }
  if(schoolRankStudent(school, student) >=1) {return true;}
  return false;
}

function studentAccept(school, student, schools){ //checking availability
  let newRank = studentRankSchool(school, student); //0 or 1, depending on availability
  if (newRank === 0) return false;
  if(studentAssigned(student)){
    let prevSchool = schools.find(sch => sch.name === student.schoolName);
    if(schoolRankStudent(school, student) > schoolRankStudent(prevSchool, student)){
      return true;
    }
    return false; //if new school and old school are ranked the same, student will not be moved
  }
  return true; //if student not already assigned and available, they will accept
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

function removeStudent(school, student){ 
  if(!school.studentList.includes(student)){return}
  school.studentList.splice(school.studentList.indexOf(student), 1);
  return;
}

function schoolRankStudent(school, student){ //later add in spanish?
  if(student[school.time]){
    if((school.students > school.rides) && (student.carSpace)){ //school needs rides and student can drive
      return 4;
    }
    if((school.capacity > school.rides) && (student.carSpace)){ //school will need rides and student can drive
      return 3;
    } 
    if(school.students < school.capacity){ //if school needs students
      return 2;
    }
    return 1; //student available 
  }
  return 0;
}

function studentRankSchool(school, student){
  if (!school) {
    console.error("Attempting to rank an undefined school", school);
  }
  return student[school.time]; //does not support time pref atm
}

function schoolFull(school){
  if(school.students < school.capacity){
    return false;
  }
  return true;
}

function doneSorting(studentList, schools){
  let done = false;
  done = !schools.some(sch => sch.students < sch.capacity) || !studentList.some(st => !studentAssigned(st));
  return done; //done if all schools reach capacity or students sorted
}
