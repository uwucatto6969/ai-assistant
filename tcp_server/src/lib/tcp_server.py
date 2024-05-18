import socket
import json
import os
from typing import Union
import time

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

        text = 'Hello, I am Leon. How can I help you?'
        speaker_ids = self.tts.hps.data.spk2id
        output_path = os.path.join(TMP_PATH, 'output.wav')
        speed = 1.0

        self.tts.tts_to_file(text, speaker_ids['EN-Leon-V1'], output_path, speed=speed, quiet=True)

    def init(self):
        # Make sure to establish TCP connection by reusing the address so it does not conflict with port already in use
        self.tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.tcp_socket.bind((self.host, int(self.port)))
        self.tcp_socket.listen()

        while True:
            # Flush buffered output to make it IPC friendly (readable on stdout)
            self.log('Waiting for connection...', flush=True)

            # Our TCP server only needs to support one connection
            self.conn, self.addr = self.tcp_socket.accept()

            try:
                self.log(f'Client connected: {self.addr}')

                while True:
                    socket_data = self.conn.recv(1024)

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
