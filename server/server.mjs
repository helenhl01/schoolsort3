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


var upload = multer({ //multer middleware to handle file uploads
    fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed.')); //change this to a conditional depending on which button pushed, then send json object without reconverting to file
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
  //loop below for loop while schools are not full or students are not sorted, chnage stopping conditions
  //can't handle if number of students available and requested are not the same, will need to hard code so that it is
  //let round = 1;
  while(!doneSorting(studentList, schools) ){ //arbitrary round stop (set to number of students?)
    for(const school of schools){ //iterating through list of schools
      if(school.name == "Unsorted"){ break } //if reached the end of the list (unsorted group), end and start over at beginnign 
      let studentAdded = false;
      const rejectedOffers = new Set(); //  make set to store students who reject
      while(!studentAdded){
        const st = nextBestStudent(school, studentList, rejectedOffers);//  school finds best student
        //what happens if st is null
        if(!st){break}
        if(studentAccept(school, st, schools)){//  school makes offer
          addStudent(school, st);//     if student accepts, add student and move to next school
          studentAdded = true;
          break; //do i need both of these stopping conditions m, do i need to break outside of this while loop
        }
        //console.log(`${st.eid} has rejected ${school.name}'s offer`);
        rejectedOffers.add(st.eid);//     if student rejects, add student to set, find next best student and loop until student accepts
      } //do i end up handling the rejected offers?
    }   

      // find a way to handle unmatched students at the endc, are they autoamtically added to unsorted in the front end/
      /*let i = 0; //student list iterator
      for(i = 0; i < studentList.length; i++){ // add one student per round
        if(schoolOffer(school, studentList[i])){ //if school has preference for the student 
          if(studentAccept(school, studentList[i])){ //if student has preference for the school
            addStudent(school, studentList[i]);
            break; //next school
          }
        }
      }
    } */
    //round++;
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

function studentAssigned(student){
  const name = student.schoolName?.trim().toLowerCase();
  return name && name !== "unsorted";
}

//should i stop making offers once school is full? or should i let algo keep runnign
function nextBestStudent(school, studentList, rejectedOffers){ //but if i do this wont there be sone students who never get fofers, maybe i should do the  next best until one student accpets at least
  let best = null;
  let bestRank = -1;

  for(const cur of studentList){
    if(rejectedOffers.has(cur.eid)) continue;

    const rank = schoolRankStudent(school, cur);
    if(best === null || rank > bestRank){
      best = cur;
      bestRank = rank;
    }
  }
  return best;
  /*const remaining = studentList.filter(s => !offersMade.has(s.eid)); //this line needs to change
  if(remaining.length === 0) return null; //?change

  const best = remaining.reduce((best, current) => {
    return schoolRankStudent(school, current) > schoolRankStudent(school, best) ? current : best
  });
  offersMade.add(best.eid); //cjhange id, only add offers rejected?
  return best; */
  
  /*return studentList.reduce((best, current) => {
    return schoolRankStudent(school, current) > schoolRankStudent(school, best)
      ? current
      : best;
  });*/
}
function schoolOffer(school, student){
    if (schoolRankStudent(school, student) >=2){ //wouldn't it be the same for all rounds idk, for how many rounds do i need. maybe go thorugh and do all the same, and just find the highest rank each time and hope that all students get an offer? idk this is what i will do for now.
      return true; //rn rank 2 and 3 are functionally the same
    }
  if(schoolRankStudent(school, student) >=1) {return true;}
  return false;
}

function studentAccept(school, student, schools){ //checking availability
  let newRank = studentRankSchool(school, student);
  if(newRank > 0){ //if student available
    if(studentAssigned(student)){
      let prevSchool = schools.find(sch => sch.name === student.schoolName);
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

function schoolRankStudent(school, student){ //later add in spanish?
  if(student[timeSlotMap[school.time]]){
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

function doneSorting(studentList, schools){
  let done = false;
  done = !schools.some(sch => sch.students < sch.capacity);
  done = !studentList.some(st => !studentAssigned(st)); //checks if all students are sorted (priority over schools filled?)
  return done; //this makes it keep going while not all schools or students returned, find a better way to show finished. maybe have round counter
  //oh this is how i have it returning? that's problematic h
}
