import './App.css';
import { useState } from 'react';
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
  //<p>{JSON.stringify(studentList)}</p>
  console.log("INITIAL_SCHOOLS", INITIAL_SCHOOLS);
  console.log("INITIAL_TIMES", INITIAL_TIMES);
  function schoolReports(){
    for(var sch of schools){ //why this instead of sch.students
      console.log(sch.name + " has " + sch.students + " students and " + sch.rides + " rides");  
      console.log(sch.studentList);
    }
  }

  return (
    <ThemeProvider theme={theme}> <br />
      <div className="horiz-box">
        <UploadFile rerender={() => setDummy(true)} studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={ () => download({times})}>Generate File</Button>
        <Sort studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={schoolReports}>School Reports</Button>
      </div>
      <br/>
      <DndContext onDragEnd={handleDragEnd}>
        <AllTimeSlots schools={schools} times={times} studentList={studentList}/>
      </DndContext>
    </ThemeProvider>
  );
}

export default App;
