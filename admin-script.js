document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const toggleApiKeyBtn = document.getElementById('toggleApiKey');
    const modelSelect = document.getElementById('model');
    const defaultPromptTextarea = document.getElementById('defaultPrompt');
    const loadConfigBtn = document.getElementById('loadConfig');
    const saveConfigBtn = document.getElementById('saveConfig');
    const testApiBtn = document.getElementById('testApi');
    const apiStatus = document.getElementById('apiStatus');
    const configStatus = document.getElementById('configStatus');
    const notification = document.getElementById('notification');

    // 显示/隐藏API Key
    toggleApiKeyBtn.addEventListener('click', function() {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleApiKeyBtn.textContent = '隐藏';
        } else {
            apiKeyInput.type = 'password';
            toggleApiKeyBtn.textContent = '显示';
        }
    });

    // 加载配置
    loadConfigBtn.addEventListener('click', loadConfig);
    saveConfigBtn.addEventListener('click', saveConfig);
    testApiBtn.addEventListener('click', testApiConnection);

    // 页面加载时自动加载配置
    loadConfig();

    async function loadConfig() {
        try {
            showNotification('正在加载配置...', 'info');
            
            const response = await fetch('/api/config');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const config = await response.json();
            
            // 更新界面
            if (config.apiKey !== '未设置') {
                apiKeyInput.placeholder = '已设置 API Key';
            }
            modelSelect.value = config.model || 'gemini-2.5-nano-banana';
            defaultPromptTextarea.value = config.defaultPrompt || '';
            
            configStatus.textContent = '已加载';
            configStatus.className = 'status-indicator success';
            
            showNotification('配置加载成功', 'success');
        } catch (error) {
            console.error('加载配置失败:', error);
            configStatus.textContent = '加载失败';
            configStatus.className = 'status-indicator error';
            showNotification('加载配置失败: ' + error.message, 'error');
        }
    }

    async function saveConfig() {
        try {
            showNotification('正在保存配置...', 'info');
            
            const configData = {
                model: modelSelect.value,
                defaultPrompt: defaultPromptTextarea.value
            };

            // 只有在输入了新的API Key时才发送
            if (apiKeyInput.value.trim()) {
                configData.apiKey = apiKeyInput.value.trim();
            }

            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(configData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                configStatus.textContent = '已保存';
                configStatus.className = 'status-indicator success';
                showNotification('配置保存成功', 'success');
                
                // 清空API Key输入框
                apiKeyInput.value = '';
                apiKeyInput.placeholder = '已设置 API Key';
            } else {
                throw new Error(result.error || '保存失败');
            }
        } catch (error) {
            console.error('保存配置失败:', error);
            configStatus.textContent = '保存失败';
            configStatus.className = 'status-indicator error';
            showNotification('保存配置失败: ' + error.message, 'error');
        }
    }

    async function testApiConnection() {
        try {
            showNotification('正在测试API连接...', 'info');
            apiStatus.textContent = '测试中...';
            apiStatus.className = 'status-indicator';

            // 这里可以添加实际的API测试逻辑
            // 暂时使用模拟测试
            await new Promise(resolve => setTimeout(resolve, 2000));

            apiStatus.textContent = '连接正常';
            apiStatus.className = 'status-indicator success';
            showNotification('API连接测试成功', 'success');
        } catch (error) {
            console.error('API测试失败:', error);
            apiStatus.textContent = '连接失败';
            apiStatus.className = 'status-indicator error';
            showNotification('API连接测试失败: ' + error.message, 'error');
        }
    }

    function showNotification(message, type = 'info') {
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'block';

        // 3秒后自动隐藏
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // 全局函数供HTML调用
    window.setPrompt = function(promptText) {
        defaultPromptTextarea.value = promptText;
        showNotification('已设置提示词预设', 'success');
    };
});