new Vue({
	el: "#btp_frps",
	watch: {
		current: function (current) {
			const t = this;
			if (t.timer !== null) {
				clearTimeout(t.timer);
			}
			if (current === 'about') {
				t.about.sort(() => {
					return Math.random() - 0.5;
				});
			}
			if (current === 'status') {
				t.getLogs();
			}
		}
	},
	data: {
		version: "加载中 ...",
		menu: [
			{
				name: "通用设置",
				value: "common"
			},
			{
				name: "高级设置",
				value: "advanced"
			},
			{
				name: "仪表盘设置",
				value: "dashboard"
			},
			{
				name: "虚拟主机",
				value: "vhost"
			},
			{
				name: "端口白名单",
				value: "ports"
			},
			{
				name: "运行状态",
				value: "status"
			},
			{
				name: "关于",
				value: "about"
			}
		],
		about: [
			{
				name: "宝塔面板",
				url: "https://www.bt.cn/"
			},
			{
				name: "frp",
				url: "https://github.com/fatedier/frp"
			},
			{
				name: "Vue.js",
				url: "https://cn.vuejs.org/"
			},
			{
				name: "axios",
				url: "https://github.com/axios/axios"
			},
			{
				name: "Python",
				url: "https://www.python.org/"
			},
			{
				name: "Bootstrap",
				url: "https://getbootstrap.com/"
			},
			{
				name: "layer",
				url: "https://layer.layui.com/"
			},
			{
				name: "Ace",
				url: "https://ace.c9.io/"
			},
			{
				name: "CodeMirror",
				url: "https://codemirror.net/"
			}
		],
		current: "common",
		init: false,
		installed: false,
		started: false,
		config: {
			bindAddr: '0.0.0.0',
			bindPort: 7000,
			bindUdpPort: 7001,
			kcpBindPort: 7000,
			proxyBindAddr: '',
			vhostHttpPort: '',
			vhostHttpsPort: '',
			vhostHttpTimeout: '',
			dashboardAddr: '',
			dashboardPort: '',
			dashboardUser: '',
			dashboardPwd: '',
			assetsDir: './static',
			logFile: '',
			logLevel: 'info',
			logMaxDays: 3,
			token: '',
			heartbeatTimeout: '',
			allowPorts: [],
			maxPoolCount: 5,
			maxPortsPerClient: 0,
			subdomainHost: '',
			tcpMux: true,
			disableLogColor: false,
			custom404Page: '/www/server/panel/plugin/btp_frps/conf/404.html',
			enabledCustom404Page: false
		},
		logs: '',
		timer: null,
		createdAt: (new Date()).getTime().toString()
	},
	methods: {
		change(value) {
			this.current = value;
		},
		install() {
			const t = this;
			const msgId = layer.msg("正在提交任务，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('install').then((response) => {
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					bt.pub.get_task_count();
					if (t.installed && t.started) {
						layer.alert('提交成功，更新完成后请手动重启 frps', {
							icon: 1
						});
					} else {
						layer.msg(response.data.msg, {icon: response.data.status ? 1 : 2});
					}
					return;
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				layer.close(msgId);
				layer.alert('接口请求失败', {
					icon: 2
				})
				console.error(error);
			});
		},
		upgrade() {
			const t = this;
			const msgId = layer.msg("正在获取 frps 版本信息，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('upgrade').then((response) => {
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					if (response.data.status) {
						if (response.data.msg.version !== t.version) {
							return layer.confirm('frps ' + response.data.msg.version + ' 更新说明：<pre>' + response.data.msg.remark + '</pre>如需更新请点击「确定」按钮', (index) => {
								layer.close(index);
								t.install();
							});
						}
						return layer.msg('已安装最新版本 frps', {icon: 1});
					}
					return layer.alert(response.data.msg, {
						icon: 2
					});
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				layer.close(msgId);
				layer.alert('接口请求失败', {
					icon: 2
				})
				console.error(error);
			});
		},
		addPort() {
			const t = this;
			const name = '__btp_frps_' + (new Date()).getTime();
			layer.open({
				type: 1,
				title: '添加端口',
				closeBtn: 2,
				area: '450px',
				btn: ['确定', '取消'],
				content: t.$refs.addPort.innerHTML.replace('__VALUE__', name),
				yes(index, layers) {
					let ports = document.querySelector('input[name="' + name + '"]').value;
					let beginPort, endPort;
					if (!ports) {
						layer.msg('端口不能为空，请重新输入', {icon: 2});
						return false;
					}
					if (ports.indexOf('-') !== -1) {
						beginPort = ports.split('-')[0];
						endPort = ports.split('-')[1];
					} else {
						beginPort = endPort = ports;
					}
					if (!beginPort.match(/^[0-9]\d*$/) || !endPort.match(/^[0-9]\d*$/)) {
						layer.msg('端口格式错误，请重新输入', {icon: 2});
						return false;
					}
					beginPort = parseInt(beginPort);
					endPort = parseInt(endPort);
					if (beginPort < 0 || beginPort > 65535 || endPort < 0 || endPort > 65535) {
						layer.msg('端口范围为 0 至 65535，请重新输入', {icon: 2});
						return false;
					}
					if (beginPort > endPort) {
						layer.msg('起始端口不能大于终止端口，请重新输入', {icon: 2});
						return false;
					}
					if (beginPort === endPort) {
						ports = beginPort;
					}
					t.config.allowPorts.push(ports);
					layer.close(index);
				}
			});
		},
		removePort(index) {
			this.config.allowPorts.splice(index, 1);
		},
		save(init) {
			const t = this;
			const msgId = layer.msg(init === true ? "正在初始化配置，请稍等 ..." : "正在保存配置，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('save', t.config).then((response) => {
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					if (response.data.status) {
						if (init === true) {
							return layer.msg('初始化配置成功', {icon: 1});
						}
						if (!t.started) {
							return layer.msg('保存成功', {icon: 1});
						}
						return layer.confirm('保存成功！配置信息将在重启 frps 后生效', {icon: 1, btn: ['重启', '关闭']}, (index) => {
							layer.close(index);
							t.restart();
						});
					}
					return layer.alert(response.data.msg, {
						icon: 2
					});
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				layer.close(msgId);
				layer.alert('接口请求失败', {
					icon: 2
				});
				console.error(error);
			});
		},
		check() {
			const t = this;
			const msgId = layer.msg("正在获取 frps 状态，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('check').then((response) => {
				layer.close(msgId);
				t.installed = response.status === 200 && response.data.status === true
				if (t.installed) {
					t.version = response.data.msg.version;
					t.started = response.data.msg.pid !== false;
				}
				t.read();
			}).catch((error) => {
				layer.close(msgId);
				t.read();
				console.error(error);
			});
		},
		read() {
			const t = this;
			const msgId = layer.msg("正在读取 frps 配置信息，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('read').then((response) => {
				layer.close(msgId);
				if (response.status === 200 && response.data.status === true) {
					Object.keys(t.config).map((key) => {
						if (response.data.msg[key] !== undefined) {
							t.config[key] = response.data.msg[key];
						}
					});
				} else {
					t.save(true);
				}
			}).catch((error) => {
				layer.close(msgId);
				console.error(error);
			});
		},
		start() {
			const t = this;
			const msgId = layer.msg("正在开启 frps，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('start').then((response) => {
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					if (response.data.status) {
						t.started = true;
						return layer.msg('开启成功', {icon: 1});
					}
					return layer.alert(response.data.msg, {
						icon: 2
					});
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				layer.close(msgId);
				layer.alert('接口请求失败', {
					icon: 2
				})
				console.error(error);
			});
		},
		stop() {
			const t = this;
			const msgId = layer.msg("正在关闭 frps，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('stop').then((response) => {
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					if (response.data.status) {
						t.started = false;
						return layer.msg('关闭成功', {icon: 1});
					}
					return layer.alert(response.data.msg, {
						icon: 2
					});
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				layer.close(msgId);
				layer.alert('接口请求失败', {
					icon: 2
				})
				console.error(error);
			});
		},
		restart() {
			const t = this;
			const msgId = layer.msg("正在重启 frps，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('restart').then((response) => {
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					if (response.data.status) {
						t.started = true;
						return layer.msg('重启成功', {icon: 1});
					}
					return layer.alert(response.data.msg, {
						icon: 2
					});
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				layer.close(msgId);
				layer.alert('接口请求失败', {
					icon: 2
				})
				console.error(error);
			});
		},
		getLogs() {
			const t = this;
			const $el = document.querySelector('#btp_frps');
			if ($el && $el.getAttribute('data-created-at') === t.createdAt) {
				t.api('logs').then((response) => {
					t.timer = setTimeout(t.getLogs, 5000);
					if (response.status === 200 && typeof response.data === 'object') {
						t.logs = response.data.msg;
						return;
					}
					t.logs = '暂无日志';
				}).catch((error) => {
					t.timer = setTimeout(t.getLogs, 3000);
					t.logs = '接口请求失败';
					console.error(error);
				});
			}
		},
		clearLogs() {
			const t = this;
			const msgId = layer.msg("正在清理 frps 运行日志，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			t.api('clear').then((response) => {
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					if (response.data.status) {
						t.logs = '暂无运行日志';
						return layer.msg('清理成功', {icon: 1});
					}
					return layer.alert(response.data.msg, {
						icon: 2
					});
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				layer.close(msgId);
				layer.alert('接口请求失败', {
					icon: 2
				})
				console.error(error);
			});
		},
		custom404Page() {
			const t = this;
			if (!window.openEditorView) {
				window.OnlineEditFile(0, t.config.custom404Page);
			} else {
				if (!window.ace) {
					window.__btpFrpsMsgId = layer.msg("正在加载编辑器，请稍等 ...", {
						icon: 16,
						time: 0,
						shade: 0.3
					});
				}
				t.openWithAce();
			}
		},
		openWithAce() {
			const t = this;
			const $doc = document;
			switch (true) {
				case !window.ace:
					const $ace = $doc.createElement("script");
					$ace.setAttribute("type", "text/javascript");
					$ace.setAttribute("src", "/static/ace/ace.js");
					$ace.addEventListener("load", function () {
						$ace.remove();
						const $aceExtra = $doc.createElement("script");
						$aceExtra.setAttribute("type", "text/javascript");
						$aceExtra.setAttribute("src", "/static/ace/ext-language_tools.js");
						$aceExtra.addEventListener("load", function () {
							$aceExtra.remove();
							t.openWithAce();
						});
						$doc.head.append($aceExtra);
					});
					$doc.head.append($ace);
					break;

				case !$doc.querySelector('#aceTmplate'):
					const $aceTmplate = $doc.createElement("script");
					$aceTmplate.setAttribute("type", "text/template");
					$aceTmplate.setAttribute("id", "aceTmplate");
					axios.get('/files').then((response) => {
						if (response.status === 200) {
							const matches = response.data.match(/aceTmplate[^>]*>([\s\S]+?)<\/script>/);
							if (matches) {
								$aceTmplate.innerHTML = matches[1];
							}
						}
						t.openWithAce();
					}).catch((error) => {
						t.openWithAce();
						console.error(error);
					});
					$doc.body.append($aceTmplate);
					break;

				case !window.openEditorViewModeModified:
					// 打开后在插件设置框后面，需要进行一下修改
					let func = window.openEditorView.toString();
					func = func.replace('openEditorView', '');
					func = func.replace(/zIndex\s*:[^,]+,/, '');
					// func = func.replace(/layer\.closeAll\(\)/g, 'layer.close(indexs)');
					// eval('window.openEditorViewModeModified = ' + func);
					window.openEditorViewModeModified = new Function(func.match(/\(([^\)]+)\)/)[1], func.match(/\{([\s\S]+)\}/)[1]);
					t.openWithAce();
					break;

				default:
					if (window.__btpFrpsMsgId) {
						layer.close(window.__btpFrpsMsgId);
						window.__btpFrpsMsgId = null;
					}
					if (!$doc.querySelector('#aceTmplate').innerHTML) {
						window.OnlineEditFile(0, t.config.custom404Page);
					} else {
						// window.aceEditor.pathAarry = [];
						window.openEditorViewModeModified(0, t.config.custom404Page);
					}
			}
		},
		uploadFile() {
			const t = this;
			const params = new FormData();
			const msgId = layer.msg("正在上传文件，请稍等 ...", {
				icon: 16,
				time: 0,
				shade: 0.3
			});
			params.append('import', t.$refs.import.files[0]);
			axios.post('/plugin?action=a&name=btp_frps&s=upload', params, {headers: {'Content-Type': 'multipart/form-data'}}).then((response) => {
				t.$refs.import.value = null;
				layer.close(msgId);
				if (response.status === 200 && typeof response.data === 'object') {
					if (response.data.status) {
						t.started = response.data.msg.pid !== false;
						if (t.started) {
							layer.confirm('更新成功！重启 frps 后将以新版本运行', {icon: 1, btn: ['重启', '关闭']}, (index) => {
								layer.close(index);
								t.restart();
							});
						} else {
							layer.msg(t.installed ? '更新成功' : '安装成功', {icon: 1});
						}
						t.version = response.data.msg.version;
						t.installed = true;
						return;
					}
					return layer.alert(response.data.msg, {
						icon: 2
					});
				}
				layer.alert('发生未知错误，代码：' + response.status, {
					icon: 2
				});
			}).catch((error) => {
				t.$refs.import.value = null;
				layer.close(msgId);
				layer.alert('文件上传失败', {
					icon: 2
				})
				console.error(error);
			});
		},
		api(action, data) {
			if (!data) {
				return axios.get('/plugin?action=a&name=btp_frps&s=' + action);
			}
			return axios.post('/plugin?action=a&name=btp_frps&s=' + action, 'json=' + encodeURIComponent(JSON.stringify(data)));
		}
	},
	created() {
		this.check();
	},
	mounted() {
		const t = this;
		t.$el.setAttribute('data-created-at', t.createdAt);
		t.init = true;
	}
})