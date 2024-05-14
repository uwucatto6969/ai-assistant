import os

MODELS_PATH = os.path.join(
    os.getcwd(),
    'core',
    'data',
    'models'
)

TTS_MODEL_VERSION = 'V1'
TTS_MODEL_NAME = f'EN-Leon-{TTS_MODEL_VERSION}'
TTS_MODEL_FILE_NAME = f'{TTS_MODEL_NAME}.pth'
TTS_MODEL_FOLDER_PATH = os.path.join(MODELS_PATH, 'tts')
TTS_MODEL_PATH = os.path.join(TTS_MODEL_FOLDER_PATH, TTS_MODEL_FILE_NAME)
TTS_MODEL_CONFIG_PATH = os.path.join(TTS_MODEL_FOLDER_PATH, 'config.json')
IS_TTS_ENABLED = os.environ.get('LEON_TTS', 'true') == 'true'
