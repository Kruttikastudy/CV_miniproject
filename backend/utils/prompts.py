"""
Prompt generation and matching logic for the game.

V2 FEATURES: Motion, gesture, and multi-object prompts
"""

import random

# ---------------------------------------------------------------------------
# Prompt definitions
# Each prompt has a display text, a type, and a target value.
# Types: "object" (YOLO label), "color" (HSV detection)
# ---------------------------------------------------------------------------

EASY_PROMPTS = [
    {"text": "Find a bottle", "type": "object", "target": "bottle"},
    {"text": "Find a cell phone", "type": "object", "target": "cell phone"},
    {"text": "Find a chair", "type": "object", "target": "chair"},
    {"text": "Find a keyboard", "type": "object", "target": "keyboard"},
    {"text": "Find a mouse", "type": "object", "target": "mouse"},
    {"text": "Find a laptop", "type": "object", "target": "laptop"},
    {"text": "Find a remote", "type": "object", "target": "remote"},
    {"text": "Find a clock", "type": "object", "target": "clock"},
    {"text": "Find a scissors", "type": "object", "target": "scissors"},
    {"text": "Find a tv", "type": "object", "target": "tv"},
    {"text": "Find a spoon", "type": "object", "target": "spoon"},
    {"text": "Find a fork", "type": "object", "target": "fork"},
    {"text": "Find a banana", "type": "object", "target": "banana"},
    {"text": "Find a apple", "type": "object", "target": "apple"}
]

HARD_PROMPTS = [
    {"text": "Find something red", "type": "color", "target": "red"},
    {"text": "Find something blue", "type": "color", "target": "blue"},
    {"text": "Find something green", "type": "color", "target": "green"},
    {"text": "Find something yellow", "type": "color", "target": "yellow"},
    {"text": "Find something orange", "type": "color", "target": "orange"},
    {"text": "Find something purple", "type": "color", "target": "purple"},
    {"text": "Find something pink", "type": "color", "target": "pink"},
    {"text": "Find something white", "type": "color", "target": "white"},
    {"text": "Find a tie", "type": "object", "target": "tie"},
    {"text": "Find a suitcase", "type": "object", "target": "suitcase"},
    {"text": "Find a vase", "type": "object", "target": "vase"},
    {"text": "Find a teddy bear", "type": "object", "target": "teddy bear"},
    {"text": "Find a toothbrush", "type": "object", "target": "toothbrush"},
]


# ===== V2 FEATURES: New Prompt Types =====

# Motion-based prompts
MOTION_PROMPTS = [
    {"text": "Wave your hand", "type": "gesture", "target": "wave"},
    {"text": "Move a bottle from left to right", "type": "motion", "target": "leftright", "object": "bottle"},
    {"text": "Show me something moving", "type": "motion", "target": "any_movement"},
]

# Gesture prompts
GESTURE_PROMPTS = [
    {"text": "Give a thumbs up", "type": "gesture", "target": "thumbs_up"},
    {"text": "Show a peace sign", "type": "gesture", "target": "peace"},
    {"text": "Point at the camera", "type": "gesture", "target": "pointing"},
    {"text": "Make a fist", "type": "gesture", "target": "fist"},
    {"text": "Show your open palm", "type": "gesture", "target": "open_palm"},
    {"text": "Make a rock sign", "type": "gesture", "target": "rock"},
]

# Multi-object prompts
MULTI_OBJECT_PROMPTS = [
    {"text": "Show me 2 bottles", "type": "multi_object", "target": "count", "object": "bottle", "count": 2},
    {"text": "Show me 2 cell phones", "type": "multi_object", "target": "count", "object": "cell phone", "count": 2},
    {"text": "Place a laptop next to a phone", "type": "multi_object", "target": "proximity", "object1": "laptop", "object2": "cell phone"},
    {"text": "Place a bottle next to a phone", "type": "multi_object", "target": "proximity", "object1": "bottle", "object2": "cell phone"},
    {"text": "Place a bottle next to a laptop", "type": "multi_object", "target": "proximity", "object1": "bottle", "object2": "laptop"},
    {"text": "Show something bigger than your phone", "type": "multi_object", "target": "size_compare", "reference": "cell phone"},
]


