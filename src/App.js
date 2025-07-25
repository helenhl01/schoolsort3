import './App.css';
import { useState, useRef, useEffect } from 'react';
import AllTimeSlots from './timeSlots.js';
import { SCHOOLS as INITIAL_SCHOOLS, TIMES as INITIAL_TIMES } from './configs';
import Button from '@mui/material/Button';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import {DndContext} from '@dnd-kit/core';
import handleDragEnd from './dragdrophandler.js';
import { UploadFile, download } from './datahandler.js';
import {Sort} from './sort.js';

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
  const [studentList, setStudentList] = useState([]);
  const [schools, setSchools] = useState(INITIAL_SCHOOLS);
  const [times, setTimes] = useState(INITIAL_TIMES);

  /* const timesRef = useRef(times);

  useEffect(() => {
    console.log(times);
    timesRef.current = times;
  }, [times]);

  const handleDownload = () => {
    console.log("Latest times at click:", timesRef.current);
    download(schools, studentList, timesRef.current);
  }; */
  
  function schoolReports(){
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

  return (
    <ThemeProvider theme={theme}> <br />
      <div className="horiz-box">
        <UploadFile rerender={() => setDummy(true)} studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={() => download(times)}>Generate File</Button>
        <Sort studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={schoolReports}>School Reports</Button>
      </div>
      <br/>
      <DndContext onDragEnd={handleDragEnd}>
        <AllTimeSlots schools={schools} setSchools={setSchools} times={times} setTimes={setTimes} studentList={studentList}/>
      </DndContext>
    </ThemeProvider>
  );
}

export default App;
