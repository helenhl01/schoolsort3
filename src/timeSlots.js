import {SCHOOLS, TIMES} from './configs.js';
import {RenderStudent} from './students.js';
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

function RenderSchool({school}){
  const {isOver, setNodeRef} = useDroppable({ 
    id: school, 
  }); 
  const style = { 
    color: isOver ? 'green' : undefined,
  };
    return (
        <div className={`school  ${school.time == 'unsorted' ? "hidden" : ""}`} ref={setNodeRef} style={style} key={school.name} id={school.name}>
            <p className="schoolNameText" >{school.name}</p>
            {school.studentList.map((student) => <RenderStudent student={student} />)}
        </ div>
    );
}

function AllTimeSlots(){ 
  schools(TIMES);

  return TIMES.map((time, index) => 
      (<div className={`timeSlot  ${Math.floor(index / 4) % 2 ? (index % 2 ? "orangeTimeSlot" : "") : (index % 2 ? "" : "orangeTimeSlot")}`} key={time.id}>
      <h4 >{time.timeName}</h4>
      {time.schools.map((school) => 
        (<RenderSchool school={school} />)
      )}
      </div>)
);

}

export default AllTimeSlots;