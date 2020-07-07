// const sunnyBoyWebBox = require('./dataGetter/sunnyboyWebBoxClass.js');
const SenseData = require('senseDataGetter');
const MyAppMan = require('./MyAppManager.js');
const tmpAct = require('./creds.json');

overrideLogging();

const myAppMan = new MyAppMan(__dirname + '/gaugeConfig.json', __dirname + '/modifiedConfig.json', false);
var inAlert = false;
var firstRun = true;
var minCount = 0;
const reconnectInterval = 60;    // in minutes  60
const getTrendInterval = 10;     // in minutes  10
var nextReconnectInterval = reconnectInterval;
var nextGetTrendInterval = getTrendInterval;
var mainPoller = null;

const getDataInterveral = 1;   // Time in minutes

console.log('__________________ App Config follows __________________');
console.dir(myAppMan.config, { depth: null });
console.log('________________________________________________________');
var sense = null
var sense = new SenseData(tmpAct.email, tmpAct.password)

myAppMan.on('Update', () => {
    console.log('New update event has fired.  Reloading gauge objects...');
    myAppMan.setGaugeStatus('Config updated received. Please wait, may take up to 5 minutes to reload gauge objects. ' + (new Date()).toLocaleTimeString() + ', ' + (new Date()).toLocaleDateString());
    // console.log('The webBoxIP = ' + myAppMan.config.webBoxIP);
    // solarData = new sunnyBoyWebBox(myAppMan.config.webBoxIP);
    getSolarData();
});

var randomStart = getRandomInt(5000, 60000);
console.log('First data call will occur in ' + (randomStart / 1000).toFixed(2) + ' seconds.');
console.log('When a Sense connection is established a poller will open and close a web socket every 1 minute, read trend data every ' + getTrendInterval + ' minutes, and re-authenticate every ' + reconnectInterval + ' minutes.');

function startPoller() {
    console.log('Starting endless poller.');
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

setTimeout(() => {
    sense = new SenseData(tmpAct.email, tmpAct.password);

    sense.on('authenticated', () => {
        console.log('GDT Authenticated with sense!')
        if (firstRun) startPoller();
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
        console.log('Please check your sense login ID and Password.')
        clearInterval(mainPoller);
        //Need to send an alert to gdtMan
    });

    sense.on('power', () => {
        console.log((new Date()).toLocaleTimeString() +
            ' | Home Load:' + sense.power.netWatts +
            ', Solar In: ' + sense.power.solarWatts +
            ', Grid In: ' + sense.power.gridWatts +
            ' | ' + solarPowered + '% of the this week\'s power was from renewable energy.');
        sense.closeWebSoc();
    });

}, randomStart);

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};

/** Overrides console.error, console.warn, and console.debug
 * By placing <#> in front of the log text it will allow us to filter them with systemd
 * For example to just see errors and warnings use journalctl with the -p4 option 
 */
function overrideLogging() {
    const orignalConErr = console.error;
    const orignalConWarn = console.warn;
    const orignalConDebug = console.debug;
    console.error = ((data = '', arg = '') => { orignalConErr('<3>' + data, arg) });
    console.warn = ((data = '', arg = '') => { orignalConWarn('<4>' + data, arg) });
    console.debug = ((data = '', arg = '') => { orignalConDebug('<7>' + data, arg) });
};



// var solarData = new sunnyBoyWebBox(myAppMan.config.webBoxIP);
// function getSolarData() {
//     solarData.updateValues(function (errNumber, errTxt, dtaObj) {
//         if (errNumber == 0) {
//             console.log('Currently generating ' + dtaObj.powerNow + " " + dtaObj.powerNowUnit);
//             //console.log("\tToday's total power = " + dtaObj.powerToday + " " + dtaObj.powerTodayUnit);
//             //console.log('\tTotal all time power generated = '+ dtaObj.powerToday + " " + dtaObj.powerTodayUnit);

//             myAppMan.setGaugeValue(dtaObj.powerNow, ' watts, ' +
//                 dtaObj.powerToday + " " + dtaObj.powerTodayUnit + ", " +
//                 (new Date()).toLocaleTimeString());

//             myAppMan.setGaugeStatus('Okay, ' + (new Date()).toLocaleTimeString() + ', ' + (new Date()).toLocaleDateString());
//             if (inAlert == true) {
//                 myAppMan.sendAlert({ [myAppMan.config.descripition]: "0" });
//                 inAlert = false;
//             };

//         } else {
//             console.log('Error getting data from Sunnyboy WebBox');
//             console.log(errTxt);
//             myAppMan.setGaugeStatus('Error getting data from SunnyBoy Webbox at ' + (new Date()).toLocaleTimeString() + ', ' + (new Date()).toLocaleDateString() + ' -> ' + errTxt);
//             if (inAlert == false) {
//                 myAppMan.sendAlert({ [myAppMan.config.descripition]: "1" });
//                 inAlert = true;
//             };
//         };
//     });
// };