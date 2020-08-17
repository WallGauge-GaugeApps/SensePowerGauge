const AppMan = require('app-manager');

class myAppManager extends AppMan {
    bleMyConfig() {
        console.log('Setting up Sene Power gauge specfic characteristics and config.');
        this.userID = 'notSet';
        var user = this.bPrl.Characteristic('f973a8fe-239e-414d-960d-e8e503c8afb9', 'user', ["encrypt-read", "encrypt-write"]);
        user.on('WriteValue', (device, arg1) => {
            console.log(device + ', has set new user ID.');
            this.userID = arg1.toString('utf8');
            this.emit('userID', this.userID);
        });

        this.userPW = 'notSet';
        var userPW = this.bPrl.Characteristic('d8ffec2a-2fd6-475d-9075-6a9c6a958977', 'userPW', ["encrypt-read", "encrypt-write"]);
        userPW.on('WriteValue', (device, arg1) => {
            console.log(device + ', has set new user PW.');
            this.userPW = arg1.toString('utf8');
            this.emit('userPW', this.userPW);
        });
    };
};

module.exports = myAppManager;