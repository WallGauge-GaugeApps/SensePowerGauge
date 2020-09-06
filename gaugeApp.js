const SenseDataDelegate = require('senseDataGetter');
const MyAppMan = require('./MyAppManager.js');
const irTransmitter = require('irdtxclass');
const pwrDstrbtnGC = require('./secondaryGauges/pwrDistributionConfig.json');
const slrPwrGC = require('./secondaryGauges/solarPowerConfig.json');
const rnwblPrcntGC = require('./secondaryGauges/renewablePercent.json');

const reconnectInterval = 60;    // in minutes
const getTrendInterval = 10;     // in minutes
var inAlert = false;
var firstRun = true;
var solarPowered = null;
var minCount = 0;
var nextReconnectInterval = reconnectInterval;
var nextGetTrendInterval = getTrendInterval;
var mainPoller = null;
var randomStart = getRandomInt(5000, 60000);
var netWatts = [-99999];
var solarWatts = [];
var gridWatts = [];
var sense = {};
var myAppMan = {};
// var gaugePwrDstrbtn = {};
var gaugeSlrPwr = {};
var gaugeRnwblPrcnt = {};

class gaugeApp {
    /**
     * The gauge app connects a WallGauge to its data source.  
     * The data source is often an Internet API and is parsed and presented to the gauge app with a data delegate class. 
     * To enable encryption pass this class an encryption key as the encryptionKey parameter during class construction. 
     * This will start appManager with encryption enabled and store all user modified variables like user ID and Password in the modifiedConfig.encrypted file. 
     * @param {string} encryptionKey Defults to null for no encryption. 
     */
    constructor(encryptionKey = null) {
        if (encryptionKey == null) {
            myAppMan = new MyAppMan(__dirname + '/gaugeConfig.json', __dirname + '/modifiedConfig.json', false);
        } else {
            myAppMan = new MyAppMan(__dirname + '/gaugeConfig.json', __dirname + '/modifiedConfig.encrypted', true, encryptionKey);
        };
        console.log('Establishing connection for secondary gauges to irTransmitter...');
        // gaugePwrDstrbtn = new irTransmitter(pwrDstrbtnGC.gaugeIrAddress, pwrDstrbtnGC.calibrationTable);
        gaugeSlrPwr = new irTransmitter(slrPwrGC.gaugeIrAddress, slrPwrGC.calibrationTable);
        gaugeRnwblPrcnt = new irTransmitter(rnwblPrcntGC.gaugeIrAddress, rnwblPrcntGC.calibrationTable);

        myAppMan.on('Update', () => {
            console.log('New update event has fired.  Reloading gauge objects...');
            myAppMan.setGaugeStatus('Config updated received. Please wait, may take up to 5 minutes to reload gauge objects. ' + (new Date()).toLocaleTimeString() + ', ' + (new Date()).toLocaleDateString());
            clearInterval(mainPoller);
            console.log('Re-Init senseData with new config...');
            sense = new SenseDataDelegate(myAppMan.config.userID, myAppMan.config.userPW);
            setupSenseEvents();
        });

        myAppMan.on('userPW', () => {
            console.log('A new user PW event received.');
            if (myAppMan.userID != 'notSet' && myAppMan.userPW != 'notSet') {
                console.log('Received new user ID and Password. ');
                myAppMan.setGaugeStatus('Received new user ID and Password.');
                var objToSave = {
                    userID: myAppMan.userID,
                    userPW: myAppMan.userPW
                };
                myAppMan.saveItem(objToSave);
            } else {
                console.log('Login ID and Password must both be set.  Enter login ID first then password. Try agian in that order.');
                myAppMan.setGaugeStatus('Login ID and Password must both be set.  Enter login ID first then password. Try agian in that order.');
            };
            myAppMan.userID = 'notSet';
            myAppMan.userPW = 'notSet';
        });

        console.log('First data call will occur in ' + (randomStart / 1000).toFixed(2) + ' seconds.');
        console.log('When a Sense connection is established a poller will open and close a web socket every 1 minute, read trend data every ' + getTrendInterval + ' minutes, and re-authenticate every ' + reconnectInterval + ' minutes.');

        setTimeout(() => {
            sense = new SenseDataDelegate(myAppMan.config.userID, myAppMan.config.userPW)
            setupSenseEvents();
        }, randomStart);
    };
};

function startPoller() {
    console.log('Starting endless poller.');
    clearInterval(mainPoller);
    mainPoller = setInterval(() => {
        minCount++;
        if (nextGetTrendInterval == minCount) {
            nextGetTrendInterval += reconnectInterval;
            getTrend();
        } else if (nextReconnectInterval == minCount) {
            nextReconnectInterval += getTrendInterval;
            reconnectToSense();
        } else {
            sense.openWebSocket();
        }
    }, 60000);
};

