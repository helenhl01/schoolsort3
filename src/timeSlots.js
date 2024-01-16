var SCHOOLS = [
    {
        name: 'Sunset Valley',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "M1",
    },{
        name: 'Rodriguez',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "M1",
    },{
        name: 'Hart',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "T1",
    },{
        name: 'Perez',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "W1",
    },{
        name: 'Padron',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "W1",
    },{
        name: 'Andrews',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "R1",
    },{
        name: 'Gallindo',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "R1",
    },{
        name: 'Blanton',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "R1",
    },{
        name: 'Boys and Girls Club',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "M2",
    },{
        name: 'NYOS M',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "T2",
    },{
        name:  'Martin',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "T2",
    },{
        name:  'Ponzu',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "W2",
    },{
        name:  'Kitty',
        students: 0, 
        rides: 0,
        studentList: [],
        capacity: 10,
        time: "R2",
    },
];

function schools(times){
    for(var time in times){ 
        for(var school in SCHOOLS){
             if(times[time].id === SCHOOLS[school].time){
                times[time].schools.push(SCHOOLS[school]);
            } 
        }
    }  
}

function renderSchools(schools){
    return schools.map((school) => (
        <div className="school">
            <p className="schoolNameText" >{school.name}</p>
        </ div>
    ));
}

function TimeSlot(time){
    if(time.orange){
      return (
        <div className="timeSlot orangeTimeSlot" key={time.id}>
        <h4 >{time.timeName}</h4>
        <>{renderSchools(time.schools)}</>
        </div>)
    }
    else{
      return (
        <div className="timeSlot" key={time.id}>
        <h4 >{time.timeName}</h4>
        <>{renderSchools(time.schools)}</>
        </div>)
    }
  }
  
  function allTimeSlots(){
    var TIMES = [ 
      {id: 'M1', timeName: 'Monday 2:30-4:30', orange: true, 
        schools: []},
      {id: 'T1', timeName: 'Tuesday 2:30-4:30', orange: false, 
        schools: []},
      {id: 'W1', timeName: 'Wednesday 2:30-4:30', orange: true, 
        schools: []},
      {id: 'R1', timeName: 'Thursday 2:30-4:30', orange: false, 
        schools: []},
      {id: 'M2', timeName: 'Monday 3:30-5:30', orange: false, 
        schools: []},
      {id: 'T2', timeName: 'Tuesday 3:30-5:30', orange: true, 
        schools: []},
      {id: 'W2', timeName: 'Wednesday 3:30-5:30', orange: false, 
        schools: []},
      {id: 'R2', timeName: 'Thursday 3:30-5:30', orange: true, 
        schools: []},
    ];
    schools(TIMES);
    //console.log(TIMES);
  
    return TIMES.map((time) => (
      <>{TimeSlot(time)}</>
    ));
  }

  export default allTimeSlots;