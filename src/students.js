import {SCHOOLS, TIMES} from './configs';
import { allTimeSlots, renderSchools } from './timeSlots';

import {useDraggable} from '@dnd-kit/core';

function RenderStudent({student}){
  //console.log(student);
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
      id: student, //do i need to change id?
      //data: student.schoolName,
    });
    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;
    return (
      <div key={student.eid} id={student.eid} role="button" ref={setNodeRef} style={style} {...listeners} {...attributes}>
          <div className={`student tooltip ${student.po ? "po" : ""} ${student.exec ? "exec" : ""}`}>
            <p>{student.firstName + " " + student.lastName}</p>
            {tooltip(student)} 
          </div>
        </div>
    );
  }
  
  function tooltip(student){
    var tooltiptext = "";
    if(student.po){tooltiptext += 'PO\n';} //bold
    if(student.exec){tooltiptext += 'Exec\n';} //bold
    if(student.carSpace > 0){tooltiptext += 'Can drive: ' + student.carSpace;} //can't figure out newline
    tooltiptext += 'Availability:'; //italics
    if(student.monday1){ tooltiptext += 'Monday at 2:30\n'}; //can't figure out newline, \n and <br> don't work
    if(student.monday2){ tooltiptext += 'Monday at 3:30\n'}; 
    if(student.tuesday1){ tooltiptext += 'Tuesday at 2:30\n'};
    if(student.tuesday2){ tooltiptext += 'Tuesday at 3:30\n'};
    if(student.wednesday1){ tooltiptext += 'Wednesday at 2:30\n'};
    if(student.wednesday2){ tooltiptext += 'Wednesday at 3:30\n'};
    if(student.thursday1){ tooltiptext += 'Thursday at 2:30\n'};
    if(student.thursday2){ tooltiptext += 'Thursday at 3:30\n'};
    return (
      <span className="tooltiptext">
        {tooltiptext}</span> 
    );
  }

  function addStudent(student){ //add student to school's studentList if school assigned
    var sch = SCHOOLS.find(school => school.name === student.schoolName);
    if(sch === undefined){
      //console.log(student.eid + " is unsorted"); //need to add to unsorted
    }
    else{
      //console.log(student.eid + " is in " + sch.name);
      if(!sch.studentList.includes(student)){
        sch.studentList.push(student);
        sch.students++;
        if(student.carSpace > 0){
          sch.rides += student.carSpace;
        }
      }
    }
  } 

export {RenderStudent, addStudent};