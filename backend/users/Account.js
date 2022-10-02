class Account {
  constructor(uName, fName, lName, role, priority, mobile) {
    this.uName = uName;
    this.fName = fName;
    this.lName = lName;
    this.role = role;
    this.priority = priority;
    this.mobile = mobile;
  }

  getUName() {
    return this.uName;
  }

  setFName(value) {
    this.uName = value;
  }

  getFName() {
    return this.name;
  }

  getLName() {
    return this.lName;
  }

  getRole() {
    return this.role;
  }

  getPriority() {
    return this.priority;
  }

  getMobile() {
    return this.mobile;
  }

  setFName(fName) {
    this.fName = fName;
  }

  setLName(lName) {
    this.lName = lName;
  }

  setRole(role) {
    this.role = role;
  }

  setPriority(priority) {
    this.priority = priority;
  }

  setMobile(mobile) {
    this.mobile = mobile;
  }

  toString() {
    return `${this.fName} ${this.lName} ${this.role} ${this.priority} ${this.mobile}`;
  }

  getAge() {
    return this.age;
  }

  setFName(name) {
    this.name = name;
  }

  setAge(age) {
    this.age = age;
  }
}

module.exports = Account;