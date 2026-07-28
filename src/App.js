import './App.css';
import { useState, useEffect } from 'react';
import AllTimeSlots from './timeSlots.js';
import { SCHOOLS as INITIAL_SCHOOLS, TIMES as INITIAL_TIMES } from './configs';
import Button from '@mui/material/Button';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import {DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors} from '@dnd-kit/core';
import dataTransfer from './dragdrophandler.js';
import { UploadFile, UploadResponses, download } from './datahandler.js';
import {Sort} from './sort.js';
import StudentModal from './StudentModal.js';

const STORAGE_KEY = "schoolsort-studentList";

function loadStudentList(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#FAD7A0',
      contrastText: '#000',
      //darker: '#FAD7A0',
    },
    /*neutral: { 
      main: '#64748B',
      contrastText: '#fff',
    }, */
  },
});




function App() {
  const [dummy, setDummy] = useState(null);
  const [studentList, setStudentList] = useState(loadStudentList);
  const [schools, setSchools] = useState(INITIAL_SCHOOLS);
  const [times, setTimes] = useState(INITIAL_TIMES);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // require a small pointer move before dnd-kit starts a drag, so a plain click on a student (no movement) still fires a click event to open the modal
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    useSensor(KeyboardSensor)
  );

  function schoolReports(){ //simplify this function
    const grouped = {};

    for (const student of studentList){
      const schoolName = student.schoolName || "Unsorted"; //i don't t hink it's actually handling unsorted correctly, later count how many assigned?
      if(!grouped[schoolName]){
        grouped[schoolName] = [];
      }
      grouped[schoolName].push(student);
    }

    for(const school of schools){
      const students = grouped[school.name] || [];
      const rides = students.reduce((acc, s) => acc + (s.carSpace || 0), 0);

      console.log(`${school.name} has ${students.length} / ${school.capacity} students and ${rides} rides.`);
      console.log(students);
    }
  }

  function createHandleDragEnd({ schools, studentList, setStudentList }) {
    return function handleDragEnd(event) {
      const { over, active } = event;
      console.log(event);
      if (!over || !active) return;

      const dest = schools.find(s => s.name === over.id);
      const student = studentList.find(s => s.eid === active.id);
      
      if (!dest || !student) return;
      //console.log("dragging " + student.eid + " from " + student.schoolName + " to " + dest.name);
      dataTransfer({ student, dest, studentList, setStudentList });
    };
  }
  const handleDragEnd = createHandleDragEnd({ schools, studentList, setStudentList });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studentList));
  }, [studentList]);

  function clearStorage(){
    if(window.confirm("Clear all saved data? This cannot be undone.")){
      localStorage.removeItem(STORAGE_KEY);
      setStudentList([]);
    }
  }

  function updateStudent(updated){
    setStudentList(prev => prev.map(s => s === selectedStudent ? updated : s));
    setSelectedStudent(updated);
  }

  return (
    <ThemeProvider theme={theme}> <br />
      <div className="horiz-box">
        <UploadFile rerender={() => setDummy(true)} studentList={studentList} setStudentList={setStudentList}/>
        <UploadResponses rerender={() => setDummy(true)} studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={ () => download(times)}>Generate File</Button>
        <Sort studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={schoolReports}>School Reports</Button>
        <Button variant="contained" component="label" color="error" onClick={clearStorage}>Clear Saved Data</Button>
      </div>
      <br/>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <AllTimeSlots schools={schools} setSchools={setSchools} times={times} setTimes={setTimes} studentList={studentList} onSelectStudent={setSelectedStudent}/>
      </DndContext>
      <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onSave={updateStudent}/>
    </ThemeProvider>
  );
}

export default App;
