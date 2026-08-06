import './App.css';
import { useState, useEffect, useMemo, useRef } from 'react';
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
import SpreadsheetView from './SpreadsheetView.js';

const STORAGE_KEY = "schoolsort-studentList";

function loadStudentList(){
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// all non-assignments assigned same undefined value
function normalizeSchoolName(schoolName){
  return (!schoolName || schoolName === "Unsorted") ? undefined : schoolName;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#FAD7A0',
      contrastText: '#000',
      //darker: '#FAD7A0',
    },
    error: {
      main: '#faa0a0',
      contrastText: '#000',
      //darker: '#FAD7A0',
    },
  },
});




function App() {
  const [dummy, setDummy] = useState(null);
  const [studentList, setStudentList] = useState(loadStudentList);
  const [schools, setSchools] = useState(INITIAL_SCHOOLS);
  const [times, setTimes] = useState(INITIAL_TIMES);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [view, setView] = useState('schedule');


  //set baseline map of all students first time they populate, including from localstorage if not already in the map
  const initialAssignmentsRef = useRef(new Map());
  for (const s of studentList) {
    if (!initialAssignmentsRef.current.has(s.eid)) {
      initialAssignmentsRef.current.set(s.eid, normalizeSchoolName(s.schoolName));
    }
  }

  // Students whose current schoolName no longer matches their baseline 
  const changedEids = useMemo(() => { //only runs when studentlist changes, not any other rerenders
    const baseline = initialAssignmentsRef.current;
    return new Set(
      studentList
        .filter(s => baseline.get(s.eid) !== normalizeSchoolName(s.schoolName))
        .map(s => s.eid) //returns set of students who don't match their baseline school assignment (mapped on upload)
    );
  }, [studentList]);

  // require a small pointer move before dnd-kit starts a drag, so a plain click on a student (no movement) still fires a click event to open the modal
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    useSensor(KeyboardSensor)
  );

  function schoolReports(){ //console print all school capacities, num students, num rides, student list
    for(const school of schools){
      const students = studentList.filter(s=> (s.schoolName || "Unsorted") === school.name);
      const rides = students.reduce((acc, s) => acc + (s.carSpace || 0), 0);
      console.log(`${school.name} has ${students.length} / ${school.capacity} students and ${rides} rides.`);
      console.log(students);
    }
  }

  //handle drop and transfer student school
  function createHandleDragEnd({ schools, studentList, setStudentList }) {
    return function handleDragEnd(event) {
      const { over, active } = event;
      if (!over || !active) return;

      const dest = schools.find(s => s.name === over.id);
      const student = studentList.find(s => s.eid === active.id);
      
      if (!dest || !student) return;

      dataTransfer({ student, dest, studentList, setStudentList });
    };
  }
  const handleDragEnd = createHandleDragEnd({ schools, studentList, setStudentList });

  useEffect(() => { //save to localbrowser storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(studentList));
  }, [studentList]);

  function clearStorage(){
    if(window.confirm("Clear all saved data? This cannot be undone.")){
      localStorage.removeItem(STORAGE_KEY);
      setStudentList([]);
    }
  }

  // replace selected student's information with updated draft information
  function updateStudent(updated){
    setStudentList(prev => prev.map(s => s === selectedStudent ? updated : s));
    setSelectedStudent(updated);
  }

  function deleteStudent(toDelete){
    setStudentList(prev => prev.filter(s => s !== toDelete));
  }

  // upon upload, all student assignments are stored in initialAssignmentsRef map to track if assignment changes have been made in the current session
  //replaces whole map even if students already existed before
  function handleUpload(newStudentList){
    initialAssignmentsRef.current = new Map(newStudentList.map(s => [s.eid, normalizeSchoolName(s.schoolName)]));
    setStudentList(newStudentList);
  }

  return (
    <ThemeProvider theme={theme}> <br />
      <div className="view-tabs">
        <button className={`view-tab ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}>Schedule</button>
        <button className={`view-tab ${view === 'spreadsheet' ? 'active' : ''}`} onClick={() => setView('spreadsheet')}>Spreadsheet</button>
      </div>
      <div className="view-panel">
        {view === 'schedule' ?
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="horiz-box">
              <UploadFile rerender={() => setDummy(true)} studentList={studentList} setStudentList={handleUpload} />
              <UploadResponses rerender={() => setDummy(true)} studentList={studentList} setStudentList={handleUpload}/>
              <Button variant="contained" component="label" color="error" onClick={clearStorage} title="delete all student info, will not repopulate on refresh">Clear Saved Data</Button>
            </div>
            <div className="horiz-box">
              <Sort studentList={studentList} setStudentList={setStudentList}/>
              <Button variant="contained" component="label" color="primary" onClick={schoolReports} title="console print school reports (num students assigned, capacity, num rides, student list)">School Reports</Button>
              <Button variant="contained" component="label" color="primary" onClick={ () => download(times)} title="download JSON save file and CSV roster spreadsheet">Download Files</Button>
            </div>
            <br/>
            <AllTimeSlots schools={schools} setSchools={setSchools} times={times} setTimes={setTimes} studentList={studentList} onSelectStudent={setSelectedStudent} changedEids={changedEids}/>
          </DndContext>
          :
          <SpreadsheetView studentList={studentList} schools={schools} times={times} onSelectStudent={setSelectedStudent} changedEids={changedEids}/>
        }
      </div>
      <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onSave={updateStudent} onDelete={deleteStudent}/>
    </ThemeProvider>
  );
}

export default App;
