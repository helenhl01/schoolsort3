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
  const [view, setView] = useState('schedule');

  // Snapshot each student's assignment exactly once, on first render - this is the
  // "since last refresh" baseline. A ref (not state) because it must never itself trigger
  // a re-render or be recomputed later; the lazy-init-in-render pattern (checking .current
  // and setting it inline) guarantees it's captured before the first paint, unlike a
  // useEffect version which would run one render too late.
  const initialAssignmentsRef = useRef(null);
  if (initialAssignmentsRef.current === null) {
    initialAssignmentsRef.current = new Map(studentList.map(s => [s.eid, s.schoolName]));
  }

  // Students whose current schoolName no longer matches that baseline - covers drag-and-drop,
  // the modal edit, and the Sort button alike, since all three ultimately just change studentList.
  const changedEids = useMemo(() => {
    const baseline = initialAssignmentsRef.current;
    return new Set(studentList.filter(s => baseline.get(s.eid) !== s.schoolName).map(s => s.eid));
  }, [studentList]);

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

  function deleteStudent(toDelete){
    setStudentList(prev => prev.filter(s => s !== toDelete));
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
              <UploadFile rerender={() => setDummy(true)} studentList={studentList} setStudentList={setStudentList} />
              <UploadResponses rerender={() => setDummy(true)} studentList={studentList} setStudentList={setStudentList}/>
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
