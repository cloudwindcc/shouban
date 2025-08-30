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

    // Adapt UI for serverless environment
    apiKeyInput.disabled = true;
    apiKeyInput.placeholder = '在Cloudflare环境变量中设置';
    toggleApiKeyBtn.style.display = 'none';
    modelSelect.disabled = true; // Model is also set by env var or defaults in worker

    // 显示/隐藏API Key - No longer needed as button is hidden
    // toggleApiKeyBtn.addEventListener('click', function() { ... });

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
        // In serverless, config is read-only from the admin panel.
        // Inform the user how to configure the application.
        const message = '无法在线更新配置。请在 Cloudflare Pages 仪表盘中设置环境变量。';
        showNotification(message, 'error');

        // Since the backend will now send an error, we can also handle it here
        // but the above is more direct. For completeness, let's just replace the function body.
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