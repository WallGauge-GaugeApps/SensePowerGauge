#!/bin/bash
# From DOS prompt type (git update-index --chmod=+x installAsService.sh) to make this file executable.
set -e
echo "NPM post install shell that installs this app as service starts now..."
echo "Set irdclient as defalut group for SensePower -> sudo chown :irdclient ../SensePower"
sudo chown :irdclient ../SensePower
echo "Give default group write access to the SensePower directory -> sudo chmod g+w ../SensePower"
sudo chmod g+w ../SensePower
echo "Install D-Bus config file for this service -> sudo cp ./postInstall/dbus.conf /etc/dbus-1/system.d/SensePower.conf"
sudo cp ./postInstall/dbus.conf /etc/dbus-1/system.d/SensePower.conf
echo "Install systemd service file -> sudo cp -n ./postInstall/server.service /etc/systemd/system/SensePower.service"
sudo cp -n ./postInstall/server.service /etc/systemd/system/SensePower.service
echo "Enable the servers to start on reboot -> systemctl enable SensePower.service"
sudo systemctl enable SensePower.service
echo "Start the service now -> systemctl start SensePower.service"
sudo systemctl start SensePower.service
echo "NPM Post install shell is complete."
#echo "To start this servers please reboot the server. After reboot Type -> journalctl -u SensePower -f <- to see status."