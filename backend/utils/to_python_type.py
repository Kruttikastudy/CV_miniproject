import numpy as np

def to_python_type(obj):
    if isinstance(obj, np.generic):
        return obj.item()

    if isinstance(obj, np.ndarray):
        return obj.tolist()

    if isinstance(obj, dict):
        return {k: to_python_type(v) for k, v in obj.items()}

    if isinstance(obj, list):
        return [to_python_type(i) for i in obj]

    return obj