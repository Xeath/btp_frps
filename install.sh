#!/bin/bash
PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin:/usr/local/sbin:~/bin
export PATH

install_path=/www/server/panel/plugin/btp_frps

Install()
{
	echo 'success'
}

Download()
{
	if [ "${1}" == '' ];then
		echo 'error'
	else
		filename="${install_path}/temp/release.tar.gz"
		mkdir -p ${install_path}/temp
		mkdir -p ${install_path}/bin
		rm -rf $filename
		wget -O $filename "${1}"
		tar -xzf $filename -C ${install_path}/temp
		mv -f ${install_path}/temp/frp_*/frps ${install_path}/bin/frps
		chown root:root ${install_path}/bin/frps
		chmod +x ${install_path}/bin/frps
		rm -rf ${install_path}/temp/frp_*
		rm -rf $filename
		echo 'success'
	fi
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
elif [ "${1}" == 'download' ];then
	Download "${2}"
else
	echo 'error';
fi
