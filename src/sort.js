import axios from 'axios';
import Button from '@mui/material/Button';

function Sort({studentList, setStudentList}) {
    const data = {
        studentList: studentList,
    };
    const handleSortClick =  () => {
        axios.post("/api/sort", { studentList })
        .then(response => {
            console.log("Sort successful:", response.data); 
            setStudentList(response.data);
        })
        .catch(error => {
            console.error("Sort error:", error); 
        });
    };

    return (
        <Button variant="contained" component="label" color="primary" onClick={handleSortClick} title="assign unsorted students to schools"> Sort
        </Button>
    );
}

export { Sort };