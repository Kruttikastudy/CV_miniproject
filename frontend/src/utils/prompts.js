/**
 * Prompt definitions and matching logic for the frontend.
 * Mirrors the backend prompts.py for prompt generation.
 * V2: Added motion, gesture, and multi-object prompts
 */

const EASY_PROMPTS = [
  { text: "Find a bottle", type: "object", target: "bottle" },
  { text: "Find a cell phone", type: "object", target: "cell phone" },
  { text: "Find a chair", type: "object", target: "chair" },
  { text: "Find a keyboard", type: "object", target: "keyboard" },
  { text: "Find a mouse", type: "object", target: "mouse" },
  { text: "Find a laptop", type: "object", target: "laptop" },
  { text: "Find a remote", type: "object", target: "remote" },
  { text: "Find a backpack", type: "object", target: "backpack" },
  { text: "Find a clock", type: "object", target: "clock" },
  { text: "Find a scissors", type: "object", target: "scissors" },
  { text: "Find a TV", type: "object", target: "tv" },
  { text: "Find a spoon", type: "object", target: "spoon" },
  { text: "Find a fork", type: "object", target: "fork" },
  { text: "Find a knife", type: "object", target: "knife" },
  { text: "Find a banana", type: "object", target: "banana" },
  { text: "Find an apple", type: "object", target: "apple" },
];

const HARD_PROMPTS = [
  { text: "Find something red", type: "color", target: "red" },
  { text: "Find something blue", type: "color", target: "blue" },
  { text: "Find something green", type: "color", target: "green" },
  { text: "Find something yellow", type: "color", target: "yellow" },
  { text: "Find something orange", type: "color", target: "orange" },
  { text: "Find something purple", type: "color", target: "purple" },
  { text: "Find something pink", type: "color", target: "pink" },
  { text: "Find something white", type: "color", target: "white" },
  { text: "Find a tie", type: "object", target: "tie" },
  { text: "Find a suitcase", type: "object", target: "suitcase" },
  { text: "Find a vase", type: "object", target: "vase" },
  { text: "Find a teddy bear", type: "object", target: "teddy bear" },
  { text: "Find a toothbrush", type: "object", target: "toothbrush" },
];

// ===== V2 FEATURES: New Prompt Types =====

const MOTION_PROMPTS = [
  { text: "Wave your hand", type: "gesture", target: "wave" },
  { text: "Move a bottle from left to right", type: "motion", target: "leftright", object: "bottle" },
  { text: "Show me something moving", type: "motion", target: "any_movement" },
];

const GESTURE_PROMPTS = [
  { text: "Give a thumbs up", type: "gesture", target: "thumbs_up" },
  { text: "Show a peace sign", type: "gesture", target: "peace" },
  { text: "Point at the camera", type: "gesture", target: "pointing" },
  { text: "Make a fist", type: "gesture", target: "fist" },
  { text: "Show your open palm", type: "gesture", target: "open_palm" },
  { text: "Make a rock sign", type: "gesture", target: "rock" },
];

const MULTI_OBJECT_PROMPTS = [
  { text: "Show me 2 bottles", type: "multi_object", target: "count", object: "bottle", count: 2 },
  { text: "Show me 2 cell phones", type: "multi_object", target: "count", object: "cell phone", count: 2 },
  { text: "Place a laptop next to a phone", type: "multi_object", target: "proximity", object1: "laptop", object2: "cell phone" },
  { text: "Place a bottle next to a phone", type: "multi_object", target: "proximity", object1: "bottle", object2: "cell phone" },
  { text: "Place a bottle next to a laptop", type: "multi_object", target: "proximity", object1: "bottle", object2: "laptop" },
  { text: "Show something bigger than your phone", type: "multi_object", target: "size_compare", reference: "cell phone" },
];

/**
 * Get a random prompt, avoiding recently used ones.
 * V2: Added support for "extreme" difficulty
 */
