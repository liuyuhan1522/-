// ==UserScript==
// @name         洛谷个人介绍显示插件
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  显示洛谷个人介绍
// @author       liuyuhan1522
// @match        https://www.luogu.com.cn/user/*
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/marked@4.0.0/marked.min.js
// @connect      luogu.com.cn
// ==/UserScript==

(function(){
	'use strict';

    // 如果你希望不显示你自己的个人介绍，请将下面的 0 改为你的 uid。
    let useruid = 0;



	let nowurl = window.location.href;
	let nowurluid = '';
	for (let i = 0; i < nowurl.length; i++){
		if (nowurl[i] >= '0' && nowurl[i] <= '9') nowurluid += nowurl[i];
	}
	if (useruid != nowurluid){
		const targetSelector = '#app > div.main-container > main > div > div.sidebar-container.reverse > div.main';
		const observer = new MutationObserver(function(mutations, obs){
			const targetElement = document.querySelector(targetSelector);
			if (targetElement){
				let newDiv = document.createElement('div');
				newDiv.setAttribute('data-v-b62e56e7', '');
				newDiv.setAttribute('data-v-f4fefeb2', '');
				newDiv.setAttribute('data-v-754e1ea4-s', '');
				newDiv.className = 'l-card';
				targetElement.prepend(newDiv);
				obs.disconnect();
				newDiv.innerHTML = '<div data-v-f4fefeb2="" class="header"><h3 data-v-f4fefeb2="" style="margin: 0px;">个人介绍</h3></div><div data-v-f4fefeb2="" class="lfe-marked-wrap introduction"><div class="lfe-marked">';
			}
		}
		);

		observer.observe(document, {
			childList : true,
			subtree : true
		}
		);

		const CONFIG2 = {
			targetSelector :  '#app > div.main-container > main > div > div.sidebar-container.reverse > div.main > div:nth-child(1) > div.lfe-marked-wrap.introduction > div',
			apiUrl :  'https://www.luogu.com.cn/api/user/info/' + nowurluid,
			maxRetries : 5,
			retryInterval : 1000,
		};

		let retryCount = 0;
		function createIntroDiv(content){
			const div = document.createElement('div');

			Object.assign(div.style, CONFIG2.divStyle);

			try {
				div.innerHTML = marked.parse(content || '该用户暂无个人介绍');
			}
			catch (e){
				console.error('Markdown转换失败:', e);
				div.innerHTML = content.replace( /\n/g,'<br>');
			}
			return div;
		}

		function fetchUserData(){
			GM_xmlhttpRequest({
				method :  'GET',
				url : CONFIG2.apiUrl,
				headers : {
					'Accept' :  'application/json',
					'X-Requested-With' :  'XMLHttpRequest'
				}
				,
				onload : function(response){
					try {
						const data = JSON.parse(response.responseText);
						if (data?.user?.introduction){
							injectIntroDiv(data.user.introduction);
						}
						else {
							console.warn('API响应中未找到用户介绍内容');
						}
					}
					catch (e){
						console.error('解析用户数据失败:', e);
						retryOrAbort();
					}
				}
				,
				onerror : function(error){
					console.error('获取用户数据失败:', error);
					retryOrAbort();
				}
			}
			);
		}

		function retryOrAbort(){
			if (retryCount < CONFIG2.maxRetries){
				retryCount++;
				setTimeout(fetchUserData, CONFIG2.retryInterval);
			}
		}

		function injectIntroDiv(content){
			const targetElement = document.querySelector(CONFIG2.targetSelector);

			if (!targetElement){
				if (retryCount < CONFIG2.maxRetries){
					retryCount++;
					setTimeout(()=>injectIntroDiv(content),CONFIG2.retryInterval);
				} return;
			}

			if (targetElement.querySelector('.luogu-user-intro')){
				return;
			} targetElement.append(createIntroDiv(content));
			console.log('用户介绍内容已成功注入');
		}

		function init(){
			if (document.readyState === 'complete'){
				fetchUserData();
			}
			else {
				document.addEventListener('DOMContentLoaded', fetchUserData);
				window.addEventListener('load', fetchUserData);
			}
		}

		init();
	}
}
)();
