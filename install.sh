#!/bin/bash
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

install_path=/www/server/panel/plugin/btp_frps

Install()
{
	echo 'success'
}

Uninstall()
{
	if [ -f /etc/systemd/system/btp_frps.service ];then
		systemctl stop btp_frps
		systemctl disable btp_frps
		rm -rf /etc/systemd/system/btp_frps.service
	fi
	rm -rf $install_path
	echo 'success'
}

if [ "${1}" == 'install' ];then
	Install
elif [ "${1}" == 'uninstall' ];then
	Uninstall
else
	echo 'error';
fi
