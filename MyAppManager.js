const AppMan = require('app-manager');

class myAppManager extends AppMan {
    bleMyConfig() {
        console.log('Setting up Sene Power gauge specfic characteristics and config.');
        this.userID = 'notSet';
        var user = this.bPrl.Characteristic('b3001340-47e4-4ecd-8e4e-15edd5a89013', 'user', ["encrypt-read", "encrypt-write"]);
        user.on('WriteValue', (device, arg1) => {
            console.log(device + ', has set new user ID.');
            this.userID = arg1.toString('utf8');
            this.emit('userID', this.userID);
        });

        this.userPW = 'notSet';
        var userPW = this.bPrl.Characteristic('459e018b-5379-4799-88f3-e76b1b9e37a2', 'userPW', ["encrypt-read", "encrypt-write"]);
        userPW.on('WriteValue', (device, arg1) => {
            console.log(device + ', has set new user PW.');
            this.userPW = arg1.toString('utf8');
            this.emit('userPW', this.userPW);
        });
    };
};

module.exports = myAppManager;