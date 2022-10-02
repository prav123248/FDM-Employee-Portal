import React, { useState  } from 'react';
import { DateRangePicker } from 'react-dates';
import 'react-dates/initialize';
import { Dropdown,DropdownButton } from 'react-bootstrap';
import 'react-dates/lib/css/_datepicker.css';

function RequestLeave({remaining}) {
    const [dateSpan, setDateSpan] = useState({
    startDate: null,
    endDate: null
    });
    const [reason,setReason] = useState("None")
    const [focus, setFocus] = useState(null);
    const [exceededRem, setExceededRem] = useState(false)
    const { startDate, endDate } = dateSpan;
    const [blank,setBlank] = useState(false)
    const [submitted,setSubmitted] = useState(false)
    const [leaveData,setLeaveData] = useState({
        startDate: null,
        endDate: null,
        days: null,
        reason: null,
    })
    const handleChangeDate = (startDate, endDate) =>
    setDateSpan(startDate, endDate);

    const saveLeaveToDb = async (leaveData) => {
        const response = await fetch('http://localhost:5000/api/leave/request/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': localStorage.getItem('token')
            },
            body: JSON.stringify({
                leaveData,
            })
        })
        const body = await response.json();
        return body;
    }

    function increaseDay(date,increment) {
        return new Date(new Date(date).getTime() +(increment *86400000));
    }
    function getWeekDays(startDate, finalDate) {
        let numDays = 0;
        const currentDate= new Date(startDate.getTime());
        while (currentDate <= finalDate) {
            const day = currentDate.getDay();
            if(day !== 0 && day !== 6) {
                numDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return numDays
    }
    function submission(){
        if (startDate !=null && endDate !=null){
            setBlank(false)
            const newStartDate= new Date(startDate);
            const actualEndDate = new Date(endDate)
            const newEndDate= increaseDay(endDate,1)
            var weekdays = getWeekDays(newStartDate,newEndDate)
            if(weekdays > remaining){
                setExceededRem(true)
            }else{
                setExceededRem(false)
                const leaveData = {
                    startDate: newStartDate,
                    endDate: actualEndDate,
                    days: weekdays,
                    reason: reason,
                }
                saveLeaveToDb(leaveData).then(res => {
                    if (res.status === "success") {
                        setLeaveData(leaveData);
                        setSubmitted(true)
                    } else {
                        console.log("failed saving to db")
                    }
                })
            }
        }else{
            setBlank(true)
            setExceededRem(false)
        }
    }
    function errorMsg(msg){
        return <div class='d-flex justify-content-center mt-3 bg-danger w-50 m-auto p-2 border border-3 border-secondary bg-gradient'>{msg}</div>
    }

    function getPrefix(num){
        if((num >3 && num <21) | (num >23 && num<31)){
            return num +"th"
        }else if(num === 21 | num === 1 | num ===31){
            return num +"st"
        }else if(num===22 | num===2){
            return num+"nd"
        }else{
            return num+"rd"
        }
    }

    function formatDate(date){
        const month = ["January","February","March","April","May","June","July","August","September","October","November","December"]
        return getPrefix(date.getDate())+" "+month[date.getMonth()]+" "+date.getFullYear()
    }

    if(submitted){
        return(
            <div className="p-3 bg-white border border-4 border-secondary w-50 m-auto">
                <h2 className='d-flex justify-content-center'>Thank you for your request</h2>
                <h4>It will be reviewed soon to be accepted or rejected</h4>
                <h3 className='mt-5 d-flex justify-content-center'>Here are the details</h3>
                <h4>Start date: {formatDate(leaveData.startDate)}</h4>
                <h4>End date: {formatDate(leaveData.endDate)}</h4>
                <h4>Number of days (weekdays): {leaveData.days}</h4>
                <h4>Reason: {leaveData.reason}</h4>
            </div>
        )
    }
    
    return (
        <div>
            <h1 className='d-flex justify-content-center p-3'>Request annual leave</h1>
        <div className="p-3 bg-white border border-4 border-secondary w-50 m-auto">
            <h4 className='d-flex justify-content-center'>Number of days remaining: {remaining}</h4>
        <div className='d-flex justify-content-center'>
        <DateRangePicker
            startDatePlaceholderText="Start"
            startDate={startDate}
            startDateId="StartDate"
            endDatePlaceholderText="End"
            endDate={endDate}
            endDateId="EndDate"
            onDatesChange={handleChangeDate}
            numberOfMonths={1}
            displayFormat="MMM D"
            showClearDates={true}
            focusedInput={focus}
            onFocusChange={focus => setFocus(focus)}
            />
    </div>
    <div className='d-flex justify-content-center mt-5'>
        <DropdownButton
            key={'dropdown'}
            size="sm"
            variant="secondary"
            title="Reason (Optional)"
            onSelect={setReason}
        >
            <Dropdown.Item eventKey="Holiday">Holiday</Dropdown.Item>
            <Dropdown.Item eventKey="Family">Family affairs</Dropdown.Item>
            <Dropdown.Item eventKey="Break">Need a break</Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item eventKey="None">Prefer not to say</Dropdown.Item>
            <Dropdown.Item eventKey="Other">Other</Dropdown.Item>
        </DropdownButton>
    </div>
    <div className='d-flex justify-content-center mt-3'>
        <button  onClick={submission}>Submit</button>
    </div>
        {exceededRem ? errorMsg("Error exceeded remaining days"):null}
        {blank ? errorMsg("Error start date or end date blank"):null}
    </div>
    </div>
    );
}

export default RequestLeave;