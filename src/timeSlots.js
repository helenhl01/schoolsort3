import {RenderStudent} from './students.js';
import {useDroppable} from '@dnd-kit/core';
import React, { useEffect, useState } from "react";



function RenderSchool({school, studentList}){
  const {isOver, setNodeRef} = useDroppable({ 
    id: school, 
  }); 
  const style = { 
    color: isOver ? 'orange' : undefined,
  };
    return (
        <div className={`school  ${school.time == 'unsorted' ? "hidden" : ""}`} ref={setNodeRef} style={style} key={school.name} id={school.name}>
            <p className="schoolNameText" >{school.name}</p>
            {studentList.filter(s => s.schoolName === school.name).map(student => <RenderStudent key={student.eid} student={student} />)}
        </ div>
    );
}

function AllTimeSlots({schools, times, studentList}){  //rerenders every time
  const [timesWithSchools, setTimesWithSchools] = useState([]);

  useEffect(() => {
    const populatedTimes = times.map(time => ({
      ...time,
      schools: schools.filter(school => school.time === time.id)
    }));
    setTimesWithSchools(populatedTimes);
  }, [schools, times]);

  return timesWithSchools.map((time, index) => 
      (<div className={`timeSlot  ${Math.floor(index / 4) % 2 ? (index % 2 ? "orangeTimeSlot" : "") : (index % 2 ? "" : "orangeTimeSlot")}`} key={time.id}>
      <h4 >{time.timeName}</h4>
      {time.schools.map((school) => 
        (<RenderSchool key={school.name} school={school} studentList={studentList}/>)
      )}
      </div>)
);

}

export default AllTimeSlots;