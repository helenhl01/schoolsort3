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

function RenderSchools({schools}){ 
    return schools.map((school) => (
        <div className="school">
            <p className="schoolNameText" >{school.name}</p>
            {school.studentList.map(renderStudent)}
        </ div>
    ));
}

function TimeSlot({time}){
    if(time.orange){
      return (
        <div className="timeSlot orangeTimeSlot" key={time.id}>
        <h4 >{time.timeName}</h4>
        <RenderSchools schools={time.schools} />
        </div>)
    }
    else{
      return (
        <div className="timeSlot" key={time.id}>
        <h4 >{time.timeName}</h4>
        <RenderSchools schools={time.schools} />
        </div>)
    }
  }
  
function AllTimeSlots(){ 
  schools(TIMES);

  return TIMES.map((time) => (
    <TimeSlot time={time} />
  ));
}

export default AllTimeSlots;