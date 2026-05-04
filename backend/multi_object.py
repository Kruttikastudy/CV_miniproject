"""
Multi-Object Relationship Detection Module (V2 Feature)
Handles counting, proximity, size comparison, and spatial relationships.
"""

import numpy as np
from typing import List, Dict, Tuple, Optional


# ---------------------------------------------------------------------------
# Object Counting
# ---------------------------------------------------------------------------

def count_objects_by_label(detections: List[Dict], target_label: str) -> int:
    """
    Count how many objects of a specific label are detected.
    
    Args:
        detections: List of detection dicts with 'label' field
        target_label: Target object label (e.g., "bottle")
    
    Returns:
        Count of objects matching the label
    """
    target_label = target_label.lower()
    count = 0
    
    for det in detections:
        if det["label"].lower() == target_label:
            count += 1
    
    return count


def check_object_count(detections: List[Dict], target_label: str, required_count: int) -> bool:
    """
    Check if exactly N objects of a specific type are present.
    
    Args:
        detections: List of detection dicts
        target_label: Target object label
        required_count: Required number of objects
    
    Returns:
        True if count matches
    """
    actual_count = count_objects_by_label(detections, target_label)
    return actual_count >= required_count


# ---------------------------------------------------------------------------
# Proximity Detection
# ---------------------------------------------------------------------------

def calculate_bbox_distance(bbox1: List[int], bbox2: List[int]) -> float:
    """
    Calculate distance between centers of two bounding boxes.
    
    Args:
        bbox1, bbox2: Bounding boxes in format [x, y, w, h]
    
    Returns:
        Euclidean distance between centers
    """
    x1, y1, w1, h1 = bbox1
    x2, y2, w2, h2 = bbox2
    
    center1 = (x1 + w1/2, y1 + h1/2)
    center2 = (x2 + w2/2, y2 + h2/2)
    
    distance = np.sqrt((center2[0] - center1[0])**2 + (center2[1] - center1[1])**2)
    return distance


def check_objects_proximity(detections: List[Dict], 
                           label1: str, 
                           label2: str, 
                           max_distance: float = 200) -> bool:
    """
    Check if two specific objects are close to each other.
    
    Args:
        detections: List of detection dicts
        label1, label2: Labels of objects to check
        max_distance: Maximum distance in pixels to consider "close"
    
    Returns:
        True if objects are within max_distance
    """
    label1 = label1.lower()
    label2 = label2.lower()
    
    # Find all objects of each type
    objects1 = [det for det in detections if det["label"].lower() == label1]
    objects2 = [det for det in detections if det["label"].lower() == label2]
    
    if not objects1 or not objects2:
        return False
    
    # Check all pairs
    for obj1 in objects1:
        for obj2 in objects2:
            distance = calculate_bbox_distance(obj1["bbox"], obj2["bbox"])
            if distance <= max_distance:
                return True
    
    return False


def find_nearby_objects(detections: List[Dict], max_distance: float = 200) -> List[Dict]:
    """
    Find all pairs of objects that are close to each other.
    
    Args:
        detections: List of detection dicts
        max_distance: Maximum distance to consider "nearby"
    
    Returns:
        List of dicts: [{"object1": label, "object2": label, "distance": float}]
    """
    nearby_pairs = []
    
    for i in range(len(detections)):
        for j in range(i + 1, len(detections)):
            obj1 = detections[i]
            obj2 = detections[j]
            
            distance = calculate_bbox_distance(obj1["bbox"], obj2["bbox"])
            
            if distance <= max_distance:
                nearby_pairs.append({
                    "object1": obj1["label"],
                    "object2": obj2["label"],
                    "distance": round(distance, 2)
                })
    
    return nearby_pairs


# ---------------------------------------------------------------------------
# Size Comparison
# ---------------------------------------------------------------------------

def calculate_bbox_area(bbox: List[int]) -> int:
    """Calculate area of a bounding box."""
    x, y, w, h = bbox
    return w * h


