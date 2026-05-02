/**
 * Prompt definitions and matching logic for the frontend.
 * Mirrors the backend prompts.py for prompt generation.
 */

const EASY_PROMPTS = [
  { text: "Find a bottle", type: "object", target: "bottle" },
  { text: "Find a cell phone", type: "object", target: "cell phone" },
  { text: "Find a cup", type: "object", target: "cup" },
  { text: "Find a book", type: "object", target: "book" },
  { text: "Find a chair", type: "object", target: "chair" },
  { text: "Find a keyboard", type: "object", target: "keyboard" },
  { text: "Find a mouse", type: "object", target: "mouse" },
  { text: "Find a laptop", type: "object", target: "laptop" },
  { text: "Find a remote", type: "object", target: "remote" },
  { text: "Find a backpack", type: "object", target: "backpack" },
  { text: "Find a clock", type: "object", target: "clock" },
  { text: "Find a scissors", type: "object", target: "scissors" },
  { text: "Find a person", type: "object", target: "person" },
  { text: "Find a TV", type: "object", target: "tv" },
  { text: "Find a spoon", type: "object", target: "spoon" },
  { text: "Find a fork", type: "object", target: "fork" },
  { text: "Find a knife", type: "object", target: "knife" },
  { text: "Find a bowl", type: "object", target: "bowl" },
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
  { text: "Find a handbag", type: "object", target: "handbag" },
  { text: "Find a tie", type: "object", target: "tie" },
  { text: "Find a suitcase", type: "object", target: "suitcase" },
  { text: "Find a vase", type: "object", target: "vase" },
  { text: "Find a teddy bear", type: "object", target: "teddy bear" },
  { text: "Find a toothbrush", type: "object", target: "toothbrush" },
];

/**
 * Get a random prompt, avoiding recently used ones.
 */
export function getRandomPrompt(difficulty = 'easy', exclude = []) {
  let pool;
  if (difficulty === 'easy') pool = EASY_PROMPTS;
  else if (difficulty === 'hard') pool = HARD_PROMPTS;
  else pool = [...EASY_PROMPTS, ...HARD_PROMPTS];

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
 * Get the color name from a prompt (for color-type prompts).
 */
export function getColorFromPrompt(prompt) {
  if (prompt && prompt.type === 'color') {
    return prompt.target;
  }
  return null;
}
