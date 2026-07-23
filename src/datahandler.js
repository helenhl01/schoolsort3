import axios from 'axios';
//import { addStudent } from './students.js';
import Button from '@mui/material/Button';
import {TIMES} from './configs.js';
import { useRef, useEffect } from "react";
import Papa from 'papaparse';
//import { parse } from 'papaparse';

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
      if(sch.name === "Unsorted"){ //necessary?
        for(const st of sch.studentList){
          students.push(st);}
        continue;
      } //don't export unsorted students to csv
      for (const st of sch.studentList) {
        students.push(st); //do i do anything w this array?
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

function UploadResponses({ rerender, studentList, setStudentList }) {
  const onChangeHandler = async (event) => {
    const selectedFile = event.target.files[0];
    const text = await selectedFile.text()
    const parsedList = parseFormResponses(text);

    const jsonBlob = new Blob([JSON.stringify(parsedList)],
     {type : "application/json"});
    let uploaded = new FormData();
    uploaded.append("file", jsonBlob, "parsed-responses.json");

    axios.post("http://localhost:8000/upload", uploaded)
      .then(response => {
        rerender();
        setStudentList(response.data);
        return response.data;
      });
    }; 

  return (
    <div>
      <Button variant="contained" component="label" color="primary">Upload Responses
        <input type="file" name="file" hidden onChange={onChangeHandler} />
      </Button>
    </div>
  );
}

function parseFormResponses(text){
  const {data} = Papa.parse(text, { header:true, skipEmptyLines:true});
  let formatted = data.map( row => ({
    firstName: (findValueOf(row, "first name") || "").trim(),
    lastName: (findValueOf(row, "last name") || "").trim(),
    email: (findValueOf(row, "email") || "").trim(),
    phone: (findValueOf(row, "phone") || "").trim(),
    eid: (findValueOf(row, "eid") || "").trim(),
    carSpace: parseCarSpace(row),
    trainingComplete: (parseTrainingComplete(row)),
    submittedAt: parseTimestamp(row),
    po: false,
    exec: false,
    monday1: (parseAvailability(row, "monday1")), monday2: (parseAvailability(row, "monday2")),
    tuesday1: (parseAvailability(row, "tuesday1")), tuesday2: (parseAvailability(row, "tuesday2")),
    wednesday1: (parseAvailability(row, "wednesday1")), wednesday2: (parseAvailability(row, "wednesday2")),
    thursday1: (parseAvailability(row, "thursday1")), thursday2: (parseAvailability(row, "thursday2")),
//later add a field to save extra inputs, including car maybes
  })
)
  const deduped = keepLatestPerEid(formatted).map(({submittedAt, ...student}) => student);
  return deduped;
}

function parseTimestamp(row){
  const raw = findValueOf(row, "timestamp");
  const parsed = raw ? new Date(raw) : null;
  return (parsed && !isNaN(parsed)) ? parsed : null;
}

function keepLatestPerEid(students){ //if the same eid submitted more than once, keep only the latest submission
  const latestByEid = new Map();
  for(const student of students){
    const key = student.eid.trim().toLowerCase();
    const existing = latestByEid.get(key);
    if(existing && existing.submittedAt && student.submittedAt && student.submittedAt <= existing.submittedAt){
      continue; //existing submission is newer or the same age, keep it
    }
    latestByEid.set(key, student);
  }
  return [...latestByEid.values()];
}

function findValueOf(row, substrings){ //find the column matching header name of substrings argument
  const key = Object.keys(row).find( k => //check if arguments match any header names
    k.toLowerCase().includes(substrings.toLowerCase()));
  if(!key){
    console.warn(`No column found matching "${substrings}" - check if the form's question wording changed.`);
  }
  return key ? row[key] : undefined;
}

function parseCarSpace(row){
  if(findValueOf(row, "car next semester") === "Yes"){
    const seatsMatch = (findValueOf(row, "how many people") || "").match(/\d+/);
    return seatsMatch ? parseInt(seatsMatch[0], 10) : 0;
  }
  return 0;
}

function parseTrainingComplete(row){ //later add a field to keep the link to the certificate and link it on the student's profile, or a way to verify the link
  return (!!(findValueOf(row, "certificate")) || false); //check that the link is the actual link (maybe just contains drive.google?)
}

function parseAvailability(row, day){
  const time = day.at(-1);
  if(time == 1){
    const availability = (findValueOf(row, "2:30-4:30") || "").toLowerCase();
    if(availability.includes(day.slice(0, -1))){
      return 1;
    }
    return 0;
  }
  if(time == 2){
    const availability = (findValueOf(row, "3:30- 5:30") || "").toLowerCase();
    if(availability.includes(day.slice(0, -1))){
      return 1;
    }
    return 0;
  }
}

export { UploadFile, UploadResponses, download };