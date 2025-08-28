const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(outputsDir);

// 配置multer进行文件上传
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// 配置管理
class Config {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
        this.defaultPrompt = process.env.DEFAULT_PROMPT || '将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染';
        this.model = 'gemini-1.5-flash';
    }

    updateConfig(newConfig) {
        Object.assign(this, newConfig);
    }

    getConfig() {
        return {
            apiKey: this.apiKey ? '已设置' : '未设置',
            defaultPrompt: this.defaultPrompt,
            model: this.model
        };
    }
}

const config = new Config();

// 将图片转换为base64
function imageToBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString('base64');
}

// 调用Google Gemini API生成图片
async function generateImageWithGemini(imagePath, prompt) {
    try {
        if (!config.apiKey) {
            throw new Error('请先配置Gemini API Key');
        }

        const base64Image = imageToBase64(imagePath);
        const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        console.log('调用Gemini API:', `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`);
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        console.log('Gemini API响应:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.candidates && response.data.candidates[0]) {
            const generatedText = response.data.candidates[0].content.parts[0].text;
            
            console.log('生成的文本:', generatedText);
            
            // 这里需要实际的图片生成逻辑
            // 由于Gemini API主要是文本生成，我们需要使用其他服务来生成图片
            // 暂时返回一个占位符响应
            return {
                success: true,
                description: generatedText,
                imageUrl: '/placeholder-generated.jpg' // 实际应用中需要真正的图片生成
            };
        } else {
            throw new Error('API响应格式错误: ' + JSON.stringify(response.data));
        }
    } catch (error) {
        console.error('Gemini API调用失败:', error);
        throw new Error(`生成失败: ${error.message}`);
    }
}

// API路由
app.post('/api/generate', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '请上传图片' });
        }

        const prompt = req.body.prompt || config.defaultPrompt;
        const imagePath = req.file.path;

        console.log('开始生成图片:', { prompt, imagePath });

        const result = await generateImageWithGemini(imagePath, prompt);

        // 清理上传的临时文件
        fs.unlinkSync(imagePath);

        res.json(result);
    } catch (error) {
        console.error('生成图片失败:', error);
        
        // 清理临时文件
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('清理临时文件失败:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 配置管理路由
app.get('/api/config', (req, res) => {
    res.json(config.getConfig());
});

app.post('/api/config', (req, res) => {
    try {
        const { apiKey, defaultPrompt, model } = req.body;
        
        const newConfig = {};
        if (apiKey !== undefined) newConfig.apiKey = apiKey;
        if (defaultPrompt !== undefined) newConfig.defaultPrompt = defaultPrompt;
        if (model !== undefined) newConfig.model = model;

        config.updateConfig(newConfig);
        
        res.json({ success: true, message: '配置更新成功' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 获取默认提示词
app.get('/api/default-prompt', (req, res) => {
    res.json({ defaultPrompt: config.defaultPrompt });
});

// 根路径重定向到 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));
app.use('/outputs', express.static(outputsDir));

// 错误处理中间件
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: '文件大小超过限制(10MB)' });
        }
    }
    
    console.error('服务器错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('请在浏览器中打开上述地址访问手办图片生成器');
    
    if (!config.apiKey) {
        console.warn('⚠️  警告: 未设置Gemini API Key，请访问 /api/config 设置API密钥');
    }
});