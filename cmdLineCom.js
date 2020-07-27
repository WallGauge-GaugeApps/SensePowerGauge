const cp = require('child_process');
const logPrefix = 'cmdLineComm.js | ';

/**
 * The following will read the subscription status of the GDT
 * gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method org.freedesktop.DBus.Properties.GetAll com.gdtMan.gaugeCom
 * Returns:
 * ({'SubscriptionExpired': <false>},)
 * 
 * To send an error to gdtMan use the followng gdbus call
 * gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method com.gdtMan.gaugeCom.Alert {'"SensePowerGauge credentials not set":"1"'}
 * To clear the error make same call but with a 0
 * gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method com.gdtMan.gaugeCom.Alert {'"SensePowerGauge credentials not set":"0"'}
 */
// gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method org.freedesktop.DBus.Properties.GetAll com.gdtMan.gaugeCom
var errorList = [];
class cmdLineCom {
    constructor(hostName = 'sensePowerGauge') {
        this.hostName = hostName
    };

    sendError(errText) {
        cp.execSync('/usr/bin/gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method com.gdtMan.gaugeCom.Alert {\'"' + this.hostName + ' ' + errText + '":"1"\'}');
        logit('Added ' + errText + ' to list of errors sent to gdtMan.')
        errorList.push(errText);
        console.dir(errorList)
    };

    clearError(errText) {
        cp.execSync('/usr/bin/gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method com.gdtMan.gaugeCom.Alert {\'"' + this.hostName + ' ' + errText + '":"0"\'}');
        errorList = errorList.filter(val => {
            if (val == errText) {
                return false;
            } else {
                return true;
            }
        });
        logit('Removed ' + errText + ' from error list.')
        console.dir(errorList);
    };

    clearAllErrors() {
        errorList.forEach(val => {
            cp.execSync('/usr/bin/gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method com.gdtMan.gaugeCom.Alert {\'"' + this.hostName + ' ' + val + '":"0"\'}');
        });
        errorList = [];
    }
};

function logit(txt = '') {
    console.debug(logPrefix + txt);
};

module.exports = cmdLineCom;