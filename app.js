const GaugeApp = require('./gaugeApp');
const KeyManger = require('cipher').keyManTags;
const SimpleComm = require('./cmdLineCom.js');

overrideLogging();

console.log('Starting simpleComm to enable interim communications with gdtMan for error reporting...')
const sComm = new SimpleComm('sensePowerGauge');

console.log('Establishing secure connection to Amazon Web Service Key Management...');
var keyMan = new KeyManger('encKeyID', '/opt/rGauge/certs/awsCredentials.json', __dirname + '/cmk.json');

setupKeyManEventConsumers();

function setupKeyManEventConsumers() {
    keyMan.on('Error', ((errTxt, err) => {
        console.log('Error setting up keyManager: ' + errTxt)
        if (err) {
            if (err.retryable == true) {
                console.log('We may be able to recover from this keyManager error.  Retrying in ' + err.retryDelay + ' seconds.');
                setTimeout(() => {
                    console.log('Retrying to setup keyManager object...');
                    keyMan = new KeyManger('encKeyID', '/opt/rGauge/certs/awsCredentials.json', __dirname + '/cmk.json');
                    setupKeyManEventConsumers();
                }, err.retryDelay * 1000);
            };
        };
        sComm.sendError('keyManger ' + errTxt);
    }));

    keyMan.on('keyIsReady', (keyObj) => {
        console.log('Encryption key decrypted and ready for use. Getting encrypted configuation data...');
        sComm.clearAllErrors();
        var keys = Object.keys(keyObj);
        startGaugeApp(keyObj[keys[0]]);
    });
};

function startGaugeApp(encKey){
    new GaugeApp(encKey);
}

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