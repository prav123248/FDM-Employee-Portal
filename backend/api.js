const Registry = require("./users/Registry");
const Account = require("./users/Account");

const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("./config/auth.config");
const mongo = require("./config/mongo.config");

const RolePrio = JSON.parse("{\"MANAGER\": 15, \"IT_SUPPORT\": 10, \"HR_STAFF\": 5, \"EMPLOYEE\": 0}");

function getPrefix(num) {
  if ((num > 3 && num < 21) | (num > 23 && num < 31)) {
    return num + "th";
  } else if (num === 21 | num === 1 | num === 31) {
    return num + "st";
  } else if (num === 22 | num === 2) {
    return num + "nd";
  } else {
    return num + "rd";
  }
}

function formatDate(date) {
  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return getPrefix(date.getDate()) + " " + month[date.getMonth()] + " " + date.getFullYear();
}

const testEndpoint = (app) => {
  app.post("/api/test", async (req, res) => {

    res.send({
      status: "success",
      message: "hi"
    });
  });
};

const blockUserEndpoint = (app) => {
  app.post("/api/blockUser", async (req, res) => {
    const { username } = req.body;
    //get access token from header
    const token = req.headers["x-access-token"];
    //validate token
    if (!Registry.getInstance().getUsers().has(token) || Registry.getInstance().getUser(token).getPriority() < RolePrio["IT_SUPPORT"]) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const result = await collection.updateOne({
        "loginInfo.username": username,
      }, {
        $set: {
          "loginInfo.blocked": "true",
        }
      });
      if (result.modifiedCount === 1) {
        return res.status(200).send({
          status: "success",
          message: "User blocked"
        });
      }else{
        return res.status(400).send({
          status: "error",
          message: "User not found"
        });
      }
    } catch (err) {
      console.log(err.stack);
    } finally {
      await client.close();
    }
  });
};

const setLeaveEndpoint = (app) => {
  app.post("/api/leave/request/decide", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    const { id, decision, reason } = req.body;
    //validate token
    if (!Registry.getInstance().getUsers().has(token) || Registry.getInstance().getUser(token).getPriority() < RolePrio["IT_SUPPORT"]) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("leave-requests");
      const result = await collection.updateOne({
        requestID: id
      }, {
        $set: {
          status: decision,
          rejectionReason: reason
        }
      });
      if (result.modifiedCount === 1) {
        if (decision === "REJECTED"){
          //update employees remaining leave days if denied
          const result2 = await collection.findOne({
            requestID: id
          });
          const coll2 = db.collection("users");
          const result3 = await coll2.updateOne({
            "loginInfo.username": result2.username
          }, {
            $inc: {
              "workInfo.leaveDaysLeft": result2.days
            }
          });
          if (result3.modifiedCount === 1) {
            console.log("remaining days updated");
            return res.send({
              status: "success",
              message: "Leave request updated"
            });
          } else {
            console.log("remaining days not updated");
            return res.send({
              status: "error",
              message: "Leave request updated but remaining days not updated"
            });
          }
        }
        res.send({
          status: "success",
          message: "Leave request updated"
        });

      } else {
        res.send({
          status: "error",
          message: "Request could not be removed"
        });
      }
    } catch (err) {
      res.send({
        status: "error",
        message: err
      });
    } finally {
      await client.close();
    }
  });
};

const inProgressLeavesEndpoint = (app) => {
  app.get("/api/leave/inprogress", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }
    //get user from token
    const user = Registry.getInstance().getUsers().get(token);

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("leave-requests");
      const result = await collection.find({
        "username": user.getUName(),
        "status": "ACCEPTED"
      }).toArray();
      //prevent concurrent edits while iterating
      const filtered = result.filter(function(leave) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const isInProgress = (start.getTime() <= Date.now() && end.getTime() >= Date.now());
        return isInProgress;
      });
      //construct new array with only in progress leaves formatted for frontend
      let leaveData = [];
      for (let i = 0; i < filtered.length; i++) {
        const current = filtered[i];
        leaveData.push([formatDate(new Date(current.startDate)) + " - " + formatDate(new Date(current.endDate)), current.reason]);
      }
      res.send({
        status: "success",
        leaveData
      });
    } catch (err) {
      res.send({
        status: "error",
        message: err
      });
    } finally {
      await client.close();
    }
  });
};

