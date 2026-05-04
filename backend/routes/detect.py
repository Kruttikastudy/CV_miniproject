"""
Detection endpoint — receives an image frame and returns YOLO + color detections.

V2 FEATURES: Motion tracking, gesture detection, multi-object analysis
"""

import base64
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

from model import (
    detect_objects, 
    detect_color,
    # ===== V2 imports =====
    get_motion_detector,
    get_object_tracker,
    get_gesture_detector
)
# ===== V2 imports =====
from multi_object import analyze_scene
import cv2
import numpy as np

router = APIRouter()


@router.post("/detect")
async def detect(
    image: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    detect_color_name: Optional[str] = Form(None),
    # ===== V2: New optional parameters =====
    enable_motion: Optional[bool] = Form(False),
    enable_tracking: Optional[bool] = Form(False),
    enable_gestures: Optional[bool] = Form(False),
    enable_multi_object: Optional[bool] = Form(False),
):
    """
    Accept an image (file upload or base64) and return detections.
    
    V2 Parameters:
        enable_motion: Enable motion detection
        enable_tracking: Enable object tracking across frames
        enable_gestures: Enable hand gesture detection
        enable_multi_object: Enable multi-object relationship analysis
    
    Original params:
        detect_color_name: if set, also run color detection for this color.
    """
    # --- Resolve image bytes ---
    if image is not None:
        image_bytes = await image.read()
    elif image_base64 is not None:
        # Strip data URI prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        image_bytes = base64.b64decode(image_base64)
    else:
        return {"detections": [], "error": "No image provided"}

    # --- Run YOLO detection ---
    object_detections = detect_objects(image_bytes)

    # --- Optionally run color detection ---
    color_detections = []
    if detect_color_name:
        color_detections = detect_color(image_bytes, detect_color_name)

    all_detections = object_detections + color_detections
    
    # ===== DEBUG: Log detection count =====
    print(f"🔍 Detections: {len(all_detections)} objects | Motion: {enable_motion} | Tracking: {enable_tracking} | Gestures: {enable_gestures}")

    # ===== V2: Build response with optional features =====
    response = {"detections": all_detections}
    
    # --- Motion Detection ---
    if enable_motion:
        motion_detector = get_motion_detector()
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is not None:
            motion_data = motion_detector.detect_motion(frame)
            response["motion_data"] = motion_data
    
    # --- Object Tracking ---
    if enable_tracking:
        tracker = get_object_tracker()
        # Decode frame for YOLO tracking
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        # Pass frame to tracker for YOLO-based tracking
        tracking_result = tracker.update(all_detections, frame=frame)
        response["tracking_data"] = tracking_result
    
    # --- Gesture Detection ---
    if enable_gestures:
        gesture_detector = get_gesture_detector()
        gesture_data = gesture_detector.detect_hands(image_bytes)
        response["gesture_data"] = gesture_data
    
    # --- Multi-Object Analysis ---
    if enable_multi_object:
        scene_analysis = analyze_scene(all_detections)
        response["multi_object_analysis"] = scene_analysis

    return response


# ===== V2: Reset endpoint for motion detector and tracker =====
@router.post("/reset_trackers")
async def reset_trackers():
    """
    Reset motion detector and object tracker state.
    Useful when starting a new game round or switching players.
    """
    motion_detector = get_motion_detector()
    tracker = get_object_tracker()
    
    motion_detector.reset()
    tracker.reset()
    
    return {"status": "trackers_reset"}
