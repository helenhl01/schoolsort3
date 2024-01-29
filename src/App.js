import './App.css';
import axios from 'axios';
import { useState } from 'react';
import AllTimeSlots from './timeSlots';
import {SCHOOLS, TIMES} from './configs';
import {populateStudents, renderStudent} from './students';
import Button from '@mui/material/Button';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';
import {DndContext} from '@dnd-kit/core';
import handleDragEnd from './dragdrophandler';


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

function UploadFile({rerender}) {
  const onChangeHandler = (event) => {
    const selectedFile = event.target.files[0];
    let uploaded = new FormData();
    uploaded.append("file", selectedFile);

    axios.post("http://localhost:8000/upload", uploaded)
      .then(response => {
        let studentList = response.data;
        populateStudents(studentList);
        rerender();
    });
  }

  return(
    <div>
      <Button  variant="contained" component="label" color="primary" >Upload File
        <input type="file" name="file" hidden onChange={onChangeHandler} />
      </Button>
    </div>
  )
}

function schoolReports(){
  for(var sch in SCHOOLS){
    console.log(SCHOOLS[sch].name + " has " + SCHOOLS[sch].students + " students and " + SCHOOLS[sch].rides + " rides");  
    console.log(SCHOOLS[sch].studentList);
  }
}

function download(){
  const students = [];
  let csv = "";
  for (const time of TIMES) {
    for (const sch of time.schools){
      csv += sch.name + "\n";
      for (const st of sch.studentList) {
        st.schoolName = sch.name;
        students.push(st);
        csv += "," + st.firstName + " " + st.lastName;
        if (st.carSpace) {csv += "," + st.carSpace;}
        else {csv += ",";}
        if (st.po && st.po === true) {
          csv += ",PO";
        } else if (st.exec && st.exec === true) {
          csv += ",Exec";
        } else {
          csv += ",";
        }
        csv += "," + st.eid + "," + st.email +"," + st.phone + "\n";
      }
    }
  }

  const fileData = JSON.stringify(students);
  const blob = new Blob([fileData], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "seek-students.json";
  link.href = url;
  link.click();

  const blob2 = new Blob([csv], { type: "text/plain" });
  const url2 = URL.createObjectURL(blob2);
  const link2 = document.createElement("a");
  link2.download = "seek-schedule.csv";
  link2.href = url2;
  link2.click();
}


function App() {
  const [dummy, setDummy] = useState(null);
  return (
    <ThemeProvider theme={theme}> <br />
      <div className="horiz-box">
        <UploadFile rerender={() => setDummy(true)}/>
        <Button variant="contained" component="label" color="primary" onClick={ () => download({TIMES})}>Generate File</Button>
      </div>
      <br/>
      <DndContext onDragEnd={handleDragEnd}>
        <AllTimeSlots/>
      </DndContext>
    </ThemeProvider>
  );
}

export default App;
