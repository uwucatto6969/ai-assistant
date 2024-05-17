import os
import sys

IS_RAN_FROM_BINARY = getattr(sys, 'frozen', False)

SRC_PATH = os.path.join(os.getcwd(), 'tcp_server', 'src') if not IS_RAN_FROM_BINARY else '.'

# TTS
TTS_MODEL_VERSION = 'V1'
TTS_MODEL_NAME = f'EN-Leon-{TTS_MODEL_VERSION}'
TTS_MODEL_FILE_NAME = f'{TTS_MODEL_NAME}.pth'
TTS_LIB_PATH = os.path.join(SRC_PATH, 'lib', 'tts')
TTS_MODEL_FOLDER_PATH = os.path.join(TTS_LIB_PATH, 'models')
TTS_MODEL_CONFIG_PATH = os.path.join(TTS_MODEL_FOLDER_PATH, 'config.json')
TTS_MODEL_PATH = os.path.join(TTS_MODEL_FOLDER_PATH, TTS_MODEL_FILE_NAME)
IS_TTS_ENABLED = os.environ.get('LEON_TTS', 'true') == 'true'
