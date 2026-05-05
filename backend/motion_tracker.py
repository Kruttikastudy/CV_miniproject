"""
Motion Detection & Object Tracking Module (V2 Feature)
Handles frame differencing, optical flow, and object trajectory tracking.
Uses YOLO's built-in tracking (BoT-SORT) for robust object tracking.
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
from collections import deque
from ultralytics import YOLO


# ---------------------------------------------------------------------------
# Motion Detection using Frame Differencing
# ---------------------------------------------------------------------------

class MotionDetector:
    def __init__(self, min_area: int = 500):
        self.min_area = min_area
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500,
            varThreshold=50,
            detectShadows=True
        )

    def detect_motion(self, frame: np.ndarray) -> Dict:
        frame = cv2.GaussianBlur(frame, (5, 5), 0)

        fg_mask = self.bg_subtractor.apply(frame)

        kernel = np.ones((5, 5), np.uint8)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        fg_mask = cv2.dilate(fg_mask, None, iterations=2)

        contours, _ = cv2.findContours(
            fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        motion_regions = []

        for contour in contours:
            area = cv2.contourArea(contour)

            if area < self.min_area or area > frame.shape[0]*frame.shape[1]*0.5:
                continue

            x, y, w, h = cv2.boundingRect(contour)
            motion_regions.append([int(x), int(y), int(w), int(h)])

        motion_pixels = cv2.countNonZero(fg_mask)
        motion_percentage = (motion_pixels / (frame.shape[0]*frame.shape[1])) * 100

        if motion_percentage > 80:
            return {
                "motion_detected": False,
                "motion_percentage": 0.0,
                "motion_regions": []
            }

        return {
            "motion_detected": bool(len(motion_regions) > 0),
            "motion_percentage": float(round(motion_percentage, 2)),
            "motion_regions": motion_regions
        }

    def reset(self):
        """Reset background model."""
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500,
            varThreshold=50,
            detectShadows=True
        )


# ---------------------------------------------------------------------------
# Object Trajectory Tracking (Using YOLO's Built-in Tracking)
# ---------------------------------------------------------------------------

class ObjectTracker:
    """Tracks object movement across frames using YOLO's built-in BoT-SORT tracker."""
    
    def __init__(self, max_history: int = 30, model_path: str = "yolov8n.pt"):
        self.trajectories = {}  # {track_id: deque of centroids}
        self.object_labels = {}  # {track_id: label}
        self.max_history = max_history
        self.model = YOLO(model_path)
        self.frame_buffer = None  # Store last frame for tracking
    
    def _get_centroid(self, bbox: List[int]) -> Tuple[int, int]:
        """Calculate centroid from bounding box [x, y, w, h]."""
        x, y, w, h = bbox
        return (int(x + w / 2), int(y + h / 2))
    
    def update(self, detections: List[Dict], frame: Optional[np.ndarray] = None) -> Dict:
        """
        Update tracker with new detections using YOLO tracking.
        
        Args:
            detections: List of detection dicts with 'bbox' and 'label' (can be from YOLO)
            frame: Optional frame for YOLO tracking (if None, uses detection-only mode)
        
        Returns:
            {
                "tracked_objects": {track_id: {label, centroid, trajectory}},
                "movements": List of movement analysis
            }
        """
        # If frame is provided, use YOLO's built-in tracking
        if frame is not None:
            return self._update_with_yolo_tracking(frame)
        
        # Fallback: detection-only mode (backward compatible)
        return self._update_from_detections(detections)
    
    def _update_with_yolo_tracking(self, frame: np.ndarray) -> Dict:
        """Use YOLO's built-in tracking on the frame."""
        # Run YOLO tracking (persist=True maintains track IDs across frames)
        try:
            results = self.model.track(frame, persist=True, verbose=False, conf=0.5)
        except Exception as e:
            print("Tracking error:", e)
            return {"tracked_objects": {}, "movements": []}
        
        if len(results) == 0 or results[0].boxes is None:
            return {"tracked_objects": {}, "movements": []}
        
        boxes = results[0].boxes
        
        # Update trajectories with tracked objects
        for box in boxes:
            if box.id is None:
                continue
            
            track_id = int(box.id[0])
            cls_id = int(box.cls[0])
            label = self.model.names[cls_id]
            
            # Get bbox in xywh format
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            bbox = [int(x1), int(y1), int(x2 - x1), int(y2 - y1)]
            centroid = self._get_centroid(bbox)
            
            # Store label
            self.object_labels[track_id] = label
            
            # Update trajectory
            if track_id not in self.trajectories:
                self.trajectories[track_id] = deque([centroid], maxlen=self.max_history)
            else:
                self.trajectories[track_id].append(centroid)
        
        # Analyze movements
        movements = self._analyze_movements()
        
        return {
            "tracked_objects": self._get_tracked_objects_info(),
            "movements": movements
        }
    
    def _update_from_detections(self, detections: List[Dict]) -> Dict:
        """Fallback mode: Update from detection list (backward compatible)."""
        if len(detections) == 0:
            return {"tracked_objects": {}, "movements": []}
        
        # Simple approach: use detection index as pseudo track_id
        # This won't persist across frames but maintains API compatibility
        for idx, det in enumerate(detections):
            centroid = self._get_centroid(det["bbox"])
            track_id = idx
            
            self.object_labels[track_id] = det["label"]
            
            if track_id not in self.trajectories:
                self.trajectories[track_id] = deque([centroid], maxlen=self.max_history)
            else:
                self.trajectories[track_id].append(centroid)
        
        movements = self._analyze_movements()
        
        return {
            "tracked_objects": self._get_tracked_objects_info(),
            "movements": movements
        }
    
    def _get_tracked_objects_info(self) -> Dict:
        """Get information about all tracked objects."""
        info = {}
        for track_id, trajectory in self.trajectories.items():
            trajectory_list = list(trajectory)
            label = self.object_labels.get(track_id, "unknown")
            
            info[track_id] = {
                "label": label,
                "centroid": trajectory_list[-1] if trajectory_list else (0, 0),
                "trajectory": trajectory_list,
                "trajectory_length": len(trajectory_list)
            }
        return info
    
    def _analyze_movements(self) -> List[Dict]:
        """Analyze movement patterns of tracked objects."""
        movements = []
        
        for track_id, trajectory in self.trajectories.items():
            if len(trajectory) < 5:  # Need at least 5 points
                continue
            
            trajectory_list = list(trajectory)
            start = trajectory_list[0]
            end = trajectory_list[-1]
            
            # Calculate displacement
            dx = end[0] - start[0]
            dy = end[1] - start[1]
            distance = float(np.sqrt(dx**2 + dy**2))
            
            # Determine direction
            direction = "stationary"
            if distance > 50:  # Minimum movement threshold
                angle = np.arctan2(dy, dx) * 180 / np.pi
                if -45 <= angle < 45:
                    direction = "right"
                elif 45 <= angle < 135:
                    direction = "down"
                elif -135 <= angle < -45:
                    direction = "up"
                else:
                    direction = "left"
            
            # Calculate speed (pixels per frame)
            total_distance = 0
            for i in range(1, len(trajectory_list)):
                p1 = trajectory_list[i-1]
                p2 = trajectory_list[i]
                total_distance += np.sqrt((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)
            
            avg_speed = float(total_distance / len(trajectory_list)) if len(trajectory_list) > 1 else 0.0
            
            label = self.object_labels.get(track_id, "unknown")
            
            movements.append({
                "object_id": track_id,
                "label": label,
                "direction": direction,
                "distance": round(distance, 2),
                "speed": round(avg_speed, 2),
                "is_moving": distance > 50
            })
        
        return movements
    
    def reset(self):
        """Reset the tracker state."""
        self.trajectories = {}
        self.object_labels = {}
        # Reset YOLO tracker    
        self.model.predictor = None
        """Reset background model."""
        self.bg_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=500,
            varThreshold=50,
            detectShadows=True
        )


