import hashlib

class IconManager:

    def __init__(self):
        pass

    @staticmethod
    def hash_png(path):
        with open(path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()