from faster_whisper import WhisperModel

def detect_wake_word(speech: str) -> bool:
    lowercased_speech = speech.lower().strip()
    wake_words = ["ok leon", "hi leon", "hey leon"]
    for wake_word in wake_words:
        if wake_word in lowercased_speech:
            return True
    return False

# config.json; preprocessor_config.json; model.bin; tokenizer.json; vocabulary.json
model_size = "distil-medium.en"

audio_path = '/home/louis/Desktop/asr-test.wav'

# https://github.com/SYSTRAN/faster-whisper/blob/master/faster_whisper/transcribe.py
# model_size_or_path = "distil-large-v3"
# download_root = "/path/to/download"
# local_files_only = True
# files= ["config.json", "preprocessor_config.json", "model.bin", "tokenizer.json", "vocabulary.json"]
# TODO: auto device choice
model = WhisperModel(model_size, device="cuda", compute_type="float16")
segments, info = model.transcribe(
    audio_path,
    beam_size=5,
    language="en",
    condition_on_previous_text=False,
    hotwords="Leon"
)

for segment in segments:
    print(segment)
    print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
