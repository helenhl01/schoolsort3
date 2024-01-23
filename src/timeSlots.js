import {SCHOOLS, TIMES} from './configs.js';
import {populateStudents, renderStudent} from './students';

function schools(times){
    for(var time in times){ 
        for(var school in SCHOOLS){
             if(times[time].id === SCHOOLS[school].time && !times[time].schools.includes(SCHOOLS[school])){ //this is a bad fix i know...
                times[time].schools.push(SCHOOLS[school]);
            } 
        }
    }  
}

function renderSchools(schools, displayStudents, setDisplayStudents){ //ok i need this to be called when i call populate student
  console.log("schools beingx ");
    for(var sch in schools){
      console.log(schools[sch].name + " has " + schools[sch].students + " students and " + schools[sch].rides + " rides");
    }
    return schools.map((school) => (
        <div className="school">
            <p className="schoolNameText" >{school.name}</p>
            {school.studentList.map(renderStudent)}
        </ div>
    ));
}

function TimeSlot(time, displayStudents, setDisplayStudents){
    if(time.orange){
      return (
        <div className="timeSlot orangeTimeSlot" key={time.id}>
        <h4 >{time.timeName}</h4>
        <>{renderSchools(time.schools, displayStudents, setDisplayStudents)}</>
        </div>)
    }
    else{
      return (
        <div className="timeSlot" key={time.id}>
        <h4 >{time.timeName}</h4>
        <>{renderSchools(time.schools, displayStudents, setDisplayStudents)}</>
        </div>)
    }
  }
  
function allTimeSlots(displayStudents, setDisplayStudents){ 
  schools(TIMES);

  return TIMES.map((time) => (
    <>{TimeSlot(time, displayStudents, setDisplayStudents)}</>
  ));
}

export default allTimeSlots;