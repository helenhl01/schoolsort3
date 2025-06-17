import {SCHOOLS, TIMES, timeSlotMap} from './configs';

function handleDragEnd(event) {
    const {over, active} = event;
    //setParent(over ? over.id : null); //where is this actually used
    const dest = over.id; //doesn't work if over is originator
    const student = active.id;
    dataTransfer({student, dest})
}
  
function dataTransfer({student, dest}){ 
    var src = SCHOOLS.find(school => school.name === student.schoolName)
    if(src === undefined){src = SCHOOLS.find(school => school.name === "Unsorted");}
    if(validDrop({student, dest})){
        src.studentList.splice(src.studentList.indexOf(student), 1);
        student.schoolName = dest.name=== "Unsorted" ? undefined : dest.name;
        dest.studentList.push(student);
    }
    else{
        alert(student.eid + " is not available at this time");
    }   
}
  
function validDrop({student, dest}){
    if(dest.time === "unsorted"){return true;}
    if(student[timeSlotMap[dest.time]]){return true;};
    return false;
}

export default handleDragEnd;