# ---------------------------------------------------------------------------
# Hand Wave Detection (using motion in upper frame region)
# ---------------------------------------------------------------------------

def detect_hand_wave(motion_data: Dict, frame_shape: Tuple[int, int]) -> bool:
    """
    Detect hand waving motion in the upper portion of the frame.
    
    Args:
        motion_data: Output from MotionDetector.detect_motion()
        frame_shape: (height, width) of the frame
    
    Returns:
        True if hand wave detected
    """
    if not motion_data["motion_detected"]:
        return False
    
    height, width = frame_shape[:2]
    upper_third = height // 3
    
    # Check if motion is in upper portion of frame
    for region in motion_data["motion_regions"]:
        x, y, w, h = region
        # Check if region is in upper third and has reasonable size for hand
        if y < upper_third and 1000 < (w * h) < 50000:
            return True
    
    return False


# ---------------------------------------------------------------------------
# Movement Direction Detection
# ---------------------------------------------------------------------------

def detect_directional_movement(movements: List[Dict], target_direction: str) -> bool:
    """
    Check if any tracked object is moving in the target direction.
    
    Args:
        movements: List of movement dicts from ObjectTracker
        target_direction: "left", "right", "up", "down"
    
    Returns:
        True if movement in target direction detected
    """
    for movement in movements:
        if movement["is_moving"] and movement["direction"] == target_direction:
            return True
    return False


def detect_object_movement_leftright(movements: List[Dict], min_distance: float = 100) -> bool:
    """
    Detect if an object has moved significantly from left to right.
    
    Args:
        movements: List of movement dicts from ObjectTracker
        min_distance: Minimum horizontal distance to consider as "left to right"
    
    Returns:
        True if left-to-right movement detected
    """
    for movement in movements:
        if movement["direction"] == "right" and movement["distance"] >= min_distance:
            return True
    return False
