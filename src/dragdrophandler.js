import {SCHOOLS, TIMES, timeSlotMap} from './configs';

function handleDragEnd(event) {
    const {over, active} = event;
    //setParent(over ? over.id : null); //where is this actually used
    const dest = over.id; //doesn't work if over is originator
    const student = active.id;
    dataTransfer({student, dest})
}
  
function dataTransfer({student, dest, schools, setSchools}){ 
    //also need to update studentList
   /* const isUnassigned = !student.schoolName || student.schoolName === "Unsorted";
      const assignedSchool = isUnassigned
        ? updatedSchools.find(s => s.name === "Unsorted")
        : updatedSchools.find(s => s.name === student.schoolName);
        */
    const updatedSchools = schools.map((school) => {
        // Remove student from their current school
        if (school.name === student.schoolName || (student.schoolName === undefined && school.name === "Unsorted")) {
          return {
            ...school,
            studentList: school.studentList.filter((s) => s.eid !== student.eid),
          };
        }
        // Add student to destination school
        if (school.name === dest.name) {
          return {
            ...school,
            studentList: [...school.studentList, { ...student, schoolName: dest.name === "Unsorted" ? undefined : dest.name }],
          };
        }
        // Other schools remain unchanged
        return school;
      });
    
    if (validDrop({ student, dest })) {
        setSchools(updatedSchools);
    } else {
        alert(student.eid + " is not available at this time");
    }  
}
  
function validDrop({student, dest}){
    if(dest.time === "unsorted"){return true;}
    if(student[timeSlotMap[dest.time]]){return true;};
    return false;
}

export default dataTransfer;