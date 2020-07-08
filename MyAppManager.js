const AppMan = require('app-manager');

class myAppManager extends AppMan {
    bleMyConfig() {
        console.log('Setting up Sene Power gauge specfic characteristics and config.');
        this.senseUserID = 'notSet';
        var senseUser = this.bPrl.Characteristic('b3001340-47e4-4ecd-8e4e-15edd5a89013', 'senseUser', ["encrypt-read", "encrypt-write"]);
        senseUser.on('WriteValue', (device, arg1) => {
            console.log(device + ', has set new sense user ID.');
            this.senseUserID = arg1.toString('utf8');
            this.emit('senseUserID', this.senseUserID);
        });

        this.senseUserPW = 'notSet';
        var sensePW = this.bPrl.Characteristic('459e018b-5379-4799-88f3-e76b1b9e37a2', 'sensePW', ["encrypt-read", "encrypt-write"]);
        sensePW.on('WriteValue', (device, arg1) => {
            console.log(device + ', has set new sense user PW.');
            this.senseUserPW = arg1.toString('utf8');
            this.emit('senseUserPW', this.senseUserPW);
        });
    };
};

module.exports = myAppManager;