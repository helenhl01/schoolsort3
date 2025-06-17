import './App.css';
import { useState } from 'react';
import AllTimeSlots from './timeSlots.js';
import {SCHOOLS, TIMES} from './configs.js';
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

function schoolReports(){
  for(var sch of SCHOOLS){ //why this instead of sch.students
    console.log(sch.name + " has " + sch.students + " students and " + sch.rides + " rides");  
    console.log(sch.studentList);
  }
}




function App() {
  const [dummy, setDummy] = useState(null);
  const [studentList, setStudentList] = useState([]);
  //<p>{JSON.stringify(studentList)}</p>
  return (
    <ThemeProvider theme={theme}> <br />
      <div className="horiz-box">
        <UploadFile rerender={() => setDummy(true)} studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={ () => download({TIMES})}>Generate File</Button>
        <Sort studentList={studentList} setStudentList={setStudentList}/>
        <Button variant="contained" component="label" color="primary" onClick={schoolReports}>School Reports</Button>
      </div>
      <br/>
      <DndContext onDragEnd={handleDragEnd}>
        <AllTimeSlots/>
      </DndContext>
    </ThemeProvider>
  );
}

export default App;
