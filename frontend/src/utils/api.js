/**
 * API utility — sends frames to the FastAPI backend for detection.
 * V2: Enhanced to support motion, gesture, and multi-object detection
 */

const API_BASE = 'http://localhost:8000';

/**
 * Send a base64-encoded image frame to the /detect endpoint.
 * @param {string} base64Image - The base64-encoded image (with or without data URI prefix)
 * @param {string|null} colorName - Optional color name for color detection
 * @param {object} prompt - Optional prompt object to determine which V2 features to enable
 * @returns {Promise<object>} Detection result with detections and optional V2 data
 */
export async function detectObjects(base64Image, colorName = null, prompt = null) {
  try {
    const formData = new FormData();
    formData.append('image_base64', base64Image);
    if (colorName) {
      formData.append('detect_color_name', colorName);
    }

    // ===== V2: Enable features based on prompt type =====
    if (prompt) {
      const promptType = prompt.type;
      
      if (promptType === 'gesture') {
        formData.append('enable_gestures', 'true');
      } else if (promptType === 'motion') {
        formData.append('enable_motion', 'true');
        formData.append('enable_tracking', 'true');
      } else if (promptType === 'multi_object') {
        formData.append('enable_multi_object', 'true');
      }
    }

    const response = await fetch(`${API_BASE}/detect`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Return full response for V2 features, or just detections for backward compatibility
    return data;
  } catch (error) {
    console.error('Detection API error:', error);
    return { detections: [] };
  }
}

/**
 * Reset motion detector and object tracker state.
 * Call this when starting a new round or switching players.
 */
export async function resetTrackers() {
  try {
    const response = await fetch(`${API_BASE}/reset_trackers`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    console.error('Reset trackers error:', error);
    return false;
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
