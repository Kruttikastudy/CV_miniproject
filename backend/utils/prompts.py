"""
Prompt generation and matching logic for the game.
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
    {"text": "Find a cup", "type": "object", "target": "cup"},
    {"text": "Find a book", "type": "object", "target": "book"},
    {"text": "Find a chair", "type": "object", "target": "chair"},
    {"text": "Find a keyboard", "type": "object", "target": "keyboard"},
    {"text": "Find a mouse", "type": "object", "target": "mouse"},
    {"text": "Find a laptop", "type": "object", "target": "laptop"},
    {"text": "Find a remote", "type": "object", "target": "remote"},
    {"text": "Find a backpack", "type": "object", "target": "backpack"},
    {"text": "Find a clock", "type": "object", "target": "clock"},
    {"text": "Find a scissors", "type": "object", "target": "scissors"},
    {"text": "Find a person", "type": "object", "target": "person"},
    {"text": "Find a tv", "type": "object", "target": "tv"},
    {"text": "Find a spoon", "type": "object", "target": "spoon"},
    {"text": "Find a fork", "type": "object", "target": "fork"},
    {"text": "Find a knife", "type": "object", "target": "knife"},
    {"text": "Find a bowl", "type": "object", "target": "bowl"},
    {"text": "Find a banana", "type": "object", "target": "banana"},
    {"text": "Find a apple", "type": "object", "target": "apple"},
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
    {"text": "Find a handbag", "type": "object", "target": "handbag"},
    {"text": "Find a tie", "type": "object", "target": "tie"},
    {"text": "Find a suitcase", "type": "object", "target": "suitcase"},
    {"text": "Find a vase", "type": "object", "target": "vase"},
    {"text": "Find a teddy bear", "type": "object", "target": "teddy bear"},
    {"text": "Find a toothbrush", "type": "object", "target": "toothbrush"},
]


def get_random_prompt(difficulty: str = "easy", exclude: list = None):
    """
    Return a random prompt dict, optionally excluding already-used prompts.
    difficulty: "easy" | "hard" | "mixed"
    """
    if exclude is None:
        exclude = []

    if difficulty == "easy":
        pool = EASY_PROMPTS
    elif difficulty == "hard":
        pool = HARD_PROMPTS
    else:
        pool = EASY_PROMPTS + HARD_PROMPTS

    available = [p for p in pool if p["text"] not in exclude]
    if not available:
        available = pool  # reset if exhausted

    return random.choice(available)


def check_match(prompt: dict, detections: list) -> bool:
    """
    Check whether any detection satisfies the prompt requirement.
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
