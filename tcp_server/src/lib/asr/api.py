import pyaudio
import audioop
import time
import torch
import numpy as np
from faster_whisper import WhisperModel

from ..constants import ASR_MODEL_PATH_FOR_GPU, ASR_MODEL_PATH_FOR_CPU

class ASR:
    def __init__(self,
                 device='auto',
                 transcription_callback=None,
                 wake_word_or_active_listening_callback=None,
                 end_of_owner_speech_callback=None):
        tic = time.perf_counter()
        self.log('Loading model...')

        if device == 'auto':
            device = 'cpu'

            if torch.cuda.is_available(): device = 'cuda'
            else: self.log('GPU not available. CUDA is not installed?')

            if torch.backends.mps.is_available(): device = 'mps'
        if 'cuda' in device:
            assert torch.cuda.is_available()

        self.log(f'Device: {device}')

        compute_type = "float16"

        if device == 'cpu':
            compute_type = "int8_float32"

        self.compute_type = compute_type

        self.transcription_callback = transcription_callback
        self.wake_word_or_active_listening_callback = wake_word_or_active_listening_callback
        self.end_of_owner_speech_callback = end_of_owner_speech_callback

        self.wake_words = ["ok leon", "okay leon", "hi leon", "hey leon", "hello leon", "heilion", "alion", "hyleon"]

        self.device = device
        self.tcp_conn = None
        self.utterance = []
        self.circular_buffer = []
        self.is_voice_activity_detected = False
        self.silence_start_time = 0
        self.is_wake_word_detected = False
        self.is_active_listening_enabled = False
        self.saved_utterances = []
        self.segment_text = ''

        self.audio_format = pyaudio.paInt16
        self.channels = 1
        self.rate = 16000
        self.chunk = 4096
        self.threshold = 128
        # Duration of silence after which the audio data is considered as a new utterance (in seconds)
        self.silence_duration = 1.5
        """
        Duration of silence after which the active listening is stopped (in seconds).
        Once stopped, the active listening can be resumed by saying the wake word again
        """
        self.base_active_listening_duration = 12
        self.active_listening_duration = self.base_active_listening_duration
        self.buffer_size = 64  # Size of the circular buffer

        self.audio = pyaudio.PyAudio()
        self.stream = None
        self.model = None

        if self.device == 'cpu':
            model_path = ASR_MODEL_PATH_FOR_CPU
            self.model = WhisperModel(
                model_path,
                device=self.device,
                compute_type=self.compute_type,
                local_files_only=True,
                cpu_threads=4
            )
        else:
            model_path = ASR_MODEL_PATH_FOR_GPU
            self.model = WhisperModel(
                model_path,
                device=self.device,
                compute_type=self.compute_type,
                local_files_only=True
            )

        self.log('Model loaded')
        toc = time.perf_counter()

        self.log(f"Time taken to load model: {toc - tic:0.4f} seconds")

    def detect_wake_word(self, speech: str) -> bool:
        lowercased_speech = speech.lower().strip()

        for wake_word in self.wake_words:
            if wake_word in lowercased_speech:
                return True
        return False

    def process_circular_buffer(self):
        if len(self.circular_buffer) > self.buffer_size:
            self.circular_buffer.pop(0)

        audio_data = np.concatenate(self.circular_buffer)
        transcribe_params = {
            "beam_size": 5,
            "language": "en",
            "task": "transcribe",
            "condition_on_previous_text": False,
            "hotwords": "talking to Leon"
        }
        if self.device == 'cpu':
            transcribe_params["temperature"] = 0

        segments, info = self.model.transcribe(audio_data, **transcribe_params)
        for segment in segments:
            words = segment.text.split()
            self.segment_text += ' '.join(words) + ' '

            if self.is_wake_word_detected:
                self.utterance.append(self.segment_text)
                self.transcription_callback(" ".join(self.utterance))

            has_dected_wake_word = self.detect_wake_word(segment.text)
            if has_dected_wake_word or self.is_active_listening_enabled:
                if has_dected_wake_word:
                    self.log('Wake word detected')
                self.wake_word_or_active_listening_callback(segment.text)
                self.is_wake_word_detected = True
                self.is_active_listening_enabled = True
                self.log('Active listening enabled')
            else:
                self.log("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))

            self.segment_text = ''

    def start_recording(self):
        self.stream = self.audio.open(format=self.audio_format,
                                      channels=self.channels,
                                      rate=self.rate,
                                      frames_per_buffer=self.chunk,
                                      input=True,
                                      input_device_index=self.audio.get_default_input_device_info()["index"])  # Use the default input device
        self.log("Recording...")
        frames = []
        while True:
            data = self.stream.read(self.chunk)
            data_np = np.frombuffer(data, dtype=np.int16)

            # Check if the audio data contains any non-finite values
            if not np.isfinite(data_np).all():
                self.log("Non-finite values detected in audio data. Replacing with zeros.")
                data_np = np.nan_to_num(data_np)  # Replace non-finite values with zeros

            rms = audioop.rms(data, 2)  # width=2 for format=paInt16
            if rms >= self.threshold:  # audio threshold
                if not self.is_voice_activity_detected:
                    self.is_voice_activity_detected = True

                self.circular_buffer.append(data_np)
                self.process_circular_buffer()
            else:
                if self.is_voice_activity_detected:
                    self.silence_start_time = time.time()
                    self.is_voice_activity_detected = False
                is_end_of_speech = time.time() - self.silence_start_time > self.silence_duration
                if is_end_of_speech:
                    if len(self.utterance) > 0:
                        self.log('Reset')
                        # Take last utterance of the utterance list
                        self.end_of_owner_speech_callback(self.utterance[-1])

                    if self.is_wake_word_detected:
                        self.saved_utterances.append(" ".join(self.utterance))
                        self.utterance = []
                        # self.is_wake_word_detected = False

                    self.circular_buffer = []

                should_stop_active_listening = self.is_active_listening_enabled and time.time() - self.silence_start_time > self.active_listening_duration
                if should_stop_active_listening:
                    self.is_wake_word_detected = False
                    self.is_active_listening_enabled = False
                    self.log('Active listening disabled')

                # self.log('Silence detected')

    def stop_recording(self):
        self.stream.stop_stream()
        self.stream.close()
        self.audio.terminate()

    @staticmethod
    def log(*args, **kwargs):
        print('[ASR]', *args, **kwargs)