const upcomingLeavesEndpoint = (app) => {
  app.get("/api/leave/upcoming", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }
    //get user from token
    const user = Registry.getInstance().getUsers().get(token);

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("leave-requests");
      const result = await collection.find({
        "username": user.getUName(),
        "status": "ACCEPTED"
      }).toArray();
      //prevent concurrent edits while iterating
      const filtered = result.filter(function(leave) {
        const start = new Date(leave.startDate);
        const isInFuture = (start.getTime() > Date.now());
        return isInFuture;
      });
      //construct new array with only future leaves formatted for frontend
      let leaveData = [];
      for (let i = 0; i < filtered.length; i++) {
        const current = filtered[i];
        leaveData.push([formatDate(new Date(current.startDate)) + " - " + formatDate(new Date(current.endDate)), current.reason]);
      }
      console.log(leaveData);
      res.send({
        status: "success",
        leaveData
      });
    } catch (err) {
      res.send({
        status: "error",
        message: err
      });
    } finally {
      await client.close();
    }
  });
};

const pastLeavesEndpoint = (app) => {
  app.get("/api/leave/past", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }
    //get user from token
    const user = Registry.getInstance().getUsers().get(token);

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("leave-requests");
      const result = await collection.find({
        "username": user.getUName(),
        "status": "ACCEPTED"
      }).toArray();
      //prevent concurrent edits while iterating
      const filtered = result.filter(function(leave) {
        const end = new Date(leave.endDate);
        const isInPast = (end.getTime() < Date.now());
        return isInPast;
      });
      //construct new array with only past leaves formatted for frontend
      let leaveData = [];
      for (let i = 0; i < filtered.length; i++) {
        const current = filtered[i];
        leaveData.push([formatDate(new Date(current.startDate)) + " - " + formatDate(new Date(current.endDate)), current.reason]);
      }
      res.send({
        status: "success",
        leaveData
      });
    } catch (err) {
      res.send({
        status: "error",
        message: err
      });
    } finally {
      await client.close();
    }
  });
};

const rejectedLeavesEndpoint = (app) => {
  app.get("/api/leave/rejected", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }
    //get user from token
    const user = Registry.getInstance().getUsers().get(token);

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("leave-requests");
      const result = await collection.find({
        "username": user.getUName(),
        "status": "REJECTED"
      }).toArray();
      //construct new array with only rejected leaves formatted for frontend
      let leaveData = [];
      for (let i = 0; i < result.length; i++) {
        const current = result[i];
        leaveData.push([formatDate(new Date(current.startDate)) + " - " + formatDate(new Date(current.endDate)), current.reason, current.rejectionReason]);
      }
      res.send({
        status: "success",
        leaveData
      });
    } catch (err) {
      res.send({
        status: "error",
        message: err
      });
    } finally {
      await client.close();
    }
  });
};

const requestedLeavesEndpoint = (app) => {
  app.get("/api/leave/requests", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }
    //get user from token
    const user = Registry.getInstance().getUsers().get(token);

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("leave-requests");
      const result = await collection.find({
        "status": "PENDING"
      }).toArray();
      //construct new array with only rejected leaves formatted for frontend
      let leaveData = [];
      for (let i = 0; i < result.length; i++) {
        const current = result[i];
        const coll2 = db.collection("users");
        const result2 = await coll2.findOne({
          "loginInfo.username": current.username
        });
        const fullName = result2.personalInfo.firstName + " " + result2.personalInfo.lastName;
        leaveData.push([formatDate(new Date(current.startDate)) + " - " + formatDate(new Date(current.endDate)), fullName, current.reason, current.requestID]);
      }
      res.send({
        status: "success",
        leaveData
      });
    } catch (err) {
      res.send({
        status: "error",
        message: err
      });
    } finally {
      await client.close();
    }
  });
};