def compare_object_sizes(detections: List[Dict], 
                        label1: str, 
                        label2: str) -> Optional[str]:
    """
    Compare sizes of two objects.
    
    Args:
        detections: List of detection dicts
        label1, label2: Labels of objects to compare
    
    Returns:
        "label1_bigger", "label2_bigger", "similar", or None if objects not found
    """
    label1 = label1.lower()
    label2 = label2.lower()
    
    # Find objects
    obj1 = next((det for det in detections if det["label"].lower() == label1), None)
    obj2 = next((det for det in detections if det["label"].lower() == label2), None)
    
    if not obj1 or not obj2:
        return None
    
    area1 = calculate_bbox_area(obj1["bbox"])
    area2 = calculate_bbox_area(obj2["bbox"])
    
    # Consider similar if within 20% difference
    ratio = max(area1, area2) / min(area1, area2)
    if ratio < 1.2:
        return "similar"
    
    return "label1_bigger" if area1 > area2 else "label2_bigger"


def find_largest_object(detections: List[Dict]) -> Optional[Dict]:
    """
    Find the largest object in detections.
    
    Returns:
        Detection dict of largest object, or None if no detections
    """
    if not detections:
        return None
    
    largest = max(detections, key=lambda det: calculate_bbox_area(det["bbox"]))
    return largest


def check_object_bigger_than(detections: List[Dict], 
                             target_label: str, 
                             reference_label: str) -> bool:
    """
    Check if target object is bigger than reference object.
    
    Args:
        detections: List of detection dicts
        target_label: Label of object that should be bigger
        reference_label: Label of reference object
    
    Returns:
        True if target is bigger than reference
    """
    result = compare_object_sizes(detections, target_label, reference_label)
    return result == "label1_bigger"


# ---------------------------------------------------------------------------
# Spatial Relationships
# ---------------------------------------------------------------------------

def check_object_above(detections: List[Dict], 
                      label1: str, 
                      label2: str, 
                      threshold: int = 50) -> bool:
    """
    Check if object1 is above object2.
    
    Args:
        detections: List of detection dicts
        label1: Label of object that should be above
        label2: Label of object that should be below
        threshold: Minimum vertical distance in pixels
    
    Returns:
        True if object1 is above object2
    """
    label1 = label1.lower()
    label2 = label2.lower()
    
    obj1 = next((det for det in detections if det["label"].lower() == label1), None)
    obj2 = next((det for det in detections if det["label"].lower() == label2), None)
    
    if not obj1 or not obj2:
        return False
    
    # Get bottom of obj1 and top of obj2
    obj1_bottom = obj1["bbox"][1] + obj1["bbox"][3]
    obj2_top = obj2["bbox"][1]
    
    # obj1 is above if its bottom is above obj2's top
    return obj1_bottom < obj2_top - threshold


def check_horizontal_alignment(detections: List[Dict], 
                               label1: str, 
                               label2: str, 
                               tolerance: int = 50) -> bool:
    """
    Check if two objects are horizontally aligned (same y-level).
    
    Args:
        detections: List of detection dicts
        label1, label2: Labels of objects to check
        tolerance: Allowed vertical difference in pixels
    
    Returns:
        True if objects are horizontally aligned
    """
    label1 = label1.lower()
    label2 = label2.lower()
    
    obj1 = next((det for det in detections if det["label"].lower() == label1), None)
    obj2 = next((det for det in detections if det["label"].lower() == label2), None)
    
    if not obj1 or not obj2:
        return False
    
    # Get center y-coordinates
    y1 = obj1["bbox"][1] + obj1["bbox"][3] / 2
    y2 = obj2["bbox"][1] + obj2["bbox"][3] / 2
    
    return abs(y1 - y2) <= tolerance


# ---------------------------------------------------------------------------
# Multi-Object Analysis
# ---------------------------------------------------------------------------

def analyze_scene(detections: List[Dict]) -> Dict:
    """
    Perform comprehensive multi-object analysis.
    
    Returns:
        {
            "total_objects": int,
            "unique_labels": List[str],
            "object_counts": Dict[str, int],
            "largest_object": Dict,
            "nearby_pairs": List[Dict],
        }
    """
    if not detections:
        return {
            "total_objects": 0,
            "unique_labels": [],
            "object_counts": {},
            "largest_object": None,
            "nearby_pairs": []
        }
    
    # Count objects by label
    object_counts = {}
    for det in detections:
        label = det["label"]
        object_counts[label] = object_counts.get(label, 0) + 1
    
    return {
        "total_objects": len(detections),
        "unique_labels": list(object_counts.keys()),
        "object_counts": object_counts,
        "largest_object": find_largest_object(detections),
        "nearby_pairs": find_nearby_objects(detections)
    }
