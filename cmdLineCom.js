const cp = require('child_process');


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
    constructor() {
    };
    
    sendError(hostName, errText){
        cp.execSync('/usr/bin/gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method com.gdtMan.gaugeCom.Alert {\'"'+ hostName +' ' + errText +'":"1"\'}');
    };

    clearError(hostName, errText){
        cp.execSync('/usr/bin/gdbus call --system --dest com.gdtMan --object-path /com/gdtMan --method com.gdtMan.gaugeCom.Alert {\'"'+ hostName +' ' + errText +'":"0"\'}');
    }
};

module.exports = cmdLineCom;