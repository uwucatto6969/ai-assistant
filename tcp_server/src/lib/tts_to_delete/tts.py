import os
import torch

from . import utils
from ..constants import TTS_MODEL_CONFIG_PATH, TTS_MODEL_PATH, IS_TTS_ENABLED

class TTS:
    def __init__(self):
        self.hyper_params = None
        self.device = 'auto'
        self.num_languages = None
        self.num_tones = None
        self.symbols = None

        if not IS_TTS_ENABLED:
            self.log('TTS is disabled')
            return

        self.log('Loading model...')

        if not self.has_model_config():
            self.log(f'Model config not found at {TTS_MODEL_CONFIG_PATH}')
            return

        if not self.is_model_downloaded():
            self.log(f'Model not found at {TTS_MODEL_PATH}')
            return

        self.set_device()
        self.hyper_params = utils.get_hparams_from_file(TTS_MODEL_CONFIG_PATH)
        self.num_languages = self.hyper_params.num_languages
        self.num_tones = self.hyper_params.num_tones
        self.symbols = self.hyper_params.symbols

        model = SynthesizerTrn(
            len(self.symbols),
            self.hyper_params.data.filter_length // 2 + 1,
            self.hyper_params.train.segment_size // self.hyper_params.data.hop_length,
            n_speakers=self.hyper_params.data.n_speakers,
            num_tones=self.num_tones,
            num_languages=self.num_languages,
            **self.hyper_params.model,
        ).to(self.device)
        model.eval()
        self.model = model

        self.log('Model loaded')

    def set_device(self):
        if self.device == 'auto':
            self.device = 'cpu'

            if torch.cuda.is_available():
                self.device = 'cuda'
            else:
                self.log('GPU not available. CUDA is not installed?')

            if torch.backends.mps.is_available():
                self.device = 'mps'
        if 'cuda' in self.device:
            assert torch.cuda.is_available()

        self.log(f'Device: {self.device}')

    @staticmethod
    def is_model_downloaded():
        return os.path.exists(TTS_MODEL_PATH)

    @staticmethod
    def has_model_config():
        return os.path.exists(TTS_MODEL_CONFIG_PATH)

    @staticmethod
    def log(*args, **kwargs):
        print('[TTS]', *args, **kwargs)
