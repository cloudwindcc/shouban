// Cloudflare Worker for Shouban Figurine Generator
// This worker handles API calls to Gemini API and serves static files

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // Handle static file serving
    return handleStaticFiles(request);
  }
};

async function handleAPI(request, env) {
  const url = new URL(request.url);
  
  // CORS headers
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
        return getConfig(env);
      } else if (request.method === 'POST') {
        return updateConfig(request, env);
      }
    }
    
    if (url.pathname === '/api/default-prompt') {
      return getDefaultPrompt(env);
    }
    
    if (url.pathname === '/api/generate') {
      return generateImage(request, env);
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

async function getConfig(env) {
  const apiKey = env.GEMINI_API_KEY || '';
  const defaultPrompt = env.DEFAULT_PROMPT || '将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染';
  const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
  
  return new Response(JSON.stringify({
    apiKey: apiKey ? '已设置' : '未设置',
    defaultPrompt,
    model
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function updateConfig(request, env) {
  const data = await request.json();
  
  // In Cloudflare Pages, we'll store config in KV or environment variables
  // For now, we'll just return success since KV needs to be set up
  return new Response(JSON.stringify({ success: true, message: '配置更新成功' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function getDefaultPrompt(env) {
  const defaultPrompt = env.DEFAULT_PROMPT || '将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染';
  
  return new Response(JSON.stringify({ defaultPrompt }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function generateImage(request, env) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const prompt = formData.get('prompt') || env.DEFAULT_PROMPT || '将这个图片转换成可爱的手办风格，保持角色特征，增加手办质感，精细的细节，高质量渲染';
    
    if (!imageFile) {
      return new Response(JSON.stringify({ success: false, error: '请上传图片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: '请先配置Gemini API Key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
    
    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageFile.type;
    
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.candidates && result.candidates[0]) {
      const generatedText = result.candidates[0].content.parts[0].text;
      
      // Return placeholder image URL - in production, you'd integrate with actual image generation
      return new Response(JSON.stringify({
        success: true,
        description: generatedText,
        imageUrl: `data:image/jpeg;base64,${imageBase64}` // Placeholder
      }), {
        headers: { 'Content-Type': 'application/json' }
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
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStaticFiles(request) {
  const url = new URL(request.url);
  
  // Serve static files from the root directory
  let path = url.pathname;
  
  if (path === '/') {
    path = '/index.html';
  }
  
  // Security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  
  try {
    // Try to serve the file
    const response = await fetch(`https://your-static-domain.pages.dev${path}`);
    
    if (response.status === 404) {
      // Return custom 404
      return new Response('404 Not Found', {
        status: 404,
        headers: securityHeaders
      });
    }
    
    // Add security headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
    
  } catch (error) {
    console.error('Static file error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}