const leaveRequestEndpoint = (app) => {
  app.post("/api/leave/request/save", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    console.log(req.body);
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }
    //get user from token
    const user = Registry.getInstance().getUsers().get(token);

    //save request to database
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("leave-requests");
      const uuid = crypto.randomUUID();
      const result = await collection.insertOne({
        requestID: uuid,
        username: user.getUName(),
        startDate: req.body.leaveData.startDate,
        endDate: req.body.leaveData.endDate,
        days: req.body.leaveData.days,
        reason: req.body.leaveData.reason,
        status: "PENDING"
      });
      if (result.acknowledged === true) {
        //update employees remaining leave days
        const result2 = await collection.findOne({
          requestID: uuid
        });
        const coll2 = db.collection("users");
        const result3 = await coll2.updateOne({
          "loginInfo.username": result2.username
        }, {
          $inc: {
            "workInfo.leaveDaysLeft": -(result2.days)
          }
        });
        if (result3.modifiedCount === 1) {
          res.send({
            status: "success",
            message: "Leave request saved successfully"
          });
        } else {
          res.send({
            status: "error",
            message: "Error updating user"
          });
        }
      } else {
        res.send({
          status: "error",
          message: "Failed to save leave request"
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        status: "error",
        message: "Internal Server Error"
      });
    } finally {
      await client.close();
    }

  });
};

