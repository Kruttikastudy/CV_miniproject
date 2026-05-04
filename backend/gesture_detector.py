"""
Hand Gesture Detection Module (V2 Feature)
Uses MediaPipe Hands for real-time hand tracking and gesture recognition.
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List, Optional, Tuple


# ---------------------------------------------------------------------------
# MediaPipe Hands Setup
# ---------------------------------------------------------------------------

class GestureDetector:
    """Detects hand gestures using MediaPipe Hands."""
    
    def __init__(self, 
                 max_num_hands: int = 2,
                 min_detection_confidence: float = 0.5,
                 min_tracking_confidence: float = 0.5):
        """
        Initialize MediaPipe Hands detector.
        
        Args:
            max_num_hands: Maximum number of hands to detect
            min_detection_confidence: Minimum confidence for hand detection
            min_tracking_confidence: Minimum confidence for hand tracking
        """
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=True,
            max_num_hands=max_num_hands,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
    
    def detect_hands(self, image_bytes: bytes) -> Dict:
        """
        Detect hands and landmarks in an image.
        
        Returns:
            {
                "hands_detected": int,
                "hands": List[{
                    "handedness": "Left" | "Right",
                    "confidence": float,
                    "landmarks": List[{x, y, z}],  # 21 landmarks
                    "gesture": str  # recognized gesture name
                }]
            }
        """
        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            return {"hands_detected": 0, "hands": []}
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.hands.process(rgb_frame)
        
        if not results.multi_hand_landmarks:
            return {"hands_detected": 0, "hands": []}
        
        hands_data = []
        
        for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
            # Get handedness (left/right)
            handedness = results.multi_handedness[idx].classification[0]
            hand_label = handedness.label
            hand_confidence = handedness.score
            
            # Extract landmarks
            landmarks = []
            for landmark in hand_landmarks.landmark:
                landmarks.append({
                    "x": landmark.x,
                    "y": landmark.y,
                    "z": landmark.z
                })
            
            # Recognize gesture
            gesture = self._recognize_gesture(landmarks)
            
            hands_data.append({
                "handedness": hand_label,
                "confidence": round(hand_confidence, 2),
                "landmarks": landmarks,
                "gesture": gesture
            })
        
        return {
            "hands_detected": len(hands_data),
            "hands": hands_data
        }
    
    def _recognize_gesture(self, landmarks: List[Dict]) -> str:
        """
        Recognize hand gesture from landmarks.
        
        MediaPipe Hand Landmarks (21 points):
        0: WRIST
        1-4: THUMB (CMC, MCP, IP, TIP)
        5-8: INDEX (MCP, PIP, DIP, TIP)
        9-12: MIDDLE (MCP, PIP, DIP, TIP)
        13-16: RING (MCP, PIP, DIP, TIP)
        17-20: PINKY (MCP, PIP, DIP, TIP)
        """
        if len(landmarks) != 21:
            return "unknown"
        
        # Helper function to check if finger is extended
        def is_finger_extended(tip_idx: int, pip_idx: int, mcp_idx: int) -> bool:
            tip_y = landmarks[tip_idx]["y"]
            pip_y = landmarks[pip_idx]["y"]
            mcp_y = landmarks[mcp_idx]["y"]
            # Finger is extended if tip is above PIP and PIP is above MCP
            return tip_y < pip_y < mcp_y
        
        def is_thumb_extended(landmarks: List[Dict]) -> bool:
            # Thumb uses x-axis (horizontal) instead of y-axis
            tip_x = landmarks[4]["x"]
            ip_x = landmarks[3]["x"]
            mcp_x = landmarks[2]["x"]
            wrist_x = landmarks[0]["x"]
            
            # Check if thumb is extended away from palm
            if wrist_x < 0.5:  # Right hand
                return tip_x > ip_x > mcp_x
            else:  # Left hand
                return tip_x < ip_x < mcp_x
        
        # Check each finger
        thumb_extended = is_thumb_extended(landmarks)
        index_extended = is_finger_extended(8, 6, 5)
        middle_extended = is_finger_extended(12, 10, 9)
        ring_extended = is_finger_extended(16, 14, 13)
        pinky_extended = is_finger_extended(20, 18, 17)
        
        extended_fingers = [
            thumb_extended,
            index_extended,
            middle_extended,
            ring_extended,
            pinky_extended
        ]
        num_extended = sum(extended_fingers)
        
        # Gesture recognition logic
        
        # Thumbs up: only thumb extended
        if thumb_extended and not any(extended_fingers[1:]):
            return "thumbs_up"
        
        # Peace sign: index and middle extended
        if index_extended and middle_extended and not ring_extended and not pinky_extended:
            return "peace"
        
        # Pointing: only index extended
        if index_extended and not middle_extended and not ring_extended and not pinky_extended:
            return "pointing"
        
        # Fist: no fingers extended
        if num_extended == 0:
            return "fist"
        
        # Open palm: all fingers extended
        if num_extended >= 4:
            return "open_palm"
        
        # Rock sign: index and pinky extended
        if index_extended and pinky_extended and not middle_extended and not ring_extended:
            return "rock"
        
        # OK sign: thumb and index forming circle (approximation)
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        distance = np.sqrt((thumb_tip["x"] - index_tip["x"])**2 + 
                          (thumb_tip["y"] - index_tip["y"])**2)
        if distance < 0.1 and middle_extended and ring_extended and pinky_extended:
            return "ok"
        
        return "unknown"
    
    def __del__(self):
        """Cleanup MediaPipe resources."""
        if hasattr(self, 'hands'):
            self.hands.close()


# ---------------------------------------------------------------------------
# Gesture Matching Functions
# ---------------------------------------------------------------------------

def check_gesture_match(gesture_data: Dict, target_gesture: str) -> bool:
    """
    Check if detected gesture matches the target gesture.
    
    Args:
        gesture_data: Output from GestureDetector.detect_hands()
        target_gesture: Target gesture name (e.g., "thumbs_up", "peace")
    
    Returns:
        True if gesture detected
    """
    if gesture_data["hands_detected"] == 0:
        return False
    
    for hand in gesture_data["hands"]:
        if hand["gesture"] == target_gesture:
            return True
    
    return False


def detect_wave_gesture(gesture_data: Dict, prev_gesture_data: Optional[Dict]) -> bool:
    """
    Detect waving motion by checking hand position changes.
    Requires two consecutive frames with hand data.
    
    Args:
        gesture_data: Current frame gesture data
        prev_gesture_data: Previous frame gesture data
    
    Returns:
        True if waving motion detected
    """
    if not prev_gesture_data or gesture_data["hands_detected"] == 0:
        return False
    
    if prev_gesture_data["hands_detected"] == 0:
        return False
    
    # Get wrist positions (landmark 0)
    current_wrist = gesture_data["hands"][0]["landmarks"][0]
    prev_wrist = prev_gesture_data["hands"][0]["landmarks"][0]
    
    # Calculate horizontal movement
    dx = abs(current_wrist["x"] - prev_wrist["x"])
    
    # If significant horizontal movement, it's a wave
    if dx > 0.1:  # 10% of frame width
        return True
    
    return False


# ---------------------------------------------------------------------------
# Gesture-based Prompt Matching
# ---------------------------------------------------------------------------

GESTURE_PROMPTS = {
    "thumbs_up": ["Give a thumbs up", "Show thumbs up", "Thumbs up"],
    "peace": ["Show a peace sign", "Make a peace sign", "Peace sign"],
    "pointing": ["Point at the camera", "Point with your finger", "Point"],
    "fist": ["Make a fist", "Show a fist", "Clench your fist"],
    "open_palm": ["Show your palm", "Open your hand", "Show an open hand"],
    "rock": ["Make a rock sign", "Show rock and roll", "Rock sign"],
    "ok": ["Make an OK sign", "Show OK gesture", "OK sign"],
}


def get_gesture_name_from_prompt(prompt_text: str) -> Optional[str]:
    """
    Extract gesture name from prompt text.
    
    Args:
        prompt_text: The prompt text (e.g., "Give a thumbs up")
    
    Returns:
        Gesture name (e.g., "thumbs_up") or None
    """
    prompt_lower = prompt_text.lower()
    
    for gesture_name, prompt_variations in GESTURE_PROMPTS.items():
        for variation in prompt_variations:
            if variation.lower() in prompt_lower:
                return gesture_name
    
    return None
