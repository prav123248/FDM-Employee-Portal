import React, { useRef, useState } from "react";

import avatar from '../assets/avatar.png'
import { Button } from "primereact/button";
import { Toast } from 'primereact/toast';
import PropTypes from "prop-types";

function Login({ setToken, setLoggedIn }) {

  const toast = useRef(null)

  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState();
  const [pass, setPass] = useState();
  const [remember, setRemember] = useState(true);

  const loginUser = async (e) => {
    e.preventDefault();
    if (user === undefined || pass === undefined) {
      toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please fill in all fields' });
      return;
    }

    setLoading(true);

    //connect to mongodb and check if user exists
    // code found in /backend/api.js is running on the server below listening for requests constantly: 51.38.91.184:5000
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: user,
        password: pass,
        //remember isnt used yet
        remember: remember
      })
    });
    const body = await response.json();
    //if user exists, set loggedIn to true
    //if user does not exist, alert user
    if (body.accessToken) {
      setToken(body.accessToken);
      localStorage.setItem("user", body.username);
      localStorage.setItem("token", body.accessToken);
      setLoggedIn(null);
      window.location = '#/';
    } else {
      setLoading(false)
      toast.current.show({ severity: 'error', summary: 'Login Failed', detail: body.message });
    }
  }

  return (
    <div className="container1">
      <Toast ref={toast} />
      <form id="loginForm" onSubmit={(e)=>{loginUser(e)}}>
        <div className="avatarcontainer">
          <img src={avatar} className="avatarimage"/>
        </div>

        <label htmlFor="uname">
          <b>Username</b>
        </label>
        <input onChange={(e) =>setUser(e.target.value)} type="text" placeholder="Enter Username" name="uname" required/>

        <label htmlFor="psw">
          <b>Password</b>
        </label>
        <input onChange={(e) =>setPass(e.target.value)} type="password" placeholder="Enter Password" name="psw" required/>

        <Button className="p-button-success loginbutton" label="Login" loading={loading} onClick={loginUser} type="submit"/>

        <label>
          <input onChange={(e) =>setRemember(e.target.value)} type="checkbox" defaultChecked="checked"/> Remember me
        </label>
        <br/>
        <a href="#" style={{color: "white", textDecoration: "underline"}}>Forgot password?</a>
      </form>
    </div>
  )
}

Login.propTypes = {
  setToken: PropTypes.func.isRequired
}

export default Login