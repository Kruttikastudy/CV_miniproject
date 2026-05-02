"""
YOLOv8 Model Loader and Inference Engine
Handles object detection and color recognition.
"""

import cv2
import numpy as np
from ultralytics import YOLO

# ---------------------------------------------------------------------------
# Singleton model instance
# ---------------------------------------------------------------------------
_model = None


def get_model():
    """Load YOLOv8n once and cache it."""
    global _model
    if _model is None:
        _model = YOLO("yolov8n.pt")  # downloads automatically on first run
    return _model


# ---------------------------------------------------------------------------
# Object Detection
# ---------------------------------------------------------------------------

def detect_objects(image_bytes: bytes, confidence_threshold: float = 0.5):
    """
    Run YOLOv8 inference on a raw image buffer.

    Returns a list of dicts:
        [{"label": str, "confidence": float, "bbox": [x, y, w, h]}, ...]
    """
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return []

    model = get_model()
    results = model(frame, verbose=False)[0]

    detections = []
    for box in results.boxes:
        conf = float(box.conf[0])
        if conf < confidence_threshold:
            continue

        cls_id = int(box.cls[0])
        label = model.names[cls_id]

        # xyxy -> xywh
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        bbox = [int(x1), int(y1), int(x2 - x1), int(y2 - y1)]

        detections.append({
            "label": label,
            "confidence": round(conf, 2),
            "bbox": bbox,
        })

    return detections


# ---------------------------------------------------------------------------
# Color Detection (for "find something red" prompts)
# ---------------------------------------------------------------------------

# HSV ranges for common colours
COLOR_RANGES = {
    "red":    [( (0, 100, 100),   (10, 255, 255)),
               ((160, 100, 100), (180, 255, 255))],
    "blue":   [((100, 100, 100), (130, 255, 255))],
    "green":  [((35, 100, 100),  (85, 255, 255))],
    "yellow": [((20, 100, 100),  (35, 255, 255))],
    "orange": [((10, 100, 100),  (20, 255, 255))],
    "purple": [((130, 100, 100), (160, 255, 255))],
    "pink":   [((140, 50, 100),  (170, 255, 255))],
    "white":  [((0, 0, 200),     (180, 30, 255))],
    "black":  [((0, 0, 0),       (180, 255, 50))],
}


def detect_color(image_bytes: bytes, color_name: str, min_area: int = 5000):
    """
    Detect whether a given colour occupies a significant region of the frame.

    Returns a list with at most one detection dict if the colour is found.
    """
    color_name = color_name.lower()
    if color_name not in COLOR_RANGES:
        return []

    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return []

    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

    # Combine masks for all sub-ranges (e.g. red wraps around 0/180)
    combined_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for lower, upper in COLOR_RANGES[color_name]:
        mask = cv2.inRange(hsv, np.array(lower), np.array(upper))
        combined_mask = cv2.bitwise_or(combined_mask, mask)

    # Morphological cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_CLOSE, kernel)
    combined_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(
        combined_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    results = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area:
            continue
        x, y, w, h = cv2.boundingRect(cnt)
        results.append({
            "label": f"{color_name} object",
            "confidence": round(min(area / 30000, 0.99), 2),
            "bbox": [x, y, w, h],
        })

    # Return only the largest region
    if results:
        results.sort(key=lambda d: d["bbox"][2] * d["bbox"][3], reverse=True)
        return [results[0]]
    return []