export function getRandomPrompt(difficulty = 'easy', exclude = []) {
  let pool;
  
  // ===== V2: EXTREME mode includes all V2 features =====
  if (difficulty === 'extreme') {
    pool = [...MOTION_PROMPTS, ...GESTURE_PROMPTS, ...MULTI_OBJECT_PROMPTS];
  } else if (difficulty === 'easy') {
    pool = EASY_PROMPTS;
  } else if (difficulty === 'hard') {
    pool = HARD_PROMPTS;
  } else {
    // mixed
    pool = [...EASY_PROMPTS, ...HARD_PROMPTS];
  }

  const available = pool.filter(p => !exclude.includes(p.text));
  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
}

/**
 * Check if any detection matches the current prompt.
 */
export function checkMatch(prompt, detections) {
  if (!prompt || !detections || detections.length === 0) return false;

  if (prompt.type === 'object') {
    const target = prompt.target.toLowerCase();
    return detections.some(d => d.label.toLowerCase() === target);
  }

  if (prompt.type === 'color') {
    const targetColor = prompt.target.toLowerCase();
    return detections.some(d => d.label.toLowerCase().includes(targetColor));
  }

  return false;
}

/**
 * V2: Enhanced matching function for motion, gesture, and multi-object prompts.
 * @param {object} prompt - The prompt object
 * @param {object} detectionResult - Full detection result from API (includes V2 data)
 * @returns {boolean} True if prompt requirements are satisfied
 */
export function checkMatchV2(prompt, detectionResult) {
  if (!prompt || !detectionResult) return false;

  const promptType = prompt.type;
  
  // Original types (backward compatible)
  if (promptType === 'object' || promptType === 'color') {
    return checkMatch(prompt, detectionResult.detections || []);
  }
  
  // ===== V2: Motion prompts =====
  if (promptType === 'motion') {
    const target = prompt.target;
    const trackingData = detectionResult.tracking_data || {};
    const movements = trackingData.movements || [];
    
    if (target === 'any_movement') {
      // Check if any object is moving
      return movements.some(m => m.is_moving);
    }
    
    if (target === 'leftright') {
      // Check if any object moved left to right (distance > 100)
      return movements.some(m => m.direction === 'right' && m.distance >= 100);
    }
  }
  
  // ===== V2: Gesture prompts =====
  if (promptType === 'gesture') {
    const target = prompt.target;
    const gestureData = detectionResult.gesture_data || {};
    
    if (target === 'wave') {
      // Wave detection (would need frame history, simplified here)
      return gestureData.hands_detected > 0;
    } else {
      // Check for specific gesture
      const hands = gestureData.hands || [];
      return hands.some(h => h.gesture === target);
    }
  }
  
  // ===== V2: Multi-object prompts =====
  if (promptType === 'multi_object') {
    const target = prompt.target;
    const detections = detectionResult.detections || [];
    const multiObjectAnalysis = detectionResult.multi_object_analysis || {};
    
    if (target === 'count') {
      // Check object count
      const objectCounts = multiObjectAnalysis.object_counts || {};
      const count = objectCounts[prompt.object] || 0;
      return count >= prompt.count;
    }
    
    if (target === 'proximity') {
      // Check if two objects are close
      const nearbyPairs = multiObjectAnalysis.nearby_pairs || [];
      return nearbyPairs.some(pair => 
        (pair.object1 === prompt.object1 && pair.object2 === prompt.object2) ||
        (pair.object1 === prompt.object2 && pair.object2 === prompt.object1)
      );
    }
    
    if (target === 'size_compare') {
      // Check if any object is bigger than reference
      const referenceLabel = prompt.reference.toLowerCase();
      const refObj = detections.find(d => d.label.toLowerCase() === referenceLabel);
      
      if (!refObj) return false;
      
      const refArea = refObj.bbox[2] * refObj.bbox[3]; // width * height
      
      // Check if any other object is bigger
      return detections.some(det => {
        if (det.label.toLowerCase() === referenceLabel) return false;
        const area = det.bbox[2] * det.bbox[3];
        return area > refArea;
      });
    }
  }
  
  return false;
}

/**
 * Get the color name from a prompt (for color-type prompts).
 */
export function getColorFromPrompt(prompt) {
  if (prompt && prompt.type === 'color') {
    return prompt.target;
  }
  return null;
}
