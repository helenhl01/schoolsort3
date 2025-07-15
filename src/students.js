import {SCHOOLS, TIMES} from './configs.js';
import {useDraggable} from '@dnd-kit/core';

function RenderStudent({student}){ //after sort is adding twice. need to emliminate duplicates. all of them are rerendered i think
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
      id: student, //do i need to change id?
      //data: student.schoolName,
    });
  let style = (transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {});
  style.visibility = "visible";
  if(student.po){style['backgroundColor'] = "#FEF5E7";}
    else if(student.exec){
      style['backgroundColor'] = "#FAD7A0";
      style['border'] = "2px solid #FAD7A0";}
    else{style['backgroundColor'] = "white";}

  return (
    <div >
    <div id={student.eid} role="button" ref={setNodeRef} style={style} {...listeners} {...attributes} className={`student tooltip ${student.po ? "po" : ""} ${student.exec ? "exec" : ""}`}>
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
    if(student.carSpace > 0){tooltiptext += 'Can drive: ' + student.carSpace + '\n';} //can't figure out newline
    tooltiptext += 'Availability:\n'; //italics
    if(student.monday1){ tooltiptext += 'Monday at 2:30\n'}; //can't figure out newline, \n and <br> don't work
    if(student.monday2){ tooltiptext += 'Monday at 3:30\n'}; 
    if(student.tuesday1){ tooltiptext += 'Tuesday at 2:30\n'};
    if(student.tuesday2){ tooltiptext += 'Tuesday at 3:30\n'};
    if(student.wednesday1){ tooltiptext += 'Wednesday at 2:30\n'};
    if(student.wednesday2){ tooltiptext += 'Wednesday at 3:30\n'};
    if(student.thursday1){ tooltiptext += 'Thursday at 2:30\n'};
    if(student.thursday2){ tooltiptext += 'Thursday at 3:30\n'};
    return (
      <span className="tooltiptext" dangerouslySetInnerHTML={{ __html: tooltiptext.replace(/\n/g, "<br />") }} /> 
    );
  }

  function addStudent(student){ //add student to school's studentList if school assigned, for render
    var sch = SCHOOLS.find(school => school.name === student.schoolName);
   /*if(!SCHOOLS.some(school => school.name === student.schoolName)){ //right now, during the first render, it is pulling an error for every student who is unsorted (no data in schoolName field)
      console.log("Student " + student.eid + " is assigned to an invalid school or a school that does not exist");
    }*/
    if(!student.schoolName || !sch){ //add student to unsorted
      sch = SCHOOLS.find(school => school.time === "unsorted");
      sch.studentList.push(student);
      sch.students++;
    }
    else{
      if(!sch.studentList.includes(student)){ //if student not already in school's list, add tehm
        sch.studentList.push(student);
        sch.students++;
        if(student.carSpace > 0){
          sch.rides += student.carSpace;
        }
        console.log(student.eid + " added to " + sch.name);
      }
    }
  } 
  //maybe a bool to indicate if student's school has been changed?
  //also add a boo lo say their placement will NOT be changed... maybe increase rank?

export {RenderStudent, addStudent};