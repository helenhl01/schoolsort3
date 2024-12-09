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
  for(var sch in SCHOOLS){
    console.log(SCHOOLS[sch].name + " has " + SCHOOLS[sch].students + " students and " + SCHOOLS[sch].rides + " rides");  
    console.log(SCHOOLS[sch].studentList);
  }
}




function App() {
  const [dummy, setDummy] = useState(null);
  return (
    <ThemeProvider theme={theme}> <br />
      <div className="horiz-box">
        <UploadFile rerender={() => setDummy(true)}/>
        <Button variant="contained" component="label" color="primary" onClick={ () => download({TIMES})}>Generate File</Button>
        <Button variant="contained" component="label" color="primary" onClick={() => console.log("sort button clicked")}>Sort!</Button>
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
