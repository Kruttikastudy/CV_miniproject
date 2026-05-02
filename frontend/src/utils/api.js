/**
 * API utility — sends frames to the FastAPI backend for detection.
 */

const API_BASE = 'http://localhost:8000';

/**
 * Send a base64-encoded image frame to the /detect endpoint.
 * @param {string} base64Image - The base64-encoded image (with or without data URI prefix)
 * @param {string|null} colorName - Optional color name for color detection
 * @returns {Promise<Array>} Array of detection objects
 */
export async function detectObjects(base64Image, colorName = null) {
  try {
    const formData = new FormData();
    formData.append('image_base64', base64Image);
    if (colorName) {
      formData.append('detect_color_name', colorName);
    }

    const response = await fetch(`${API_BASE}/detect`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.detections || [];
  } catch (error) {
    console.error('Detection API error:', error);
    return [];
  }
}

/**
 * Check backend health.
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}