const removeNotificationEndpoint = (app) => {
  app.post("/api/notifications/dismiss", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    const notification = req.body.notification;
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const user = await collection.findOne({
        "loginInfo.username": Registry.getInstance().getUsers().get(token).getUName()
      });

      if (user.notifications.includes(notification)) {
        const newNotifications = user.notifications;
        newNotifications.splice(newNotifications.indexOf(notification), 1);
        const result = await collection.updateOne({
          "loginInfo.username": Registry.getInstance().getUser(token).getUName()
        }, {
          $set: {
            notifications: newNotifications
          }
        });
        if (result.modifiedCount === 1) {
          res.send({
            status: "success",
            message: "notification dismissed"
          });
        } else {
          res.send({
            status: "error",
            message: "notification not dismissed"
          });
        }
      } else {
        res.send({
          status: "error",
          message: "user has no notification like that"
        });
      }

    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const accTypeEndpoint = (app) => {
  app.get("/api/account-type", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];

    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const user = await collection.findOne({
        "loginInfo.username": Registry.getInstance().getUsers().get(token).getUName()
      });

      if (user.workInfo.role === "EMPLOYEE") {
        res.send({
          accountType: null
        });
      } else {
        res.send({
          accountType: "admin"
        });
      }

    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const notificationEndpoint = (app) => {
  app.get("/api/notifications", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];

    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const user = await collection.findOne({
        "loginInfo.username": Registry.getInstance().getUsers().get(token).getUName()
      });

      if (user.notifications.length > 0) {
        res.send({
          status: "success",
          notifications: user.notifications
        });
      } else {
        res.send({
          status: "error",
          message: "user has no notifications",
          notifications: null
        });
      }

    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const getRemainingLeaveEndpoint = (app) => {
  //get access token from header
  app.get("/api/leave/remaining", async (req, res) => {
    const token = req.headers["x-access-token"];

    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const user = await collection.findOne({
        "loginInfo.username": Registry.getInstance().getUsers().get(token).getUName()
      });

      res.send({
        status: "success",
        remaining: user.workInfo.leaveDaysLeft
      });
    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const sendNotificationEndpoint = (app) => {
  app.post("/api/notification/send", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];
    const { username, message } = req.body;
    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const result = await collection.updateOne({
        "loginInfo.username": username
      }, {
        $push: {
          notifications: message
        }
      });

      if (result.modifiedCount === 1) {
        res.send({
          status: "success",
          message: "notification sent"
        });
      } else {
        res.send({
          status: "error",
          message: "notification not sent"
        });
      }
    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const currentTicketsEndpoint = (app) => {
  app.post("/api/tickets/current", async (req, res) => {
    const { token, type } = req.body;

    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("tickets");
      let tickets;
      if (type === "current") {
        tickets = await collection.find({
          user: Registry.getInstance().getUser(token).getUName(),
          status: { $ne: "archived" }
        }).toArray();
      } else {
        tickets = await collection.find({
          user: Registry.getInstance().getUser(token).getUName(),
          status: "archived"
        }).toArray();
      }

      if (tickets) {
        res.send({
          status: "success",
          tickets: tickets
        });
      } else {
        res.send({
          status: "error",
          message: "No tickets found",
          tickets: null
        });
      }

    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const editProfileEndpoint = (app) => {
  app.post("/api/profile/save", async (req, res) => {
    const { token, profile } = req.body;

    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const user = Registry.getInstance().getUser(token);
      const result = await collection.updateOne({
        "loginInfo.username": user.getUName()
      }, {
        $set: {
          personalInfo: profile
        }
      });

      if (result.modifiedCount === 1) {
        res.send({
          status: "success",
          message: "Profile saved"
        });
      } else {
        res.send({
          status: "error",
          message: "Profile not saved"
        });
      }

    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const editableEndpoint = (app) => {
  app.get("/api/profile/editableFields", async (req, res) => {
    //get access token from header
    const token = req.headers["x-access-token"];

    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("modify-profile");
      const rolePrio = Registry.getInstance().getUser(token).getPriority();
      const editableFields = await collection.findOne({
        "priority.min": { $lte: rolePrio },
        "priority.max": { $gte: rolePrio }
      });

      if (editableFields) {
        res.send({
          status: "success",
          fields: editableFields
        });
      } else {
        res.send({
          status: "error",
          message: "No fields found for user",
          fields: null
        });
      }

    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const profileEndpoint = (app) => {
  app.get("/api/profile", async (req, res) => {
    //get x_access_token from header
    const token = req.headers["x-access-token"];

    //validate token
    if (!Registry.getInstance().getUsers().has(token)) {
      return res.status(401).send({
        status: "error",
        message: "Not Authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const user = await collection.findOne({
        "loginInfo.username": Registry.getInstance().getUser(token).getUName()
      });

      if (user) {
        res.send({
          status: "success",
          profile: user.personalInfo
        });
      } else {
        res.send({
          status: "error",
          message: "No user found",
          user: null
        });
      }

    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  });
};

const ticketEndpoint = (app) => {
  app.post("/api/ticket", async (req, res) => {
    const { type, subject, firstName, contactEmail, contactNumber, description, token } = req.body;

    if (!Registry.getInstance().getUsers().has(token)) {
      res.status(401).send({
        status: "fail",
        message: "Not authorized"
      });
      return;
    }

    const ticket = {
      user: Registry.getInstance().getUser(token).getUName(),
      type,
      subject,
      firstName,
      contactEmail,
      contactNumber,
      description,
      status: "open",
      createdAt: new Date()
    };

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("tickets");
      await collection.insertOne(ticket);
      res.send({
        status: "success",
        message: "Ticket created successfully"
      });
    } catch (err) {
      res.send({
        status: "error",
        message: err.message
      });
    } finally {
      await client.close();
    }
  });
};

const signupEndpoint = (app) => {
  app.post("/api/signup", async (req, res) => {
    const { username, password, email, firstName, lastName, mobile, role, token } = req.body;
    //convert role string to RolePrio enum
    const priority = RolePrio[role];

    if (!Registry.getInstance().getUsers().has(token) || Registry.getInstance().getUser(token).getPriority < RolePrio["IT_SUPPORT"]) {
      res.status(401).send({
        status: "fail",
        message: "Not authorized"
      });
      return;
    }

    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db(mongo.dbName);
      const collection = db.collection("users");
      const alreadyExists = await collection.findOne({
        "loginInfo.username": username
      });
      if (alreadyExists) {
        res.send({
          status: "error",
          message: "Username already exists"
        });
        return;
      }
      const hash = crypto.createHash('sha256').update(password).digest('base64');
      const doc = {
        loginInfo: {
          username: username,
          password: hash,
          blocked: "false"
        },
        workInfo: {
          role: role,
          priority: priority,
          leaveDaysLeft: 30
        },
        personalInfo: {
          firstName: firstName,
          middleName: "",
          lastName: lastName,
          birthDate: "",
          gender: "",
          marital: "",
          landline: "",
          mobile: mobile,
          email: email,
          address1: "",
          address2: "",
          address3: "",
          city: "",
          postcode: "",
          qualificationTitle: "",
          universityName: "",
          graduationDate: "",
          eFirstName1: "",
          eLastName1: "",
          eMobile1: "",
          eFirstName2: "",
          eLastName2: "",
          eMobile2: ""
        },
        notifications: []
      };
      const result = await collection.insertOne(doc);

      if (result.acknowledged) {
        res.send({
          status: "success",
          message: "User created successfully"
        });
      } else {
        res.send({
          status: "error",
          message: "User creation failed"
        });
      }
    } catch (err) {
      res.send({
        status: "error",
        message: err.message
      });
    } finally {
      await client.close();
    }
  });
};

const loginEndpoint = (app) => {
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const client = new MongoClient(mongo.url);
    try {
      await client.connect();
      const db = client.db("employee-portal");
      const collection = db.collection("users");
      const user = await collection.findOne({ "loginInfo.username": username });
      const hash = crypto.createHash('sha256').update(password).digest('base64');

      if (user && user.loginInfo.password === hash && user.loginInfo.blocked === "false") {
        var token = jwt.sign({
          username: user.loginInfo.username
        }, config.secret, {
          expiresIn: "24h"
        });


        Registry.getInstance().addUser(token, new Account(
          user.loginInfo.username,
          user.personalInfo.firstName,
          user.personalInfo.lastName,
          user.workInfo.role,
          user.workInfo.priority,
          user.personalInfo.mobile
        ));

        res.send({
          username: user.loginInfo.username,
          email: user.loginInfo.email,
          accessToken: token
        });
      } else {
        res.send({
          message: "Invalid Username or Password",
          accessToken: null
        });
      }
    } catch (err) {
      res.send({
        status: "error",
        message: err.message
      });
    } finally {
      await client.close();
    }
  });
};

async function run() {
  const express = require("express");
  const app = express();
  const cors = require("cors");
  app.use(express.json());
  app.use(cors());
  app.get("/", (req, res) => {
    //for testing
    res.send("Hello World!");
  });

  //init endpoints

  loginEndpoint(app);
  testEndpoint(app);
  signupEndpoint(app);
  ticketEndpoint(app);
  currentTicketsEndpoint(app);
  profileEndpoint(app);
  editableEndpoint(app);
  editProfileEndpoint(app);
  notificationEndpoint(app);
  accTypeEndpoint(app);
  removeNotificationEndpoint(app);
  leaveRequestEndpoint(app);
  inProgressLeavesEndpoint(app);
  upcomingLeavesEndpoint(app);
  pastLeavesEndpoint(app);
  rejectedLeavesEndpoint(app);
  requestedLeavesEndpoint(app);
  setLeaveEndpoint(app);
  getRemainingLeaveEndpoint(app);
  sendNotificationEndpoint(app);
  blockUserEndpoint(app);

  app.listen(5000);
}

run().catch(console.dir);
