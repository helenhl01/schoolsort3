import {SCHOOLS, TIMES, AVAILABILITY_FIELDS} from './configs.js';
import {useDraggable} from '@dnd-kit/core';

function RenderStudent({student, onSelectStudent, changed}){
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
      id: student.eid, //should be unique
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
    <div key={student.eid} id={student.eid} role="button" ref={setNodeRef} style={style} {...listeners} {...attributes} className={`student tooltip ${student.po ? "po" : ""} ${student.exec ? "exec" : ""}`}>
      {changed && <span className="changed-dot" title="Assignment changed this session" />}
      <p className="studentName" onClick={() => onSelectStudent(student)}>{student.firstName + " " + student.lastName}</p>
      {tooltip(student)}
    </div>
    </div>
  );
  }
  
  function tooltip(student){
    const tooltiptext = [];
    if(student.po){tooltiptext.push(<b>PO</b>, < br />)}
    if(student.exec){tooltiptext.push(<b>Exec</b>, < br />);} //bold
    if(student.carSpace > 0){tooltiptext.push("Can drive: ", student.carSpace, < br />)} 
    tooltiptext.push(<i>Availability:</i>, < br />)
    for (const [key, label] of AVAILABILITY_FIELDS) {
      if (student[key]) { tooltiptext.push(label, < br />); }
    }

    return (
      <span className="tooltiptext">{tooltiptext}</span> 
    );
  }
  //also add a boo lo say their placement will NOT be changed... maybe increase rank? handle in server.

export {RenderStudent};