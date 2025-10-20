// ==UserScript==
// @name         洛谷个人介绍显示插件
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  显示洛谷个人介绍
// @author       liuyuhan1522
// @match        https://www.luogu.com.cn/user/*
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/marked@4.0.0/marked.min.js
// @connect      luogu.com.cn
// ==/UserScript==

(function() {
    'use strict';
    let nowurl = window.location.href;
    let nowurluid='';
    for(let i=0;i<nowurl.length;i++){
        if(nowurl[i]>='0'&&nowurl[i]<='9') nowurluid+=nowurl[i];
    }
    // 配置参数
    const CONFIG = {
        targetSelector: '#app > div.main-container.lside-nav > main > div > div.sidebar-container.reverse > div.main',
        apiUrl: 'https://www.luogu.com.cn/api/user/info/' + nowurluid,
        maxRetries: 5,
        retryInterval: 1000,
        divStyle: {
            padding: '15px',
            margin: '10px 0',
            background: '#ffffff',
            borderRadius: '5px',
            border: '1px solid #e1e4e8',
            fontSize: '14px',
            lineHeight: '2.0',
            color: '#24292e'
        }
    };

    let retryCount = 0;

    // 创建介绍div元素
    function createIntroDiv(content) {
        const div = document.createElement('div');
        div.className = 'luogu-user-intro';

        // 应用样式
        Object.assign(div.style, CONFIG.divStyle);

        // 使用marked.js转换Markdown为HTML
        try {
            div.innerHTML = marked.parse(content || '该用户暂无个人介绍');
        } catch (e) {
            console.error('Markdown转换失败:', e);
            div.innerHTML = content.replace(/\n/g, '<br>');
        }
        return div;
    }

    // 获取用户数据
    function fetchUserData() {
        GM_xmlhttpRequest({
            method: 'GET',
            url: CONFIG.apiUrl,
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data?.user?.introduction) {
                        injectIntroDiv(data.user.introduction);
                    } else {
                        console.warn('API响应中未找到用户介绍内容');
                    }
                } catch (e) {
                    console.error('解析用户数据失败:', e);
                    retryOrAbort();
                }
            },
            onerror: function(error) {
                console.error('获取用户数据失败:', error);
                retryOrAbort();
            }
        });
    }

    // 重试或放弃
    function retryOrAbort() {
        if (retryCount < CONFIG.maxRetries) {
            retryCount++;
            setTimeout(fetchUserData, CONFIG.retryInterval);
        }
    }

    // 注入介绍div
    function injectIntroDiv(content) {
        const targetElement = document.querySelector(CONFIG.targetSelector);

        if (!targetElement) {
            if (retryCount < CONFIG.maxRetries) {
                retryCount++;
                setTimeout(() => injectIntroDiv(content), CONFIG.retryInterval);
            }
            return;
        }

        // 检查是否已存在
        if (targetElement.querySelector('.luogu-user-intro')) {
            return;
        }

        targetElement.prepend(createIntroDiv(content));
        console.log('用户介绍内容已成功注入');
    }

    // 初始化
    function init() {
        if (document.readyState === 'complete') {
            fetchUserData();
        } else {
            document.addEventListener('DOMContentLoaded', fetchUserData);
            window.addEventListener('load', fetchUserData);
        }
    }

    init();
})();


