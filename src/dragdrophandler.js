import {timeSlotMap} from './configs';

function dataTransfer({student, dest, studentList, setStudentList}){
    if (!validDrop({ student, dest })) {
        alert(student.eid + " is not available at this time");
        return;
    }
    setStudentList(studentList.map((s) =>
        s.eid === student.eid
            ? { ...s, schoolName: dest.name === "Unsorted" ? undefined : dest.name }
            : s
    ));
}

function validDrop({student, dest}){
    if(dest.time === "unsorted"){return true;}
    if(student[timeSlotMap[dest.time]]){return true;};
    return false;
}

export default dataTransfer;