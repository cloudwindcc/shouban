// Cloudflare Worker for Shouban Figurine Generator
// Simplified for Cloudflare Pages

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // For non-API routes, serve the static assets.
    // env.ASSETS.fetch is the standard way to do this in a Pages _worker.js.
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (url.pathname === '/api/config') {
      if (request.method === 'GET') {
        return getConfig(env, corsHeaders);
      } else if (request.method === 'POST') {
        return updateConfig(request, env, corsHeaders);
      }
    }
    
    if (url.pathname === '/api/default-prompt') {
      return getDefaultPrompt(env, corsHeaders);
    }
    
    if (url.pathname === '/api/generate') {
      return generateImage(request, env, corsHeaders);
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function getConfig(env, headers) {
  const apiKey = env.GEMINI_API_KEY || '';
  const defaultPrompt = env.DEFAULT_PROMPT || '将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染';
  const model = env.GEMINI_MODEL || 'nano-banana';
  
  return new Response(JSON.stringify({
    apiKey: apiKey ? '已设置' : '未设置',
    defaultPrompt,
    model
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function updateConfig(request, env, headers) {
  // In a serverless environment, config should be managed via environment variables.
  // This endpoint is disabled to prevent confusion.
  return new Response(JSON.stringify({
    success: false,
    message: '无法在线更新配置。请在 Cloudflare Pages 仪表盘中设置环境变量 (例如 GEMINI_API_KEY)。'
  }), {
    status: 400, // Bad Request
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function getDefaultPrompt(env, headers) {
  const defaultPrompt = env.DEFAULT_PROMPT || '将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染';
  return new Response(JSON.stringify({ defaultPrompt }), {
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// Helper function to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateImage(request, env, headers) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const prompt = formData.get('prompt') || env.DEFAULT_PROMPT || '将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染';
    
    if (!imageFile) {
      return new Response(JSON.stringify({ success: false, error: '请上传图片' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: '请先配置Gemini API Key' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    const model = env.GEMINI_MODEL || 'nano-banana';
    
    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const mimeType = imageFile.type;
    const imageBase64 = arrayBufferToBase64(imageBuffer);
    
    // Call Gemini API
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
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
    
    const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.candidates && result.candidates[0]) {
      const generatedText = result.candidates[0].content.parts[0].text;
      return new Response(JSON.stringify({
        success: true,
        description: generatedText,
        imageUrl: `data:${mimeType};base64,${imageBase64}`
      }), {
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
    
  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}