import React, { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Table } from "react-bootstrap";

function Notifications({ update }) {

  const [notificationsList, setNotificationsList] = useState([]);

  const getNotifications = async () => {
    const response = await fetch("http://localhost:5000/api/notifications", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": localStorage.getItem("token")
      }
    });
    const data = await response.json();
    return data.notifications;
  };

  useEffect(() => {
    getNotifications().then(data => {
      if (data === null){
        setNotificationsList([])
      }else{
        setNotificationsList(data);
      }

    });
  }, []);

  const dismissNotify = async (notification) => {
    //remove notification from database
    const response = await fetch("http://localhost:5000/api/notifications/dismiss", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": localStorage.getItem("token")
      },
      body: JSON.stringify({
        notification: notificationsList[notification]
      })
    });
    const data = await response.json();
    if (data.status === "success") {
      //remove notification from state
      notificationsList.splice(notification, 1);
      setNotificationsList([...notificationsList]);
      update();
    }
  }

  const notifi = [];
  for (let i = 0; i < notificationsList.length; i++) {
    const notification = notificationsList[i]
    notifi.push(
      <tr className="ticket-container" key={"row"+i}>
        <td className="ticket-title" key={"td"+i}>
          <p key={"p"+i}>{notification}</p>
        </td>
        <td className="ticket-title" key={"td2"+i}>
          <Button icon="pi pi-times" className="p-button-rounded p-button-danger" onClick={() => dismissNotify(i)} key={"but"+i}/>
        </td>
      </tr>
    )
  }

  return (
    <div class="table-responsive">
      <header>
        <h1>Notifications</h1>
        <br/>
        <p class="text-center fs-4">
          Here you can view your notifications. These are reminders that have been sent to you either by your line manager or the system to notify you of recent events or things important to you!
          They can be dismissed by clicking on the X button.
        </p>

      </header>
      <table class="table table-striped table-bordered border-dark border border-3" id = "table-outer">
        <thead class= "table-dark">
          <tr>
            <th class = "fs-5">Notification</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {notifi}
        </tbody>
      </table>
    </div>

  )
}

export default Notifications