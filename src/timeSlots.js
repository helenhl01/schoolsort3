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

function AllTimeSlots({schools, setSchools, times, setTimes, studentList}){  
  //const [timesWithSchools, setTimesWithSchools] = useState([]);

  useEffect(() => {
    //console.log("effect hook run");
    const updatedSchools = schools.map(school => ({
      ...school,
      studentList: [],
      students : 0, //if a student remains unsorted, they may not be counted?
      rides : 0, //have to reset
    }));

    for (const student of studentList) {
      const isUnassigned = !student.schoolName || student.schoolName === "Unsorted";
      const assignedSchool = isUnassigned
        ? updatedSchools.find(s => s.name === "Unsorted")
        : updatedSchools.find(s => s.name === student.schoolName);
      if (assignedSchool) { //check if this is true for unsorted students
        assignedSchool.studentList.push(student);
        assignedSchool.students++;
        if(student.carSpace){
          assignedSchool.rides += student.carSpace;
        }
        student.schoolName = assignedSchool.name;
      }
    }

    const populatedTimes = times.map(time => ({ //so that timeSlots are populated with their respective schools, once
      ...time,
      schools: updatedSchools.filter(school => school.time === time.id)
    }));
    setTimes(populatedTimes);
    //console.log(populatedTimes);
    setSchools(updatedSchools);
   // console.log(updatedSchools); //students are being added to unsorted's studentlist but they shouldn't be
  }, [studentList]); //change to only dependent on studentList?

  return times.map((time, index) => 
      (<div className={`timeSlot  ${Math.floor(index / 4) % 2 ? (index % 2 ? "orangeTimeSlot" : "") : (index % 2 ? "" : "orangeTimeSlot")}`} key={time.id}>
      <h4 >{time.timeName}</h4>
      {time.schools.map((school) => 
        (<RenderSchool key={school.name} school={school} studentList={studentList}/>)
      )}
      </div>)
);

}

export default AllTimeSlots;