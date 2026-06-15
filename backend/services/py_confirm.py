import logging
logger = logging.getLogger(__name__)

import tkinter as tk
from tkinter import messagebox, simpledialog

class Alert:

    def __init__(self):
        self._root = tk.Tk()
        self._root.withdraw()  # hide the root window

    def info(self, message: str, title: str = "Info") -> None:
        messagebox.showinfo(title, message)

    def confirm(self, message: str, title: str = "Confirm") -> bool:
        logger.info("Confirm alert triggered....")
        return messagebox.askyesno(title, message)

    def yes_no_cancel(self, message: str, title: str = "Confirm") -> bool | None:
        logger.info("Yes, no, cancel alert triggered...")
        result = messagebox.askyesnocancel(title, message)
        return result  # True, False, or None

    def choice(self, message: str, options: dict[str, any], title: str = "Choose") -> any:
        logger.info("Choice alert triggered")
        prompt = "\n".join(f"{i+1}. {k}" for i, k in enumerate(options.keys()))
        raw = simpledialog.askstring(title, f"{message}\n\n{prompt}\n\nEnter the choice number and press OK")
        if raw is None:
            return None
        try:
            idx = int(raw.strip()) - 1
            key = list(options.keys())[idx]
            val = options[key]
            return val() if callable(val) else val
        except (ValueError, IndexError):
            return None
    
if __name__ == '__main__':

    Alert().confirm("Testing message")
    Alert().yes_no_cancel("Testing message")
    Alert().choice("Testing message", {
        "hi": "this is crazy",
        "bye": "this is crazy",
        "toes": "this is crazy",
        "toad": "this is crazy",
    })