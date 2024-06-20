import re
import soundfile
import numpy as np
import torch.nn as nn
from tqdm import tqdm
import torch
import time
import wave
import os

from . import utils
from .models import SynthesizerTrn
from .split_utils import split_sentence
from ..utils import is_macos

# torch.backends.cudnn.enabled = False

class TTS(nn.Module):
    def __init__(self,
                language,
                device='auto',
                use_hf=True,
                config_path=None,
                ckpt_path=None):
        super().__init__()

        tic = time.perf_counter()
        self.log('Loading model...')

        if device == 'auto':
            device = 'cpu'

            if torch.cuda.is_available():
                device = 'cuda'
                self.log('Using CUDA (Compute Unified Device Architecture)')
            if torch.backends.mps.is_available():
                device = 'mps'
                self.log('Using MPS (Metal Performance Shaders)')
        if 'cuda' in device:
            assert torch.cuda.is_available()
        if 'mps' in device:
            assert torch.backends.mps.is_available()

        if is_macos():
            """
            Temporary fix.
            Force CPU device for macOS because of the memory leak where cache does not want to clear up on MPS
            """
            device = 'cpu'

        self.log(f'Device: {device}')

        hps = utils.get_hparams_from_file(config_path)

        num_languages = hps.num_languages
        num_tones = hps.num_tones
        symbols = hps.symbols

        model = SynthesizerTrn(
            len(symbols),
            hps.data.filter_length // 2 + 1,
            hps.train.segment_size // hps.data.hop_length,
            n_speakers=hps.data.n_speakers,
            num_tones=num_tones,
            num_languages=num_languages,
            **hps.model,
        ).to(device)

        model.eval()
        self.model = model
        self.symbol_to_id = {s: i for i, s in enumerate(symbols)}
        self.hps = hps
        self.device = device

        # load state_dict
        checkpoint_dict = torch.load(ckpt_path, map_location=device)
        self.model.load_state_dict(checkpoint_dict['model'], strict=True)

        language = language.split('_')[0]
        self.language = 'ZH_MIX_EN' if language == 'ZH' else language # we support a ZH_MIX_EN model

        self.log('Model loaded')
        toc = time.perf_counter()

        self.log(f"Time taken to load model: {toc - tic:0.4f} seconds")

        self.log('Warming up model...')
        speaker_ids = self.hps.data.spk2id
        self.tts_to_file('This is a test.', speaker_ids['EN-Leon-V1_1'], quiet=True, format='wav')
        self.log('Model warmed up')

    @staticmethod
    def audio_numpy_concat(segment_data_list, sr, speed=1.):
        audio_segments = []
        for segment_data in segment_data_list:
            audio_segments += segment_data.reshape(-1).tolist()
            audio_segments += [0] * int((sr * 0.05) / speed)
        audio_segments = np.array(audio_segments).astype(np.float32)
        return audio_segments

    @staticmethod
    def split_sentences_into_pieces(text, language, quiet=False):
        texts = split_sentence(text, language_str=language)
        if not quiet:
            print(" > Text split to sentences.")
            print('\n'.join(texts))
            print(" > ===========================")
        return texts

    def tts_to_file(self, text, speaker_id, output_path=None, sdp_ratio=0.2, noise_scale=0.6, noise_scale_w=0.8, speed=1.0, pbar=None, format=None, position=None, quiet=False, stream=False):
        tic = time.perf_counter()
        self.log(f"Generating audio for:\n{text}")
        language = self.language

        texts = self.split_sentences_into_pieces(text, language, quiet)

        audio_list = []
        if pbar:
            tx = pbar(texts)
        else:
            if position:
                tx = tqdm(texts, position=position)
            elif quiet:
                tx = texts
            else:
                tx = tqdm(texts)
        for t in tx:
            if language in ['EN', 'ZH_MIX_EN']:
                t = re.sub(r'([a-z])([A-Z])', r'\1 \2', t)
            device = self.device
            bert, ja_bert, phones, tones, lang_ids = utils.get_text_for_tts_infer(t, language, self.hps, device, self.symbol_to_id)
            with torch.no_grad():
                x_tst = phones.to(device).unsqueeze(0)
                tones = tones.to(device).unsqueeze(0)
                lang_ids = lang_ids.to(device).unsqueeze(0)
                bert = bert.to(device).unsqueeze(0)
                ja_bert = ja_bert.to(device).unsqueeze(0)
                x_tst_lengths = torch.LongTensor([phones.size(0)]).to(device)
                del phones
                speakers = torch.LongTensor([speaker_id]).to(device)
                audio = self.model.infer(
                        x_tst,
                        x_tst_lengths,
                        speakers,
                        tones,
                        lang_ids,
                        bert,
                        ja_bert,
                        sdp_ratio=sdp_ratio,
                        noise_scale=noise_scale,
                        noise_scale_w=noise_scale_w,
                        length_scale=1. / speed,
                    )[0][0, 0].data.cpu().float().numpy()
                del x_tst, tones, lang_ids, bert, ja_bert, x_tst_lengths, speakers

            # Save audio data chunk by chunk
            if stream:
                # Convert audio to 16-bit PCM format
                audio = (audio * 32767).astype(np.int16)

                if not os.path.exists(output_path):
                    # If the file doesn't exist, create it and write the audio data to it
                    with wave.open(output_path, 'wb') as wf:
                        wf.setnchannels(1)
                        wf.setsampwidth(2) # 2 bytes for 16-bit PCM
                        wf.setframerate(self.hps.data.sampling_rate)
                        wf.writeframes(audio.tobytes())
                else:
                    with wave.open(output_path, 'rb') as wf:
                        params = wf.getparams()
                        old_audio = np.frombuffer(wf.readframes(params.nframes), dtype=np.int16)
                    new_audio = np.concatenate([old_audio, audio])

                    with wave.open(output_path, 'wb') as wf:
                        wf.setparams(params)
                        wf.writeframes(new_audio.tobytes())

                time.sleep(2)
                self.log(f"Audio chunk saved")
            else:
                audio_list.append(audio)

        toc = time.perf_counter()
        self.log(f"Time taken to generate audio: {toc - tic:0.4f} seconds")

        # Concatenate audio segments and save the entire audio to file
        if not stream:
            audio = self.audio_numpy_concat(audio_list, sr=self.hps.data.sampling_rate, speed=speed)

            del audio_list
            if self.device == 'cuda':
                torch.cuda.empty_cache()
            if self.device == 'mps':
                torch.mps.empty_cache()

            if output_path is None:
                return audio
            else:
                if format:
                    soundfile.write(output_path, audio, self.hps.data.sampling_rate, format=format)
                else:
                    soundfile.write(output_path, audio, self.hps.data.sampling_rate)

    @staticmethod
    def log(*args, **kwargs):
        print('[TTS]', *args, **kwargs)