def get_random_prompt(difficulty: str = "easy", exclude: list = None):
    """
    Return a random prompt dict, optionally excluding already-used prompts.
    difficulty: "easy" | "hard" | "mixed" | "extreme"
    
    V2: Added "extreme" difficulty mode with motion, gesture, and multi-object prompts
    """
    if exclude is None:
        exclude = []

    # ===== V2: EXTREME mode includes all V2 features =====
    if difficulty == "extreme":
        pool = MOTION_PROMPTS + GESTURE_PROMPTS + MULTI_OBJECT_PROMPTS
    # ===== Original difficulty modes =====
    elif difficulty == "easy":
        pool = EASY_PROMPTS
    elif difficulty == "hard":
        pool = HARD_PROMPTS
    else:  # mixed
        pool = EASY_PROMPTS + HARD_PROMPTS

    available = [p for p in pool if p["text"] not in exclude]
    if not available:
        available = pool  # reset if exhausted

    return random.choice(available)


def check_match(prompt: dict, detections: list) -> bool:
    """
    Check whether any detection satisfies the prompt requirement.
    
    V2: Extended to support motion, gesture, and multi-object prompts
    """
    if prompt["type"] == "object":
        target_label = prompt["target"].lower()
        for det in detections:
            if det["label"].lower() == target_label:
                return True
    elif prompt["type"] == "color":
        # Color detections have labels like "red object"
        target_color = prompt["target"].lower()
        for det in detections:
            if target_color in det["label"].lower():
                return True
    return False


# ===== V2: New matching functions for advanced prompts =====

def check_match_v2(prompt: dict, detection_result: dict) -> bool:
    """
    Enhanced matching function for V2 features.
    
    Args:
        prompt: Prompt dict with type and target
        detection_result: Full detection result from /detect endpoint including:
            - detections: list of object detections
            - motion_data: motion detection results (optional)
            - gesture_data: gesture detection results (optional)
            - tracking_data: object tracking results (optional)
            - multi_object_analysis: multi-object analysis (optional)
    
    Returns:
        True if prompt requirements are satisfied
    """
    prompt_type = prompt["type"]
    
    # Original types (backward compatible)
    if prompt_type in ["object", "color"]:
        return check_match(prompt, detection_result.get("detections", []))
    
    # ===== V2: Motion prompts =====
    elif prompt_type == "motion":
        target = prompt["target"]
        tracking_data = detection_result.get("tracking_data", {})
        movements = tracking_data.get("movements", [])
        
        if target == "any_movement":
            # Check if any object is moving
            return any(m.get("is_moving", False) for m in movements)
        
        elif target == "leftright":
            # Check if bottle moved left to right
            from motion_tracker import detect_object_movement_leftright

            tracked_objects = tracking_data.get("tracked_objects", {})

            return detect_object_movement_leftright(tracked_objects)
    
    # ===== V2: Gesture prompts =====
    elif prompt_type == "gesture":
        target = prompt["target"]
        gesture_data = detection_result.get("gesture_data", {})
        
        if target == "wave":
            # Wave detection handled separately with frame history
            return gesture_data.get("wave_detected", False)
        else:
            # Check for specific gesture
            from gesture_detector import check_gesture_match
            return check_gesture_match(gesture_data, target)
    
    # ===== V2: Multi-object prompts =====
    elif prompt_type == "multi_object":
        target = prompt["target"]
        detections = detection_result.get("detections", [])
        
        if target == "count":
            # Check object count
            from multi_object import check_object_count
            return check_object_count(detections, prompt["object"], prompt["count"])
        
        elif target == "proximity":
            # Check if two objects are close
            from multi_object import check_objects_proximity
            return check_objects_proximity(detections, prompt["object1"], prompt["object2"])
        
        elif target == "size_compare":
            # Check if something is bigger than reference (phone)
            from multi_object import calculate_bbox_area
            reference_label = prompt["reference"].lower()
            
            # Find reference object (phone - should be the smaller object)
            ref_obj = next((d for d in detections if d["label"].lower() == reference_label), None)
            if not ref_obj:
                return False
            
            ref_area = calculate_bbox_area(ref_obj["bbox"])
            
            # Find objects that are neither a person nor the reference object (phone)
            other_objects = [d for d in detections 
                            if d["label"].lower() != "person" 
                            and d["label"].lower() != reference_label]
            if not other_objects:
                return False
            
            largest_obj = max(other_objects, key=lambda d: calculate_bbox_area(d["bbox"]))
            largest_area = calculate_bbox_area(largest_obj["bbox"])
            
            # Ensure the largest object is bigger than the phone (reference)
            if largest_area > ref_area:
                return True
            return False
    
    return False