function reconnectToSense() {
    console.log('-------- Reconnecting to sense.com ---------');
    sense.closeWebSoc();
    sense.authenticate();
    sense.openWebSocket();
};

function getTrend() {
    sense.getTrends('week')
        .then((data) => {
            solarPowered = data.solar_powered
            console.log('Update. This week ' + solarPowered + '% of the power was from renewable energy.');
        })
        .catch((err) => {
            console.error('Error trying to getTrends from sense.com', err)
        });
};

function setupSenseEvents() {
    sense.on('authenticated', () => {
        console.log('GDT Authenticated with sense!')
        startPoller();
        console.log('Getting trend data...');
        sense.getTrends('week')
            .then((data) => {
                solarPowered = data.solar_powered
                console.log('This week ' + solarPowered + '% of the power was from renewable energy.');
                if (firstRun) {
                    sense.openWebSocket();
                    firstRun = false;
                }
            })
            .catch((err) => {
                console.error('Error getTrends after authenticated', err);
            })
    });

    sense.on('notAuthenticated', () => {
        console.log('Please check your sense login ID and Password.');
        clearInterval(mainPoller);
        myAppMan.setGaugeStatus('Error not authenticated with Sense Home Monitor at ' + (new Date()).toLocaleTimeString() + ', ' + (new Date()).toLocaleDateString());
        if (inAlert == false) {
            myAppMan.sendAlert({ [myAppMan.config.descripition]: "1" });
            inAlert = true;
        };
    });

    sense.on('power', () => {
        console.log((new Date()).toLocaleTimeString() +
            ' | Home Load:' + sense.power.netWatts +
            ', Solar In: ' + sense.power.solarWatts +
            ', Always On: ' + sense.power.alwaysOn +
            ' | ' + solarPowered + '% of the this week\'s power was from renewable energy.'
        );

        if (netWatts.length < 4) {
            if (netWatts.length == 1 && netWatts[0] == -99999) {
                console.log('Reporting first run values...');
                netWatts = [];
                myAppMan.setGaugeValue(sense.power.netWatts, ' watts, ' +
                    sense.power.solarWatts + " solar, " +
                    sense.power.alwaysOn + " always on, " +
                    solarPowered + " solar%, " +
                    (new Date()).toLocaleTimeString()
                );
                myAppMan.setGaugeStatus('Okay, ' + (new Date()).toLocaleTimeString() + ', ' + (new Date()).toLocaleDateString());
                if (inAlert == true) {
                    myAppMan.sendAlert({ [myAppMan.config.descripition]: "0" });
                    inAlert = false;
                };
                gaugeRnwblPrcnt.sendValue(solarPowered);
                gaugeSlrPwr.sendValue(sense.power.solarWatts);
                // gaugePwrDstrbtn.sendValue(sense.power.gridWatts * -1);

            };
            netWatts.push(sense.power.netWatts);
            solarWatts.push(sense.power.solarWatts);
            gridWatts.push(sense.power.gridWatts);
        } else {
            var avgNetWatts = netWatts.reduce((p, c) => p + c, 0) / netWatts.length;
            var avgSolarWatts = solarWatts.reduce((p, c) => p + c, 0) / solarWatts.length;
            var avgGridWatts = gridWatts.reduce((p, c) => p + c, 0) / gridWatts.length;

            console.log((new Date()).toLocaleTimeString() +
                ' 5 Min Avg | Home Load:' + avgNetWatts +
                ', Solar In: ' + avgSolarWatts +
                ', Always On: ' + sense.power.alwaysOn  +
                ' | ' + solarPowered + '% of the this week\'s power was from renewable energy.'
            );

            myAppMan.setGaugeValue(avgNetWatts, ' watts, ' +
                avgSolarWatts + " solar, " +
                sense.power.alwaysOn + " always on, " +
                solarPowered + " solar%, " +
                (new Date()).toLocaleTimeString()
            );
            myAppMan.setGaugeStatus('Okay, ' + (new Date()).toLocaleTimeString() + ', ' + (new Date()).toLocaleDateString());
            if (inAlert == true) {
                myAppMan.sendAlert({ [myAppMan.config.descripition]: "0" });
                inAlert = false;
            };
            gaugeRnwblPrcnt.sendValue(solarPowered);
            gaugeSlrPwr.sendValue(avgSolarWatts);
            // gaugePwrDstrbtn.sendValue(avgGridWatts * -1);

            netWatts = [];
            solarWatts = [];
            gridWatts = [];
        };
        sense.closeWebSoc();
    });
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};


module.exports = gaugeApp;