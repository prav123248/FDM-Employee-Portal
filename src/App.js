import React, { useEffect, useRef, useState } from "react";

import "./App.css";
import "./login/login.css";
import "primereact/resources/themes/rhea/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import UploadDocument from "./profile/components/UploadDocument";
import Logo from "./Logo.png";


import { Sidebar } from "primereact/sidebar";
import { Menu } from "primereact/menu";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import { Toast } from "primereact/toast";

import SupportITForm from "./support/components/SupportITForm";
import SupportHRForm from "./support/components/SupportHRForm";
import CurrentTickets from "./support/components/CurrentTickets";
import TicketArchive from "./support/components/TicketArchive";
import Home from "./home/components/Home";
import Profile from "./profile/components/Profile";
import AnnualLeave from "./leave/components/AnnualLeave";
import Login from "./login/Login";
import Support from "./support/components/Support";
import { Button } from "primereact/button";
import AdminPanel from "./home/components/AdminPanel";
import useToken from "./login/useToken";
import { Image } from "react-bootstrap";
import Notifications from "./home/components/Notifications";

function App() {

  const [visibleCustomToolbar, setVisibleCustomToolbar] = useState(true);

  //login states
  const [loggedIn, setLoggedIn] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const { token, setToken } = useToken();

  const toast = useRef(null);

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

  const updateMenuNotify = () => {
    if (token) {
      getAccType().then(acc => {
        if (acc.status === "error") {
          return;
        }
        getNotifications().then(data => {
          if (data !== null) {
            setNotifications(data);
            if (acc.accountType === "admin") {
              setItems(adminMenuNotify);
            } else {
              setItems(defaultMenuNotify);
            }
          } else {
            if (acc.accountType === "admin") {
              setItems(adminMenu);
            } else {
              setItems(defaultMenu);
            }
          }
        });
      });
    }
  };

  useEffect(() => {
    //get notifications from database

    if (token) {
      updateMenuNotify();
    }
  }, [token]);

  const handleNotification = () => {
    updateMenuNotify();
    window.location = "#/notifications";
  };

  //sidebar states

  const adminMenu = [
    {
      label: <Image src={Logo} className="fdm-logo" alt="Logo" />
    },
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => {
        window.location = "#/";
      }
    },
    {
      label: "Notifications ~ No",
      icon: "pi pi-bell",
      className: "p-menuitem-active",
      command: () => {
        handleNotification();
      }
    },
    {
      label: "Annual Leave",
      icon: "pi pi-calendar",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/annualleave";
      }
    },
    {
      label: "Profile",
      icon: "pi pi-user",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/profile";
      }
    },
    {
      label: "Admin",
      icon: "pi pi-cog",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/admin";
      }
    },
    {
      label: "Support",
      icon: "pi pi-question-circle",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/support";
      }
    },
    {
      label: "Logout",
      icon: "pi pi-power-off",
      command: async () => {
        await toast.current.clear();
        toast.current.show({
          severity: "warn", closeable: true, sticky: true, content: (
            <div className="flex flex-column" style={{ flex: "1" }}>
              <div className="text-center">
                <i className="pi pi-exclamation-triangle" style={{ fontSize: "3rem" }}></i>
                <h4>You will be logged out</h4>
                <p>Are you sure?</p>
              </div>
              <div className="grid">
                <div className="col-6" style={{ marginLeft: "7rem" }}>
                  <Button onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setLoggedIn(null);
                    window.location = "#/";
                  }} type="button" label="Yes" className="p-button-raised p-button-success" />
                  <Button onClick={() => {
                    toast.current.clear();
                  }} type="button" label="No" className="p-button-raised p-button-danger" />
                </div>
              </div>
            </div>
          )
        });
      }
    }
  ];

  const adminMenuNotify = [
    {
      label: <Image src={Logo} className="fdm-logo" alt="Logo" />
    },
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => {
        window.location = "#/";
      }
    },
    {
      label: "Notifications ~ Yes",
      icon: "pi pi-bell",
      className: "p-menuitem-active",
      command: () => {
        handleNotification();
      }
    },
    {
      label: "Annual Leave",
      icon: "pi pi-calendar",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/annualleave";
      }
    },
    {
      label: "Profile",
      icon: "pi pi-user",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/profile";
      }
    },
    {
      label: "Admin",
      icon: "pi pi-cog",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/admin";
      }
    },
    {
      label: "Support",
      icon: "pi pi-question-circle",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/support";
      }
    },
    {
      label: "Logout",
      icon: "pi pi-power-off",
      command: async () => {
        await toast.current.clear();
        toast.current.show({
          severity: "warn", closeable: true, sticky: true, content: (
            <div className="flex flex-column" style={{ flex: "1" }}>
              <div className="text-center">
                <i className="pi pi-exclamation-triangle" style={{ fontSize: "3rem" }}></i>
                <h4>You will be logged out</h4>
                <p>Are you sure?</p>
              </div>
              <div className="grid">
                <div className="col-6" style={{ marginLeft: "7rem" }}>
                  <Button onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setLoggedIn(null);
                    window.location = "#/";
                  }} type="button" label="Yes" className="p-button-raised p-button-success" />
                  <Button onClick={() => {
                    toast.current.clear();
                  }} type="button" label="No" className="p-button-raised p-button-danger" />
                </div>
              </div>
            </div>
          )
        });
      }
    }
  ];

  const defaultMenu = [
    {
      label: <Image src={Logo} className="fdm-logo" alt="Logo" />
    },
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => {
        window.location = "#/";
      }
    },
    {
      label: "Notifications ~ No",
      icon: "pi pi-bell",
      className: "p-menuitem-active",
      command: () => {
        handleNotification();
      }
    },
    {
      label: "Annual Leave",
      icon: "pi pi-calendar",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/annualleave";
      }
    },
    {
      label: "Profile",
      icon: "pi pi-user",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/profile";
      }
    },
    {
      label: "Support",
      icon: "pi pi-question-circle",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/support";
      }
    },
    {
      label: "Logout",
      icon: "pi pi-power-off",
      command: async () => {
        await toast.current.clear();
        toast.current.show({
          severity: "warn", closeable: true, sticky: true, content: (
            <div className="flex flex-column" style={{ flex: "1" }}>
              <div className="text-center">
                <i className="pi pi-exclamation-triangle" style={{ fontSize: "3rem" }}></i>
                <h4>You will be logged out</h4>
                <p>Are you sure?</p>
              </div>
              <div className="grid">
                <div className="col-6" style={{ marginLeft: "7rem" }}>
                  <Button onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setLoggedIn(null);
                    window.location = "#/";
                  }} type="button" label="Yes" className="p-button-raised p-button-success" />
                  <Button onClick={() => {
                    toast.current.clear();
                  }} type="button" label="No" className="p-button-raised p-button-danger" />
                </div>
              </div>
            </div>
          )
        });
      }
    }
  ];

  const defaultMenuNotify = [
    {
      label: <Image src={Logo} className="fdm-logo" alt="Logo" />
    },
    {
      label: "Home",
      icon: "pi pi-home",
      command: () => {
        window.location = "#/";
      }
    },
    {
      label: "Notifications ~ Yes",
      icon: "pi pi-bell",
      className: "p-menuitem-active",
      command: () => {
        handleNotification();
      }
    },
    {
      label: "Annual Leave",
      icon: "pi pi-calendar",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/annualleave";
      }
    },
    {
      label: "Profile",
      icon: "pi pi-user",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/profile";
      }
    },
    {
      label: "Support",
      icon: "pi pi-question-circle",
      className: "p-menuitem-active",
      command: () => {
        window.location = "#/support";
      }
    },
    {
      label: "Logout",
      icon: "pi pi-power-off",
      command: async () => {
        await toast.current.clear();
        toast.current.show({
          severity: "warn", closeable: true, sticky: true, content: (
            <div className="flex flex-column" style={{ flex: "1" }}>
              <div className="text-center">
                <i className="pi pi-exclamation-triangle" style={{ fontSize: "3rem" }}></i>
                <h4>You will be logged out</h4>
                <p>Are you sure?</p>
              </div>
              <div className="grid">
                <div className="col-6" style={{ marginLeft: "7rem" }}>
                  <Button onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    setLoggedIn(null);
                    window.location = "#/";
                  }} type="button" label="Yes" className="p-button-raised p-button-success" />
                  <Button onClick={() => {
                    toast.current.clear();
                  }} type="button" label="No" className="p-button-raised p-button-danger" />
                </div>
              </div>
            </div>
          )
        });
      }
    }
  ];

  const [items, setItems] = useState(defaultMenu);

  if (loggedIn === null && token) {
    getAccType().then(res => {
      if (res.status === "error") {
        setLoggedIn(false);
      } else {
        setLoggedIn(true);
      }
    });
    return <div>
      loading...
    </div>;
  } else if (loggedIn === false || !token) {
    return (
      <Login setLoggedIn={setLoggedIn} setToken={setToken} />
    );
  } else {
    return (
      <Router>
        <div className="App">
          <Button icon="pi pi-arrow-right" onClick={() => setVisibleCustomToolbar(true)} className="mr-2"
                  label="Menu" />
          <Sidebar visible={visibleCustomToolbar} onHide={() => setVisibleCustomToolbar(false)}
                   style={{ padding: 0, width: "265px" }}>
            <Menu model={items}
                  style={{ width: "100%", height: "100%" }} />
          </Sidebar>
          <Toast ref={toast} />
          <div style={{ marginLeft: "175px", padding: "15px" }}>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/Profile" component={Profile} />
              <Route path="/annualleave" component={AnnualLeave} />
              <Route path="/UploadDocument" component={UploadDocument} />
              <Route path="/support" component={Support} />
              <Route path="/SupportITForm" component={SupportITForm} />
              <Route path="/SupportHRForm" component={SupportHRForm} />
              <Route path="/CurrentTickets" component={CurrentTickets} />
              <Route path="/TicketArchive" component={TicketArchive} />
              <Route path="/Notifications">
                <Notifications update={updateMenuNotify} />
              </Route>
              <Route path="/admin" component={AdminPanel} />
            </Switch>
          </div>
        </div>
      </Router>
    );
  }
}

export default App;