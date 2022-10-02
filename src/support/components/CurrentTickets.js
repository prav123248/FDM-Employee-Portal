import React, { useEffect, useState } from "react";
import Table from 'react-bootstrap/Table';

function CurrentTickets() {

  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    getTicketsFromDb().then((body) => {
      if (body.tickets) {
        setTickets(body.tickets);
      }
    });
  }, []);

  //get tickets from /api/tickets/current
  const getTicketsFromDb = async () => {
    const response = await fetch("http://localhost:5000/api/tickets/current", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: localStorage.getItem("token"),
        type: "current",
      })
    });
    const body = await response.json();
    return body;
  };

  

  const htmlElements = [];

  if (tickets.length > 0){
    for (let i = 0; i < tickets.length; i++) {
      htmlElements.push(
        <tr className="ticket-container" key={i}>
          <td className="ticket-type">
            {tickets[i].type}
          </td>
          <td className="ticket-title">
            {tickets[i].subject}
          </td>
          <td className="contact-email">
            {tickets[i].contactEmail}
          </td>
          <td className="contact-number">
            {tickets[i].contactNumber}
          </td>
          <td className="contact-description">
            {tickets[i].description}
          </td>
          <td className="ticket-status">
            {tickets[i].status}
          </td>
          <td className="ticket-created">
            {tickets[i].createdAt.substring(0, 10)} {tickets[i].createdAt.substring(11, 16)}
          </td>
        </tr>
      );
    }
  } else {
    htmlElements.push(
      <div className="ticket-container" key={0}>
        <div className="ticket-title">
          <h3>No tickets found</h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <a href="#/support" className="btn border border-2 border-secondary m-3">{'<'} Back</a>
        <h3>Your Current Tickets!</h3><br></br>
      </div>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead class="thead-dark">
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Subject</th>
              <th scope="col">Contact Email</th>
              <th scope="col">Contact Number</th>
              <th scope="col">Description</th>
              <th scope="col">Status</th>
              <th scope="col">Created At</th>
            </tr>
          </thead>
          <tbody>
            {htmlElements}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default CurrentTickets;