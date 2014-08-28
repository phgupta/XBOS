#!/bin/bash

# This is the install script for OpenBAS

export DEBIAN_FRONTEND=noninteractive

function notify() {
msg=$1
length=$((${#msg}+4))
buf=$(printf "%-${length}s" "#")
echo ${buf// /#}
echo "# "$msg" #"
echo ${buf// /#}
sleep 2 ;}

# display on stderr
exec 1>&2

UNAME=$(uname)
if [ "$UNAME" != "Linux" ] ; then
    echo "Requires Ubuntu 14.04"
    exit 1
fi

ISUBUNTU=$(lsb_release -is)
UBUNTUVERSION=$(lsb_release -rs)
if [ "$ISUBUNTU" != "Ubuntu" -o "$UBUNTUVERSION" != "14.04" ] ; then
    echo "Requires Ubuntu 14.04"
    exit 1
fi

notify "Installing APT packages... (this will take a few minutes)"
sudo apt-get install -y expect python-pip mongodb npm libssl-dev git-core pkg-config build-essential nmap dhcpdump arp-scan 2>&1 > /dev/null

notify "Installing Meteor..."
curl https://install.meteor.com | sh
export PATH=~/.meteor/tools/latest/bin:$PATH
sudo npm install -g meteorite

notify "Fetching latest node..."
curl -sL https://deb.nodesource.com/setup | sudo bash -

sudo apt-get install -y nodejs nodejs-legacy 2>&1 > /dev/null

notify "Adding cal-sdb package repository..."
sudo add-apt-repository ppa:cal-sdb/smap

notify "Updating APT for latest packages..."
sudo apt-get update

notify "Installing sMAP and sMAP dependencies... (this will take a few minutes)"
sudo apt-get install -y python-smap readingdb 2>&1 > /dev/null
sudo pip install pymongo netifaces
sudo mkdir -p /var/run/smap
sudo mkdir /var/smap
sudo chown -R oski /var/smap
sudo chown -R smap /var/run/smap

notify "Downloading OpenBAS..."
curl -O http://install.openbas.cal-sdb.org/openbas.tgz
tar xzf openbas.tgz

cat <<EOF > openbas.conf
[program:openbas]
command = mrt --settings settings.json
user = oski
directory = /home/oski/openbas
priority = 2
autorestart = true
stdout_logfile = /var/log/openbas.stdout.log
stdout_logfile_maxbytes = 50MB
stdout_logfile_backups = 5
stderr_logfile = /var/log/openbas.stderr.log
stderr_logfile_maxbytes = 50MB
stderr_logfile_backups = 5
EOF

sudo mv openbas.conf /etc/supervisor/conf.d/openbas.conf

cat <<EOF > discovery.ini
[/]
uuid = 85d97cac-9345-11e3-898b-0001c009bf3f

[/discovery]
type = smap.services.discovery.DiscoveryDriver
dhcp_iface = eth1
supervisord_conf_file = supervisord.conf
dhcpdump_path = /usr/sbin/dhcpdump
nmap_path = /usr/bin/nmap
config_repo = .
scripts_path = /usr/local/lib/python2.7/dist-packages/smap/services/scripts
EOF

sudo mv discovery.ini /etc/smap/.

cat <<EOF > discovery.conf
[program:hue]
command = /usr/bin/twistd -n smap /etc/smap/discovery.ini
directory = /var/smap
environment=PYTHONPATH="/home/oski/smap"
priority = 2
autorestart = true
user = oski
stdout_logfile = /var/log/discovery.stdout.log
stderr_logfile = /var/log/discovery.stderr.log
stdout_logfile_maxbytes = 50MB
stdout_logfile_backups = 5
stderr_logfile_maxbytes = 50MB
stderr_logfile_backups = 5
EOF

sudo mv discovery.conf /etc/supervisor/conf.d/discovery.conf

sudo supervisorctl update

sudo npm install -g spin
sudo chown -R oski .npm
sudo chown -R oski tmp
sudo chown -R oski .meteor
sudo mkdir -p .meteorite
sudo chown -R oski .meteorite
sudo chown -R oski openbas