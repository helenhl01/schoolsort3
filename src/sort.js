import axios from 'axios';
import { addStudent } from './students.js';
import Button from '@mui/material/Button';

function Sort({studentList, setStudentList}) {

    const data = {
        studentList: studentList,
    };
    const handleSortClick =  () => {
        //setIsSorted(true); // Update state to indicate sorting is in progress (optional)
        axios.post("http://localhost:8000/sort", { studentList })
        .then(response => {
            console.log("Sort successful:", response.data); 
            //response.data.forEach(addStudent);
            setStudentList(response.data);
        })
        .catch(error => {
            console.error("Sort error:", error); 
        });
        /*finally {
          setIsSorted(false); // Reset sorting state (optional)
        }*/
    };

    return (
    <div>
        <Button variant="contained" component="label" color="primary" onClick={handleSortClick}> Sort
        </Button>
    </div>
    );
}

export { Sort };