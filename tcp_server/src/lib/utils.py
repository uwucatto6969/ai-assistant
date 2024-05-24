import time


class ThrottledCallback:
    def __init__(self, callback, min_interval):
        self.callback = callback
        self.min_interval = min_interval
        self.last_call = 0

    def __call__(self, *args, **kwargs):
        current_time = time.time()
        if current_time - self.last_call > self.min_interval:
            self.callback(*args, **kwargs)
            self.last_call = current_time
