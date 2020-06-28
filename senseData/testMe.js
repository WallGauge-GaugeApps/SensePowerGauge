const sense = require('unofficial-sense');
var actObj = require('./creds.json');
var maxHomeLoad = 0
var sustainedCount = 0

sampleRecObj = {
    status: 'Received',
    data: {
        payload: {
            voltage: [123.35401916503906, 123.46904754638672],
            frame: 1957920,
            devices: [
                {
                    id: 'unknown',
                    name: 'Other',
                    icon: 'home',
                    tags: {
                        DefaultUserDeviceType: 'Unknown',
                        DeviceListAllowed: 'true',
                        TimelineAllowed: 'false',
                        UserDeviceType: 'Unknown',
                        UserDeviceTypeDisplayString: 'Unknown',
                        UserEditable: 'false',
                        UserMergeable: 'false'
                    },
                    attrs: [],
                    w: 4477.23486328125,
                    c: 53
                },
                {
                    id: 'solar',
                    name: 'Solar',
                    icon: 'solar_alt',
                    tags: {
                        DefaultUserDeviceType: 'Solar',
                        DeviceListAllowed: 'false',
                        TimelineAllowed: 'false',
                        UserDeviceType: 'Solar',
                        UserDeviceTypeDisplayString: 'Solar',
                        UserEditable: 'false',
                        UserMergeable: 'false'
                    },
                    attrs: [],
                    w: 4285.0859375,
                    c: 51
                }
            ],
            deltas: [],
            channels: [
                2457.990966796875,
                2019.243896484375,
                -2141.8623046875,
                -2143.223876953125
            ],
            hz: 60.00286102294922,
            w: 4477.23486328125,
            c: 53,
            solar_w: 4285.0859375,
            solar_c: 51,
            _stats: {
                brcv: 1592600061.348361,
                mrcv: 1592600061.371,
                msnd: 1592600061.371
            },
            d_w: 4477,
            d_solar_w: 4285,
            grid_w: 192,
            solar_pct: 95,
            epoch: 1592600060
        },
        type: 'realtime_update'
    }
}

sense(actObj)
    .then(senseObj => {
        console.log('We have a sense Object details follow:');
        console.dir(senseObj, { depth: null });
        console.log('\ngetDevices:');
        senseObj.getDevices()
            .then(deviceObj => {
                console.log('device Object follows:');
                console.dir(deviceObj, { depth: null });
                console.log('\ngetMonitorInfo:');
                return senseObj.getMonitorInfo()
            })
            .then(monObj => {
                console.log('Monitor Inforamtion follows:');
                console.dir(monObj, { depth: null });
                console.log('\ngetTimeline:');
                return senseObj.getTimeline()
            })
            .then(timeline => {
                console.log('Timeline Information follows:');
                console.dir(timeline, { depth: null });
                senseObj.events.on('data', (dataObj) => {
                    console.log('\nData:');
                    console.dir(dataObj, { depth: null });
                })
            })

    })
    .catch(err => {
        console.error('Error getting senseObj', err);
    });



function logPower() {
    sense({
        email: "JHRucker@outlook.com",
        password: "Dewviq-zivsaq-4tybxi",
        verbose: true //optional
    }, (dtaObj) => {
        // console.dir(dtaObj, { depth: null });
        if (dtaObj.status == 'Received' && 'type' in dtaObj.data) {
            if (dtaObj.data.type == 'realtime_update') {
                var solarPower = dtaObj.data.payload.d_solar_w;
                var houseLoad = dtaObj.data.payload.d_w;
                var solarPct = dtaObj.data.payload.solar_pct;
                var net = solarPower - houseLoad;

                if (houseLoad > maxHomeLoad) {
                    if (sustainedCount > 2) {
                        maxHomeLoad = houseLoad
                        sustainedCount = 0
                    } else {
                        sustainedCount += 1;
                    };
                } else {
                    sustainedCount = 0;
                }
                var time = new Date();
                console.log(time.toLocaleString() + ', Solar = ' + solarPower + ', Home load = ' + houseLoad + ', Solar percent = ' + solarPct + ', Net = ' + net + ', Max Home load = ' + maxHomeLoad);
            };
        };
    });
};


