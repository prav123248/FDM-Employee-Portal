import React, { useEffect, useState } from "react";
import RequestLeave from "./RequestLeave";
import ViewRequests from "./ViewRequests";
import ViewBookings from "./ViewBookings";

function AnnualLeave() {
  const [remaining, setRemaining] = useState(28);
  const [requestLeave, setRequestLeave] = useState(false);
  const [viewBookings, setViewBookings] = useState(false);
  const [viewRequest, setViewRequest] = useState(false);
  const [manager, setManager] = useState(false);

  useEffect(() => {
    const getRemaining = async () => {
      await fetch("http://localhost:5000/api/leave/remaining", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": localStorage.getItem("token"),
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setRemaining(data.remaining);
        });
    }

    getRemaining();
  }, []);

  if (requestLeave) {
    return (
      <div>
        <button onClick={() => setRequestLeave(false)}> {"<"} Back</button>
        <RequestLeave remaining={remaining} />
      </div>
    );
  } else if (viewBookings) {
    return (
      <div>
        <button onClick={() => setViewBookings(false)}> {"<"} Back</button>
        <ViewBookings />
      </div>
    );
  } else if (viewRequest) {
    return (
      <div>
        <button onClick={() => setViewRequest(false)}> {"<"} Back</button>
        <ViewRequests />
      </div>
    );
  }

  const getAccType = async () => {
    const response = await fetch("http://localhost:5000/api/account-type", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": localStorage.getItem("token")
      }
    });
    const data = await response.json();
    return data;
  };

  getAccType().then(data => {
    if (data.accountType === "admin") {
      setManager(true);
    } else {
      setManager(false);
    }
  });

  return (
      <div className=' w-50 m-auto'>
        <h1 className='d-flex justify-content-center'>Annual Leave</h1>
        <div className="bg-white border border-4 border-secondary mt-5">
            <h3 className='m-4 d-flex justify-content-center'>Number of days remaining: {remaining}</h3>
            <div className=''>
                <span className='d-flex justify-content-center'><button type="button" className="btn btn-primary m-3 p-3" onClick={()=>setViewBookings(true)}>View annual leave bookings</button></span>
                <span className='d-flex justify-content-center'><button type="button" className="btn btn-primary m-3 p-3" onClick={()=>setRequestLeave(true)}>Request annual leave</button></span>
                {manager ? <span className='d-flex justify-content-center'><button type="button" className="btn btn-danger m-3 p-3" onClick={()=>setViewRequest(true)}>View annual leave request</button></span>:null}
            </div>
        </div>
      </div>
  );
}

export default AnnualLeave;