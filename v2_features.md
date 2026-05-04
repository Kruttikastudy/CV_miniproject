# 🚀 Object Hunt V2 Features

## Overview

Version 2 adds advanced computer vision capabilities to the Object Hunt game, making gameplay more dynamic and interactive. All features use **pre-trained models** (no training required) and are **backward compatible** with the existing game.

---

## 🎯 New Features

### 1. **Motion Detection & Object Tracking**
Track object movement across frames and detect motion patterns.

**Capabilities:**
- ✅ Frame differencing for motion detection
- ✅ Object trajectory tracking using centroid tracking
- ✅ Movement direction detection (left, right, up, down)
- ✅ Speed calculation (pixels per frame)
- ✅ Hand wave detection in upper frame region

**Technology:** OpenCV (no ML model needed)

**New Prompts:**
- "Show me something moving"
- "Move a bottle from left to right"
- "Move a cup from left to right"

---

### 2. **Hand Gesture Recognition**
Detect and recognize hand gestures in real-time using MediaPipe.

**Capabilities:**
- ✅ Detects up to 2 hands simultaneously
- ✅ 21 hand landmarks per hand
- ✅ Left/right hand classification
- ✅ 7 pre-defined gestures recognized

**Recognized Gestures:**
1. 👍 **Thumbs Up** - Only thumb extended
2. ✌️ **Peace Sign** - Index and middle fingers extended
3. 👉 **Pointing** - Only index finger extended
4. ✊ **Fist** - All fingers closed
5. 🖐️ **Open Palm** - All fingers extended
6. 🤘 **Rock Sign** - Index and pinky extended
7. 👌 **OK Sign** - Thumb and index forming circle

