import {SCHOOLS, TIMES} from './configs.js';
import {populateStudents, RenderStudent} from './students';
import {useDroppable} from '@dnd-kit/core';

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
  //console.log(schools);
  //for(const sch in schools){
  //  console.log(schools[sch].studentList);
  //  schools[sch].studentList.map((student) => console.log(student));
  //}
  const {isOver, setNodeRef} = useDroppable({ //drop not seeming to work rn
    id: schools[0], //do i need to change id?seems to not be unique rn bci have one componentn rendering multiple schools
  });
  const style = { 
    color: isOver ? 'green' : undefined,
  };
    return schools.map((school) => (
        <div className="school" ref={setNodeRef} style={style} key={school.name} id={school.name}>
            <p className="schoolNameText" >{school.name}</p>
            {school.studentList.map((student) => <RenderStudent student={student} />)}
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