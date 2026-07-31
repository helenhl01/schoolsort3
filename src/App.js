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

// Collapses every "not really assigned" spelling (missing, empty string, or the literal
// string "Unsorted" that AllTimeSlots writes back onto unassigned students) into a single
// value, so comparisons can't tell those apart as if one were a real assignment change.
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

  // Each student's baseline is captured the first time their eid is ever seen in
  // studentList this session - not just once at mount. That covers both the students
  // loaded from localStorage at page load AND students who first appear later via a
  // mid-session upload (their baseline is however they arrived in that file, not "unset").
  // A ref (not state) because recording a baseline must never itself trigger a re-render;
  // running this directly in the render body (not an effect) guarantees any newly-arrived
  // students get their baseline locked in during the very same render that introduces them,
  // before AllTimeSlots's populate effect gets a chance to touch their schoolName.
  const initialAssignmentsRef = useRef(new Map());
  for (const s of studentList) {
    if (!initialAssignmentsRef.current.has(s.eid)) {
      initialAssignmentsRef.current.set(s.eid, normalizeSchoolName(s.schoolName));
    }
  }

  // Students whose current schoolName no longer matches their baseline - covers drag-and-drop,
  // the modal edit, and the Sort button alike, since all three ultimately just change studentList.
  // Both sides go through normalizeSchoolName so "never assigned" and "assigned to Unsorted" read
  // as the same thing - AllTimeSlots's populate effect silently rewrites an unassigned student's
  // schoolName from undefined/"" to the literal string "Unsorted" as bookkeeping, and without this
  // normalization that rewrite alone (with no real assignment change) would look like a change.
  const changedEids = useMemo(() => {
    const baseline = initialAssignmentsRef.current;
    return new Set(
      studentList
        .filter(s => baseline.get(s.eid) !== normalizeSchoolName(s.schoolName))
        .map(s => s.eid)
    );
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

  // A fresh upload is a new "how they started" source of truth, not an edit - it should wipe
  // the changed-session baseline and start over, rather than let per-eid entries from a PRIOR
  // upload linger and get compared against a completely different file's data (e.g. uploading
  // a CSV of survey responses, which never carries assignments, over a JSON roster that did
  // have real assignments - every student would otherwise look like they'd been unassigned).
  // Only wired up to the two upload components below; Sort/drag-and-drop/the modal still use
  // the plain setStudentList, since those genuinely should count as changes within a session.
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
