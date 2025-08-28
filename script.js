document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const uploadZone = document.getElementById('uploadZone');
    const imageInput = document.getElementById('imageInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const removeImage = document.getElementById('removeImage');
    const promptInput = document.getElementById('promptInput');
    const generateBtn = document.getElementById('generateBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');
    const resultView = document.getElementById('resultView');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const processingOverlay = document.getElementById('processingOverlay');

    let selectedFile = null;
    let defaultPrompt = '';

    // Initialize
    loadDefaultPrompt();
    setupEventListeners();

    function setupEventListeners() {
        // Upload zone interactions
        uploadZone.addEventListener('click', () => imageInput.click());
        uploadZone.addEventListener('dragover', handleDragOver);
        uploadZone.addEventListener('dragleave', handleDragLeave);
        uploadZone.addEventListener('drop', handleDrop);
        imageInput.addEventListener('change', handleFileSelect);
        
        // Button interactions
        removeImage.addEventListener('click', resetUpload);
        generateBtn.addEventListener('click', generateImage);
        regenerateBtn.addEventListener('click', generateImage);
        downloadBtn.addEventListener('click', downloadImage);
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        if (e.target === uploadZone) {
            uploadZone.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect({ target: { files } });
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showNotification('File size must be under 10MB', 'error');
            return;
        }

        selectedFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            showPreview();
            generateBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    function showPreview() {
        uploadPlaceholder.style.display = 'none';
        imagePreview.style.display = 'block';
    }

    function resetUpload() {
        selectedFile = null;
        imagePreview.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
        generateBtn.disabled = true;
        imageInput.value = '';
        
        // Reset prompt to default
        promptInput.value = defaultPrompt;
    }

    async function loadDefaultPrompt() {
        try {
            const response = await fetch('/api/default-prompt');
            if (response.ok) {
                const data = await response.json();
                defaultPrompt = data.defaultPrompt;
                promptInput.value = defaultPrompt;
            }
        } catch (error) {
            console.error('Failed to load default prompt:', error);
            defaultPrompt = "Generate a high-quality figurine style image";
            promptInput.value = defaultPrompt;
        }
    }

    async function generateImage() {
        if (!selectedFile) {
            showNotification('Please upload an image first', 'error');
            return;
        }

        const prompt = promptInput.value.trim();
        if (!prompt) {
            showNotification('Please enter a generation prompt', 'error');
            return;
        }

        setLoadingState(true);
        
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('prompt', prompt);

            const response = await fetch('/api/generate', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                resultImage.src = result.imageUrl;
                resultView.style.display = 'block';
                showNotification('Image generated successfully!', 'success');
            } else {
                throw new Error(result.error || 'Generation failed');
            }
        } catch (error) {
            console.error('Generation failed:', error);
            showNotification(error.message || 'Generation failed. Please try again.', 'error');
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(loading) {
        if (loading) {
            processingOverlay.style.display = 'flex';
            generateBtn.disabled = true;
        } else {
            processingOverlay.style.display = 'none';
            generateBtn.disabled = !selectedFile;
        }
    }

    function downloadImage() {
        const link = document.createElement('a');
        link.href = resultImage.src;
        link.download = `figurine-${Date.now()}.jpg`;
        link.click();
    }

    function showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 1001;
            max-width: 300px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        `;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
});