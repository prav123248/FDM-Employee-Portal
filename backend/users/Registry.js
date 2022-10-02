//singleton class that stores users
class Registry {
    constructor(){
        this.users = new Map();
    }

    static getInstance(){
        if(!Registry.instance){
            Registry.instance = new Registry();
        }
        return Registry.instance;
    }

    addUser(token, user){
        this.users.set(token, user);
        console.log(this.users);
    }
    getUser(token){
        if (this.users.has(token)){
            return this.users.get(token);
        }
        return null;
    }
    getUsers(){
        return this.users;
    }
    removeUser(token){
        this.users.delete(token);
    }
}

module.exports = Registry;