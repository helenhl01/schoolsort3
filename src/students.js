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
    const tooltiptext = [];
    if(student.po){tooltiptext.push(<b>PO</b>, < br />)}
    if(student.exec){tooltiptext.push(<b>Exec</b>, < br />);} //bold
    if(student.carSpace > 0){tooltiptext.push("Can drive: ", student.carSpace, < br />)} //change this line to just adding pure text instead of span?
    tooltiptext.push(<i>Availability:</i>, < br />)
    if(student.monday1){tooltiptext.push("Monday at 2:30", < br />)};
    if(student.monday2){tooltiptext.push("Monday at 3:30", < br />)}; 
    if(student.tuesday1){tooltiptext.push("Tuesday at 2:30", < br />)};
    if(student.tuesday2){tooltiptext.push("Tuesday at 3:30", < br />)};
    if(student.wednesday1){tooltiptext.push("Wednesday at 2:30", < br />)};
    if(student.wednesday2){tooltiptext.push("Wednesday at 3:30", < br />)};
    if(student.thursday1){tooltiptext.push("Thursday at 2:30", < br />)};
    if(student.thursday2){tooltiptext.push("Thursday at 3:30", < br />)};
    return (
      <span className="tooltiptext">{tooltiptext}</span> 
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