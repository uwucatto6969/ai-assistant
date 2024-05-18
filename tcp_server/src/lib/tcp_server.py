import socket
import json
import os
from typing import Union
import time
import re

import lib.nlp as nlp
from .tts.api import TTS
from .constants import TTS_MODEL_CONFIG_PATH, TTS_MODEL_PATH, IS_TTS_ENABLED, TMP_PATH


class TCPServer:
    def __init__(self, host: str, port: Union[str, int]):
        self.host = host
        self.port = port
        self.tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.conn = None
        self.addr = None
        self.tts = None

    @staticmethod
    def log(*args, **kwargs):
        print('[TCP Server]', *args, **kwargs)

    def init_tts(self):
        if not IS_TTS_ENABLED:
            self.log('TTS is disabled')
            return

        if not os.path.exists(TTS_MODEL_CONFIG_PATH):
            self.log(f'TTS model config not found at {TTS_MODEL_CONFIG_PATH}')
            return

        if not os.path.exists(TTS_MODEL_PATH):
            self.log(f'TTS model not found at {TTS_MODEL_PATH}')
            return

        self.tts = TTS(language='EN',
                       device='auto',
                       config_path=TTS_MODEL_CONFIG_PATH,
                       ckpt_path=TTS_MODEL_PATH
        )

    def init(self):
        try:
            # Make sure to establish TCP connection by reusing the address so it does not conflict with port already in use
            self.tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.tcp_socket.bind((self.host, int(self.port)))
            self.tcp_socket.listen()
        except OSError as e:
            # If the port is already in use, close the connection and retry
            if 'Address already in use' in str(e):
                self.log(f'Port {self.port} is already in use. Disconnecting client and retrying...')
                if self.conn:
                    self.conn.close()
                # Wait for a moment before retrying
                time.sleep(1)
                self.init()
            else:
                raise

        while True:
            # Flush buffered output to make it IPC friendly (readable on stdout)
            self.log('Waiting for connection...', flush=True)

            # Our TCP server only needs to support one connection
            self.conn, self.addr = self.tcp_socket.accept()

            try:
                self.log(f'Client connected: {self.addr}')

                while True:
                    # socket_data = self.conn.recv(1024)
                    socket_data = self.conn.recv(8096)

                    if not socket_data:
                        break

                    data_dict = json.loads(socket_data)

                    # Verify the received topic can execute the method
                    method = data_dict['topic'].lower().replace('-', '_')
                    if hasattr(self.__class__, method) and callable(getattr(self.__class__, method)):
                        data = data_dict['data']
                        method = getattr(self, method)
                        res = method(data)

                        self.conn.sendall(json.dumps(res).encode('utf-8'))
            finally:
                self.log(f'Client disconnected: {self.addr}')
                self.conn.close()

    def get_spacy_entities(self, utterance: str) -> dict:
        entities = nlp.extract_spacy_entities(utterance)

        return {
            'topic': 'spacy-entities-received',
            'data': {
                'spacyEntities': entities
            }
        }

    def tts_synthesize(self, speech: str) -> dict:
        """
        TODO:
        - Implement one speaker per style (joyful, sad, angry, tired, etc.)
        - Need to train a new model with default voice speaker and other speakers with different styles
        - EN-Leon-Joyful-V1; EN-Leon-Sad-V1; etc.
        """
        speaker_ids = self.tts.hps.data.spk2id
        # Random file name to avoid conflicts
        audio_id = f'{int(time.time())}_{os.urandom(2).hex()}'
        output_file_name = f'{audio_id}.wav'
        output_path = os.path.join(TMP_PATH, output_file_name)
        speed = 0.88

        formatted_speech = speech.replace(' - ', '.').replace(',', '.').replace(': ', '. ')
        # Clean up emojis
        formatted_speech = re.sub(r'[\U00010000-\U0010ffff]', '', formatted_speech)
        formatted_speech = formatted_speech.strip()
        # formatted_speech = speech.replace(',', '.').replace('.', '...')

        # TODO: should not wait to finish for streaming support
        self.tts.tts_to_file(
            formatted_speech,
            speaker_ids['EN-Leon-V1'],
            output_path=output_path,
            speed=speed,
            quiet=True,
            format='wav',
            stream=False
        )

        return {
            'topic': 'tts-audio-streaming',
            'data': {
                'outputPath': output_path,
                'audioId': audio_id
            }
        }
