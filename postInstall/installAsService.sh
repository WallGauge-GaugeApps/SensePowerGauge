#!/bin/bash
# From DOS prompt type (git update-index --chmod=+x installAsService.sh) to make this file executable.
set -e
echo "NPM post install shell that installs this app as service starts now..."
echo "Set irdclient as defalut group for SensePowerGauge -> sudo chown :irdclient ../SensePowerGauge"
sudo chown :irdclient ../SensePowerGauge
echo "Give default group write access to the SensePowerGauge directory -> sudo chmod g+w ../SensePowerGauge"
sudo chmod g+w ../SensePowerGauge
echo "Install D-Bus config file for this service -> sudo cp ./postInstall/dbus.conf /etc/dbus-1/system.d/SensePowerGauge.conf"
sudo cp ./postInstall/dbus.conf /etc/dbus-1/system.d/SensePowerGauge.conf
echo "Install systemd service file -> sudo cp -n ./postInstall/server.service /etc/systemd/system/SensePowerGauge.service"
sudo cp -n ./postInstall/server.service /etc/systemd/system/SensePowerGauge.service
echo "Enable the servers to start on reboot -> systemctl enable SensePowerGauge.service"
sudo systemctl enable SensePowerGauge.service
echo "Start the service now -> systemctl start SensePowerGauge.service"
sudo systemctl start SensePowerGauge.service
echo "NPM Post install shell is complete."
#echo "To start this servers please reboot the server. After reboot Type -> journalctl -u SensePowerGauge -f <- to see status."