import axios from 'axios';
//import { addStudent } from './students.js';
import Button from '@mui/material/Button';
import {TIMES} from './configs.js';
import { useRef, useEffect } from "react";

function UploadFile({ rerender, studentList, setStudentList }) {
  const onChangeHandler = (event) => {
    const selectedFile = event.target.files[0];
    let uploaded = new FormData();
    uploaded.append("file", selectedFile);

    axios.post("http://localhost:8000/upload", uploaded)
      .then(response => {
        let studentList = response.data; //make global and accessible for when sort is called. 
       // console.log(typeof studentList);
        //console.log(studentList);
        //console.log(studentList.length);
        //studentList.forEach(addStudent);
        rerender();
        //console.log(typeof studentList);
        setStudentList(studentList);
        return studentList;
      })
      /*.then(studentList => {
        //console.log(studentList);
        const data = {
          studentList: studentList,
        };
        return axios.post("http://localhost:8000/sort", data); // Use studentList in the second then block
      })
      .then(response => {
        console.log(response);
        //rerender(); // Call rerender here if needed after both requests finish
      });*/
    };


  return (
    <div>
      <Button variant="contained" component="label" color="primary">Upload File
        <input type="file" name="file" hidden onChange={onChangeHandler} />
      </Button>
    </div>
  );
}

const CSV_HEADERS = ["Time", "School", "First Name", "Last Name", "Car Space", "Role", "EID", "Email", "Phone"];

// Wraps a field in quotes (doubling any internal quotes) whenever it contains
// a comma, quote, or newline, per RFC 4180 - so names/emails with odd characters can't corrupt the row structure.
function csvEscape(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsvRow(fields) {
  return fields.map(csvEscape).join(",");
}

function studentRole(student) {
  if (student.po) return "PO";
  if (student.exec) return "Exec";
  return "";
}

function download(times){
  console.log(times);
  const students = [];
  const csvRows = [toCsvRow(CSV_HEADERS)];
  for (const time of times) {
    for (const sch of time.schools){
      if(sch.name === "Unsorted"){
        for(const st of sch.studentList){
          students.push(st);}
        continue;
      } //don't export unsorted students to csv
      for (const st of sch.studentList) {
        students.push(st);
        csvRows.push(toCsvRow([
          time.timeName,
          sch.name,
          st.firstName,
          st.lastName,
          st.carSpace || "",
          studentRole(st),
          st.eid,
          st.email,
          st.phone,
        ]));
      }
    }
  }
  const csv = csvRows.join("\r\n");
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