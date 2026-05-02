"""
Detection endpoint — receives an image frame and returns YOLO + color detections.
"""

import base64
from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

from model import detect_objects, detect_color

router = APIRouter()


@router.post("/detect")
async def detect(
    image: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None),
    detect_color_name: Optional[str] = Form(None),
):
    """
    Accept an image (file upload or base64) and return detections.

    Query params:
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

    return {"detections": all_detections}
