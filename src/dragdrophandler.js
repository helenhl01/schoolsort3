import {SCHOOLS, TIMES} from './configs';

function handleDragEnd(event) {
    const {over, active} = event;
    //setParent(over ? over.id : null); //where is this actually used
    const dest = over.id; //doesn't work if over is originator
    const student = active.id;
    dataTransfer({student, dest})
}
  
function dataTransfer({student, dest}){ 
    var src = SCHOOLS.find(school => school.name === student.schoolName); //need to handle if comnig from unsorted
    console.log(student);
    console.log(dest);
    if(validDrop({student, dest})){
        src.studentList.splice(src.studentList.indexOf(student), 1);
        student.schoolName = dest.name;
        dest.studentList.push(student);
    }
    else{
        alert(student.eid + " is not available at this time");
    }   
}
  
function validDrop({student, dest}){
    if(dest.time === "M1"){if (student.monday1 > 0){ return true;}}
    if(dest.time === "T1"){if (student.tuesday1 > 0){ return true;}}
    if(dest.time === "W1"){if (student.wednesday1 > 0){ return true;}}
    if(dest.time === "R1"){if (student.thursday1 > 0){ return true;}}
    if(dest.time === "M2"){if (student.monday1 > 0){ return true;}}
    if(dest.time === "T2"){if (student.tuesday2 > 0){ return true;}}
    if(dest.time === "W2"){if (student.wednesday2 > 0){ return true;}}
    if(dest.time === "R2"){if (student.thursday2 > 0){ return true;}}
    if(dest.time === "unsorted"){return true;}
    return false;
}

export default handleDragEnd;