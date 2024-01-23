import './App.css';
import axios from 'axios';
import allTimeSlots from './timeSlots';
import {SCHOOLS, TIMES} from './configs';
import {populateStudents, renderStudent} from './students';
import Button from '@mui/material/Button';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider } from '@mui/material/styles';

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

function UploadFile(){   
  var uploaded;
  var studentList;
  const onChangeHandler=event=>{
    const selectedFile = event.target.files[0];
    uploaded = new FormData();
    uploaded.append("file", selectedFile);
    console.log(uploaded.get("file"));
    axios.post("http://localhost:8000/upload", uploaded)
    .then(response => {
      studentList = response.data; //contains the json object array of students
      populateStudents(studentList, SCHOOLS);
    })
    
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





function App() {

  return (
    <ThemeProvider theme={theme}> <br />
    <UploadFile/> <br />
    <div className="App" >
      {allTimeSlots()}
    </div>
    </ThemeProvider>
    
  );
}

export default App;
