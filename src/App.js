import logo from './logo.svg';
import './App.css';
import allTimeSlots from './timeSlots';
import Button from '@mui/material/Button';

function App() {

  return (
    <>

    <div className="App" >
      {allTimeSlots()}
    </div>
    </>
  );
}

export default App;
