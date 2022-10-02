import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.css';

function ViewBookings() {
    function createHeading(heading){
        return(
            <div className='d-flex align-items-center'>
                <span style={{flex: 'auto'}}><hr/></span>
                <span className="text-align-center"><h4>{heading}</h4></span>
                <span style={{flex: 'auto'}}><hr/></span>
            </div>
        )
    }

    const [leavesInProgess, setLeavesInProgress] = useState([])
    const [upcomingLeaves, setUpcomingLeaves] = useState([])
    const [pastLeaves, setPastLeaves] = useState([])
    const [rejectedLeaves, setRejectedLeaves] = useState([])

    useEffect(() => {
        const getAllFromDb = async () => {
            await fetch('http://localhost:5000/api/leave/inprogress', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': localStorage.getItem('token')
                }
            }).then(res => res.json()).then(data => {
                setLeavesInProgress(data.leaveData)
            });


            await fetch('http://localhost:5000/api/leave/upcoming', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': localStorage.getItem('token')
                }
            }).then(res => res.json()).then(data => {
                  setUpcomingLeaves(data.leaveData)
            });


            await fetch('http://localhost:5000/api/leave/past', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': localStorage.getItem('token')
                }
            }).then(res => res.json()).then(data => {
                  setPastLeaves(data.leaveData)
            });


            await fetch('http://localhost:5000/api/leave/rejected', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': localStorage.getItem('token')
                }
            }).then(res => res.json()).then(data => {
                  setRejectedLeaves(data.leaveData)
            });
        }

        getAllFromDb();


    }, [])

    function showData(array,heading){
        if(array.length === 0){
            return <span>None</span>
        }else{
            const bg = whichHeading(heading)
            const rejected = heading === "rejected"
            return (array.map((element,index)=>{
                return (
                    <div key={index} className={`border border-3 border-secondary p-3 mt-2 ${bg}`}>
                        <h3 className='row p-1 text-decoration-underline'>{element[0]}</h3>
                        <h6 className='p-1 row'>Reason for leave: {element[1]}</h6>
                        {rejected?<h6 className='p-1 row'>Reason for rejection: {element[2]}</h6>:null}
                    </div>
                )
            }))
        }
    }

    function whichHeading(heading){
        if(heading==="inProgress"){
            return 'bg-warning'
        }else if(heading === "upcoming"){
            return 'bg-success'
        }else if(heading === "past"){
            return 'bg-light'
        }else if(heading === "rejected"){
            return 'bg-danger'
        }
    }
    return (
        <div>
            <h2 className="d-flex justify-content-center p-2">Annual Leave bookings</h2>
            {createHeading("In Progress Leaves")}
            {
                showData(leavesInProgess,"inProgress")
            }
            {createHeading("Upcoming Leaves")}
            {
                showData(upcomingLeaves,"upcoming")
            }
            {createHeading("Past Leaves")}
            {
                showData(pastLeaves,"past")
            }
            {createHeading("Rejected Leaves")}
            {
                showData(rejectedLeaves,"rejected")
            }
        </div>
    )
}

export default ViewBookings