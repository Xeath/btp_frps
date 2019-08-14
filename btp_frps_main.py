#!/usr/bin/python
# coding: utf-8
#  Author: Xetch

import sys, os, json, ssl
pluginPath = "/www/server/panel/plugin/btp_frps"
frpsPath = pluginPath + '/bin/frps';
frpsIniPath = pluginPath + '/conf/frps.ini';
os.chdir("/www/server/panel")
sys.path.append("class/")
import public, re

class btp_frps_main():
	def check(self, get):
		if not os.path.isfile(frpsPath):
			return public.returnMsg(False, 'frps 未安装');

		success, failed = public.ExecShell(frpsPath + ' --version');
		if success.strip() == '':
			return public.returnMsg(False, 'frps 未安装或无执行权限');

		return public.returnMsg(True, {
			'version': success.strip(),
			'pid': self.__pid()
		});

	def install(self, get):
		release = self.release();
		if release['result'] != 'success':
			return public.returnMsg(False, release['result']);
		filename = pluginPath + '/temp/release.tar.gz';
		os.system('mkdir -p ' + pluginPath + '/temp');
		os.system('mkdir -p ' + pluginPath + '/bin');
		os.system('rm -rf ' + filename);
		os.system('wget -O ' + filename + ' ' + release['url']);
		os.system('tar -xzf ' + filename + ' -C ' + pluginPath + '/temp');
		os.system('mv -f ' + pluginPath + '/temp/frp_*/frps ' + frpsPath);
		os.system('chown root:root ' + frpsPath);
		os.system('chmod +x ' + frpsPath);
		os.system('rm -rf ' + pluginPath + '/temp/frp_*');
		os.system('rm -rf ' + filename);
		if not os.path.isfile(frpsPath):
			return public.returnMsg(False, '安装失败');
		return self.check(get);

	def upgrade(self, get):
		release = self.release();
		if release['result'] != 'success':
			return public.returnMsg(False, release['result']);
		return public.returnMsg(True, release);
	
	def save(self, get):
		try:
			data = json.loads(get['json']);
			os.system('mkdir -p ' + pluginPath + '/conf');
			public.WriteFile(pluginPath + '/conf/config.json', get['json'], mode='w+');
			keys = {
				"bindAddr": "bind_addr",
				"bindPort": "bind_port",
				"bindUdpPort": "bind_udp_port",
				"kcpBindPort": "kcp_bind_port",
				"proxyBindAddr": "proxy_bind_addr",
				"vhostHttpPort": "vhost_http_port",
				"vhostHttpsPort": "vhost_https_port",
				"vhostHttpTimeout": "vhost_http_timeout",
				"dashboardAddr": "dashboard_addr",
				"dashboardPort": "dashboard_port",
				"dashboardUser": "dashboard_user",
				"dashboardPwd": "dashboard_pwd",
				# "assetsDir": "assets_dir",
				# "logFile": "log_file",
				"logLevel": "log_level",
				"logMaxDays": "log_max_days",
				"token": "token",
				"heartbeatTimeout": "heartbeat_timeout",
				# "allowPorts": "allow_ports",
				"maxPoolCount": "max_pool_count",
				"maxPortsPerClient": "max_ports_per_client",
				"subdomainHost": "subdomain_host",
				"tcpMux": "tcp_mux",
				# "custom404Page": "custom_404_page"
			};
			config = '[common]\n';
			for key in keys.keys():
				if type(data[key]) == bool:
					if data[key] == True:
						data[key] = 'true';
					else:
						data[key] = 'false';
				if str(data[key]) != '':
					config += '%s = %s\n' % (keys[key], str(data[key]));
			if type(data['allowPorts']) == list and len(data['allowPorts']) > 0:
				config += 'allow_ports = %s\n' % ','.join(data['allowPorts']);
			config += 'log_file = %s/temp/frps.log\n' % pluginPath;
			public.WriteFile(frpsIniPath, config, mode='w+');
			return public.returnMsg(True, '保存成功');
		except ValueError:
			return public.returnMsg(False, '请求错误，请刷新页面重试');

	def read(self, get):
		filename = pluginPath + '/conf/config.json';
		if os.path.isfile(filename):
			try:
				return public.returnMsg(True, json.loads(public.ReadFile(filename, mode='r')));
			except ValueError:pass;
		return public.returnMsg(False, '配置文件损坏或不存在');

	def release(self):
		'''
		不知道为什么在这里用不了 public.httpGet
		'''
		#result = public.httpGet('https://api.github.com/repos/fatedier/frp/releases/latest'); # 获取不到？
		#result = public.ExecShell('curl https://api.github.com/repos/fatedier/frp/releases/latest');
		#data = json.loads(result);
		#return resp.read().decode("utf8");
		filename = pluginPath + '/temp/release.json';
		result = 'success';
		version = '';
		url = '';
		remark = '';
		os.system('mkdir -p ' + pluginPath + '/temp');
		os.system('rm -rf ' + filename);
		os.system('wget -O ' + filename + ' https://api.github.com/repos/fatedier/frp/releases/latest');
		if not os.path.isfile(filename):
			result = '获取版本信息失败';
		else:
			try:
				data = json.loads(public.ReadFile(filename, mode='r'));
				version = data['tag_name'].strip()[1:]; # 版本号
				remark = data['body']; # 更新说明
				for item in data['assets']:
					if item['name'].find('linux_amd64') != -1:
						url = item['browser_download_url']; # 下载地址
						break;
			except ValueError:
				result = '文件解析失败，请稍后再试';
		os.system('rm -rf ' + filename);

		return {
			'version': version,
			'url': url,
			'remark': remark,
			'result': result
		};

	def start(self, get):
		pid = self.__pid();
		if pid != False:
			return public.returnMsg(True, 'frps 已开启，PID：%s' % pid);
		service = '''[Unit]
Description=Frp Server Service
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=%s -c %s

[Install]
WantedBy=multi-user.target''' % (frpsPath, frpsIniPath);
		# 使用 systemd 管理自启动
		filename = '/etc/systemd/system/btp_frps.service';
		if os.path.isdir('/etc/systemd/system') and not os.path.isfile(filename):
			public.WriteFile(filename, service, mode='w+');
			os.system('chown root:root %s' % filename);
			os.system('chmod 755 %s' % filename);
		if os.path.isfile(filename):
			os.system('systemctl enable btp_frps');
			os.system('systemctl start btp_frps');
		else:
			os.system('nohup %s -c %s &' % (frpsPath, frpsIniPath));
		import time;
		time.sleep(1);
		pid = self.__pid();
		if pid != False:
			return public.returnMsg(True, '开启成功，PID：%s' % pid);
		return public.returnMsg(False, '开启失败');

	def stop(self, get):
		pid = self.__pid();
		if pid == False:
			return public.returnMsg(True, 'frps 尚未运行');
		filename = '/etc/systemd/system/btp_frps.service';
		if os.path.isfile(filename):
			os.system('systemctl stop btp_frps');
			os.system('systemctl disable btp_frps');
			os.system('rm -rf %s' % filename);
		else:
			os.system('kill -9 %s' % pid);
		return public.returnMsg(True, '关闭成功');

	def restart(self, get):
		if os.path.isfile('/etc/systemd/system/btp_frps.service'):
			os.system('systemctl restart btp_frps');
		else:
			pid = self.__pid();
			if pid != False:
				os.system('kill -9 %s' % pid);
			os.system('nohup %s -c %s &' % (frpsPath, frpsIniPath));
			import time;
			time.sleep(1);
		return public.returnMsg(True, '重启成功');

	def logs(self, get):
		filename = pluginPath + '/temp/frps.log';
		if os.path.isfile(filename):
			# 宝塔封装的 public.ReadFile 不适合读取大文件
			success, failed = public.ExecShell('tail -n 1000 %s' % filename);
			if success.strip() != '':
				return public.returnMsg(True, success.strip());
		return public.returnMsg(True, '暂无运行日志');

	def clear(self, get):
		filename = pluginPath + '/temp/frps.log';
		os.system('cat /dev/null > %s' % filename);
		return public.returnMsg(True, '清理成功');

	def __pid(self):
		success, failed = public.ExecShell('ps -ef | grep %s | grep -v grep | awk \'{print $2}\' | head -n 1' % frpsPath);
		if success.strip() == '':
			return False;
		return success.strip();

#print(btp_frps_main().install({}));