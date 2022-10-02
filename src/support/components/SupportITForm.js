import React, { useState } from "react";
import { Form } from "react-bootstrap";
import "../styles/Form.css";

function SupportITForm() {

  const [subject, setSubject] = useState();
  const [firstName, setFirstName] = useState();
  const [email, setEmail] = useState();
  const [number, setNumber] = useState();
  const [enquiry, setEnquiry] = useState();

  const saveToDatabase = async (event) => {
    event.preventDefault();
    const response = await fetch("http://localhost:5000/api/ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        type: "IT",
        subject: subject,
        firstName: firstName,
        contactEmail: email,
        contactNumber: number,
        description: enquiry,
        token: localStorage.getItem("token")
      })
    });
    const body = await response.json();

    alert(body.message);
  };

  return (
    <>
      <a href="#/support" className="btn border border-2 border-secondary m-3">{'<'} Back</a>
      <h1>IT Support Form</h1>
      <form className="supportForm" onSubmit={saveToDatabase}>
        <div className="form-outline mb-4">
          <label className="form-label" for="Subject">Subject</label>
          <input onChange={(e) =>{setSubject(e.target.value)}} className="form-control" type="text" id="Subject" required></input>
        </div>

        <div className="form-outline mb-4">
          <label className="form-label" for="FirstName">First Name</label>
          <input onChange={(e) =>{setFirstName(e.target.value)}} className="form-control" type="text" id="FirstName" required></input>
        </div>

        <div className="form-outline mb-4">
          <label className="form-label" for="Email">Contact Email</label>
          <input onChange={(e) =>{setEmail(e.target.value)}} className="form-control" type="email" id="Email" required></input>
        </div>

        <div className="form-outline mb-4">
          <label className="form-label" for="Number">Contact Number</label>
          <input onChange={(e) =>{setNumber(e.target.value)}} className="form-control" type="tel" id="Number" required></input>
        </div>

        <div className="form-outline mb-4">
          <label className="form-label" for="Information">Enquiry Information</label>
          <textarea onChange={(e) =>{setEnquiry(e.target.value)}} className="form-control" type="text" id="Information" rows="4" required></textarea>
        </div>

        <button type="reset" className="btn btn-danger btn-block mb-4">Reset</button>
        <button type="submit" className="btn btn-success btn-block mb-4">Submit Form</button>

      </form>


    </>
  );
}

export default SupportITForm;