**Technology:** MediaPipe Hands (Google's pre-trained model)

**New Prompts:**
- "Give a thumbs up"
- "Show a peace sign"
- "Point at the camera"
- "Make a fist"
- "Show your open palm"
- "Make a rock sign"
- "Wave your hand"

---

### 3. **Multi-Object Detection & Relationships**
Analyze relationships between multiple objects in the scene.

**Capabilities:**
- ✅ Count objects of the same type
- ✅ Detect proximity between objects
- ✅ Compare object sizes
- ✅ Spatial relationship analysis (above, beside, aligned)
- ✅ Scene analysis (total objects, unique labels, largest object)

**New Prompts:**
- "Show me 2 bottles"
- "Show me 2 cups"
- "Show me 3 books"
- "Place a cup next to a phone"
- "Place a bottle next to a book"
- "Show something bigger than your phone"

**Technology:** Enhanced YOLO detection + geometric analysis

---

## 📦 New Dependencies

Added to `requirements.txt`:
```
mediapipe==0.10.14    # Hand gesture detection
scipy==1.11.4         # Distance calculations for tracking
```

**Installation:**
```bash
cd backend
source .venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

---

## 🏗️ Architecture Changes

### New Modules

#### 1. `backend/motion_tracker.py`
- **MotionDetector** class - Frame differencing and motion detection
- **ObjectTracker** class - Centroid-based object tracking across frames
- Helper functions for directional movement and hand wave detection

#### 2. `backend/gesture_detector.py`
- **GestureDetector** class - MediaPipe Hands wrapper
- Gesture recognition logic for 7 hand gestures
- Gesture matching and wave detection functions

#### 3. `backend/multi_object.py`
- Object counting functions
- Proximity detection (distance between objects)
- Size comparison functions
- Spatial relationship analysis
- Scene analysis utilities

### Modified Files

#### `backend/model.py`
**Changes:**
- Added imports for new modules
- Added singleton instances for MotionDetector, ObjectTracker, GestureDetector
- Added getter functions: `get_motion_detector()`, `get_object_tracker()`, `get_gesture_detector()`

**Backward Compatibility:** ✅ All existing functions unchanged

---

#### `backend/utils/prompts.py`
**Changes:**
- Added `MOTION_PROMPTS`, `GESTURE_PROMPTS`, `MULTI_OBJECT_PROMPTS` lists
- Extended `get_random_prompt()` to support new difficulty modes:
  - `"motion"` - Motion-based prompts only
  - `"gesture"` - Gesture prompts only
  - `"multi_object"` - Multi-object prompts only
  - `"v2_all"` - All V2 prompts combined
- Added `check_match_v2()` function for advanced prompt matching

**Backward Compatibility:** ✅ Original `check_match()` function unchanged, existing difficulty modes work as before

---

#### `backend/routes/detect.py`
**Changes:**
- Added new optional parameters to `/detect` endpoint:
  - `enable_motion` (bool) - Enable motion detection
  - `enable_tracking` (bool) - Enable object tracking
  - `enable_gestures` (bool) - Enable gesture detection
  - `enable_multi_object` (bool) - Enable multi-object analysis
- Response now includes optional fields based on enabled features:
  - `motion_data` - Motion detection results
  - `tracking_data` - Object tracking and movement data
  - `gesture_data` - Hand gesture detection results
  - `multi_object_analysis` - Scene analysis
- Added new endpoint: `POST /reset_trackers` - Reset motion and tracking state

**Backward Compatibility:** ✅ All new parameters are optional (default: False), existing API calls work unchanged

---

## 🔌 API Changes

### Enhanced `/detect` Endpoint

**New Optional Parameters:**
```json
{
  "image": "file or base64",
  "detect_color_name": "optional color name",
  "enable_motion": false,        // NEW
  "enable_tracking": false,      // NEW
  "enable_gestures": false,      // NEW
  "enable_multi_object": false   // NEW
}
```

**Enhanced Response:**
```json
{
  "detections": [...],           // Original YOLO + color detections
  
  // NEW: Motion data (if enable_motion=true)
  "motion_data": {
    "motion_detected": true,
    "motion_percentage": 15.3,
    "motion_regions": [[x, y, w, h], ...]
  },
  
  // NEW: Tracking data (if enable_tracking=true)
  "tracking_data": {
    "tracked_objects": {
      "0": {
        "centroid": [x, y],
        "trajectory": [[x1,y1], [x2,y2], ...],
        "trajectory_length": 10
      }
    },
    "movements": [
      {
        "object_id": 0,
        "direction": "right",
        "distance": 150.5,
        "speed": 12.3,
        "is_moving": true
      }
    ]
  },
  
  // NEW: Gesture data (if enable_gestures=true)
  "gesture_data": {
    "hands_detected": 1,
    "hands": [
      {
        "handedness": "Right",
        "confidence": 0.98,
        "landmarks": [{x, y, z}, ...],  // 21 landmarks
        "gesture": "thumbs_up"
      }
    ]
  },
  
  // NEW: Multi-object analysis (if enable_multi_object=true)
  "multi_object_analysis": {
    "total_objects": 5,
    "unique_labels": ["bottle", "cup", "phone"],
    "object_counts": {"bottle": 2, "cup": 1, "phone": 2},
    "largest_object": {...},
    "nearby_pairs": [
      {"object1": "cup", "object2": "phone", "distance": 120.5}
    ]
  }
}
```

### New `/reset_trackers` Endpoint

**Purpose:** Reset motion detector and object tracker state between game rounds

**Request:**
```http
POST /reset_trackers
```

**Response:**
```json
{
  "status": "trackers_reset"
}
```

---

## 🎮 Usage Examples

### Example 1: Motion Detection
```python
# Frontend sends frame with motion enabled
response = await fetch('/detect', {
  method: 'POST',
  body: formData,  // contains image
  params: {
    enable_motion: true,
    enable_tracking: true
  }
})

# Check if object moved left to right
if (response.tracking_data.movements.some(m => 
  m.direction === 'right' && m.distance > 100
)) {
  console.log('Object moved left to right!');
}
```

### Example 2: Gesture Detection
```python
# Frontend sends frame with gestures enabled
response = await fetch('/detect', {
  method: 'POST',
  body: formData,
  params: {
    enable_gestures: true
  }
})

# Check for thumbs up
if (response.gesture_data.hands.some(h => 
  h.gesture === 'thumbs_up'
)) {
  console.log('Thumbs up detected!');
}
```

### Example 3: Multi-Object Counting
```python
# Frontend sends frame with multi-object analysis
response = await fetch('/detect', {
  method: 'POST',
  body: formData,
  params: {
    enable_multi_object: true
  }
})

# Check if 2 bottles are present
if (response.multi_object_analysis.object_counts['bottle'] >= 2) {
  console.log('Found 2 or more bottles!');
}
```

---

## 🎯 Prompt Matching Logic

### Using `check_match_v2()` Function

The new `check_match_v2()` function in `utils/prompts.py` handles all prompt types:

```python
from utils.prompts import check_match_v2

# Example prompt
prompt = {
  "text": "Give a thumbs up",
  "type": "gesture",
  "target": "thumbs_up"
}

# Detection result from /detect endpoint
detection_result = {
  "detections": [...],
  "gesture_data": {
    "hands_detected": 1,
    "hands": [{"gesture": "thumbs_up", ...}]
  }
}

# Check if prompt is satisfied
if check_match_v2(prompt, detection_result):
    print("Prompt completed!")
```

**Supported Prompt Types:**
- `"object"` - Original YOLO object detection
- `"color"` - Original color detection
- `"motion"` - Motion and movement detection
- `"gesture"` - Hand gesture recognition
- `"multi_object"` - Multi-object relationships

---

## 🔧 Frontend Integration Guide

### Minimal Changes Required

The backend is **fully backward compatible**. To use V2 features:

1. **Add new difficulty options** to player setup:
   ```javascript
   const difficulties = [
     'easy',
     'hard',
     'mixed',
     'motion',      // NEW
     'gesture',     // NEW
     'multi_object', // NEW
     'v2_all'       // NEW: All V2 features
   ];
   ```

2. **Enable features in API calls** based on prompt type:
   ```javascript
   const formData = new FormData();
   formData.append('image_base64', imageBase64);
   
   // Enable features based on current prompt
   if (currentPrompt.type === 'gesture') {
     formData.append('enable_gestures', 'true');
   }
   if (currentPrompt.type === 'motion') {
     formData.append('enable_motion', 'true');
     formData.append('enable_tracking', 'true');
   }
   if (currentPrompt.type === 'multi_object') {
     formData.append('enable_multi_object', 'true');
   }
   ```

3. **Use `check_match_v2()` for prompt validation**:
   ```javascript
   // Send full detection result to backend for validation
   // OR implement matching logic in frontend based on response
   ```

4. **Reset trackers between rounds**:
   ```javascript
   async function startNewRound() {
     await fetch('/reset_trackers', { method: 'POST' });
     // ... start round
   }
   ```

### Optional: Enhanced UI

- Display hand landmarks overlay for gesture prompts
- Show object trajectories for motion prompts
- Highlight nearby objects for proximity prompts
- Show object counts for multi-object prompts

---

## ⚡ Performance Considerations

### Resource Usage

| Feature | CPU Impact | Latency Added | Notes |
|---------|-----------|---------------|-------|
| Motion Detection | Low | ~5-10ms | Frame differencing is fast |
| Object Tracking | Low | ~5-10ms | Centroid tracking is efficient |
| Gesture Detection | Medium | ~30-50ms | MediaPipe is optimized for CPU |
| Multi-Object Analysis | Negligible | ~1-2ms | Just geometric calculations |

### Optimization Tips

1. **Enable only needed features** - Don't enable all features for every frame
2. **Gesture detection** - Most expensive, only enable for gesture prompts
3. **Tracking** - Maintains state across frames, reset between rounds
4. **Motion detection** - Requires 2+ frames to work, first frame returns no motion

### Recommended Settings

```python
# For object/color prompts (original)
enable_motion = False
enable_tracking = False
enable_gestures = False
enable_multi_object = False

# For gesture prompts
enable_gestures = True

# For motion prompts
enable_motion = True
enable_tracking = True

# For multi-object prompts
enable_multi_object = True
```

---

## 🧪 Testing

### Test All Features
```bash
cd backend
source .venv/bin/activate

# Test imports
python -c "from model import get_model, get_motion_detector, get_object_tracker, get_gesture_detector; print('✓ All imports successful')"

# Test prompts
python -c "from utils.prompts import MOTION_PROMPTS, GESTURE_PROMPTS, MULTI_OBJECT_PROMPTS; print(f'Loaded {len(MOTION_PROMPTS)} motion, {len(GESTURE_PROMPTS)} gesture, {len(MULTI_OBJECT_PROMPTS)} multi-object prompts')"

# Start server
python main.py
```

### Test Endpoints
```bash
# Test original detection (should work unchanged)
curl -X POST http://localhost:8000/detect \
  -F "image=@test_image.jpg"

# Test with V2 features
curl -X POST http://localhost:8000/detect \
  -F "image=@test_image.jpg" \
  -F "enable_gestures=true" \
  -F "enable_motion=true"

# Test reset
curl -X POST http://localhost:8000/reset_trackers
```

---

## 🐛 Troubleshooting

### MediaPipe Installation Issues
```bash
# If mediapipe fails to install, try:
pip install --upgrade pip
pip install mediapipe==0.10.14 --no-cache-dir
```

### Gesture Detection Not Working
- Ensure good lighting
- Hand should be clearly visible
- Try different hand orientations
- Check that `enable_gestures=true` is set

### Motion Detection Too Sensitive
- Adjust `threshold` parameter in MotionDetector (default: 25)
- Adjust `min_area` parameter (default: 500 pixels)

### Tracking Losing Objects
- Increase `max_disappeared` parameter (default: 10 frames)
- Ensure objects are clearly visible and not occluded

---

## 📊 Summary

### What's New
- ✅ 3 new CV modules (motion, gesture, multi-object)
- ✅ 16 new prompt types
- ✅ Enhanced `/detect` endpoint with optional features
- ✅ New `/reset_trackers` endpoint
- ✅ 100% backward compatible

### What's Unchanged
- ✅ Original YOLO object detection
- ✅ Original color detection
- ✅ Original prompt types (easy/hard/mixed)
- ✅ Frontend code (no changes required)
- ✅ API structure (only additions, no breaking changes)

### Lines of Code Added
- `motion_tracker.py`: ~350 lines
- `gesture_detector.py`: ~280 lines
- `multi_object.py`: ~320 lines
- Modified files: ~150 lines
- **Total: ~1,100 lines of new code**

---

## 🚀 Next Steps

1. **Test the backend** - Run `python main.py` and test endpoints
2. **Update frontend** (optional) - Add new difficulty modes and enable V2 features
3. **Play test** - Try new prompts and adjust difficulty
4. **Tune parameters** - Adjust thresholds for motion/tracking if needed
5. **Add more prompts** - Expand prompt lists based on gameplay feedback

---

## 📝 Notes

- All V2 features use **pre-trained models** - no training required
- **CPU-friendly** - Optimized for real-time performance
- **Modular design** - Easy to extend with more features
- **Production ready** - Includes error handling and edge cases
- **Well documented** - Comprehensive docstrings in all modules

---

**Version:** 2.0  
**Date:** May 4, 2026  
**Compatibility:** Python 3.9+, FastAPI 0.115+, OpenCV 4.10+, MediaPipe 0.10.14+
