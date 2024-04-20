import os
from bridges.python.src.sdk.leon import leon
from bridges.python.src.sdk.network import Network
from bridges.python.src.sdk.types import ActionParams


def run(params: ActionParams) -> None:
    """Define the winner"""

    print('params', params)

    target_language = 'French'
    text_to_translate = params['utterance']
    network = Network({'base_url': f'{os.environ["LEON_HOST"]}:{os.environ["LEON_PORT"]}/api/v1'})

    leon.answer({
        'key': 'translate',
        'data': {
            'output': f'Translating "{text_to_translate}" to {target_language}'
        }
    })
