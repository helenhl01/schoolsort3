import axios from 'axios';
import { addStudent } from './students';
import Button from '@mui/material/Button';
import {SCHOOLS, TIMES} from './configs';

function UploadFile({ rerender }) {
  const onChangeHandler = (event) => {
    const selectedFile = event.target.files[0];
    let uploaded = new FormData();
    uploaded.append("file", selectedFile);

    axios.post("http://localhost:8000/upload", uploaded)
      .then(response => {
        let studentList = response.data;
        studentList.map(addStudent);
        rerender();
      });
  };

  return (
    <div>
      <Button variant="contained" component="label" color="primary">Upload File
        <input type="file" name="file" hidden onChange={onChangeHandler} />
      </Button>
    </div>
  );
}

function download(){
  const students = [];
  let csv = "";
  for (const time of TIMES) {
    for (const sch of time.schools){
      if(sch.name === "Unsorted"){
        for(const st of sch.studentList){
          students.push(st);}
        continue;
      } //don't export unsorted students to csv 
      csv += sch.name + "\n";
      for (const st of sch.studentList) {
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
//export unsorted students to json but not csv
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

export { UploadFile, download };