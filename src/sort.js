import axios from 'axios';
import { addStudent } from './students.js';
import Button from '@mui/material/Button';
import {SCHOOLS, TIMES} from './configs.js';

function Sort({studentList}) {

    const data = {
        studentList: studentList,
    };
    const handleSortClick = async () => {
        //setIsSorted(true); // Update state to indicate sorting is in progress (optional)
        try {
          const response = await axios.post("http://localhost:8000/sort", { studentList });
          console.log("Sort successful:", response.data); // Handle successful response
        } catch (error) {
          console.error("Sort error:", error); // Handle errors
        } 
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