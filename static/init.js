!function (func) {
	/* if (!window.$loading) {
		window.$loading = layer.msg("正在加载组件，请稍后 ...", {
			icon: 16,
			time: 0,
			shade: 0.3
		});
	} */
	func(func);
}(function (func) {
	let $doc = document;
	switch (true) {
		/* case !$doc.getElementById("btp_frps_style"):
			let $link = $doc.createElement('link');
			$link.setAttribute("id", "btp_frps_style");
			$link.setAttribute("href", "/btp_frps/static/style.css");
			$link.setAttribute("rel", "stylesheet");
			$link.addEventListener("load", function () {
				func(func);
			});
			$doc.head.append($link);
			break; */

		case !window.Vue:
			let $vue = $doc.createElement("script");
			$vue.setAttribute("type", "text/javascript");
			$vue.setAttribute("src", "/btp_frps/static/vue.min.js");
			$vue.addEventListener("load", function () {
				$vue.remove();
				func(func);
			});
			$doc.head.append($vue);
			break;

		case !window.axios:
			let $axios = $doc.createElement("script");
			$axios.setAttribute("type", "text/javascript");
			$axios.setAttribute("src", "/btp_frps/static/axios.min.js");
			$axios.addEventListener("load", function () {
				$axios.remove();
				if (window.my_headers) {
					window.axios.defaults.headers.common = window.my_headers;
				} else if (jQuery.ajaxSettings.headers) {
					window.axios.defaults.headers.common = jQuery.ajaxSettings.headers;
				}
				func(func);
			});
			$doc.head.append($axios);
			break;

		default:
			let $app = $doc.createElement("script");
			$app.setAttribute("type", "text/javascript");
			$app.setAttribute("src", "/btp_frps/static/app.js?_=" + (new Date()).getTime());
			$app.addEventListener("load", function () {
				$app.remove();
				/* if (window.$loading) {
					layer.close(window.$loading);
					window.$loading = false;
				} */
			});
			$doc.head.append($app);
	}
})