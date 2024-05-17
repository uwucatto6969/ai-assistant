from cx_Freeze import setup, Executable
import sysconfig
import sys

from version import __version__

"""
Increase the recursion limit to avoid RecursionError
@see: https://github.com/marcelotduarte/cx_Freeze/issues/2240
"""
sys.setrecursionlimit(sys.getrecursionlimit() * 10)

"""
Instead of injecting everything from a package,
it's recommended to only include the necessary files via the
"include_files" property.
"""
options = {
    'build_exe': {
        'packages': [
            'spacy',
            'en_core_web_trf',
            'fr_core_news_md',
            'pycrfsuite'
        ],
        'includes': [
            'srsly.msgpack.util',
            'blis',
            'cymem'
        ],
        'include_files': [
            ('tcp_server/src/.venv/lib/python3.9/site-packages/nvidia/cudnn/lib', 'lib/nvidia/cudnn/lib')
        ]
    }
}

# Include private libraries from the tokenizers package for Linux
if 'linux' in sysconfig.get_platform():
    options['build_exe']['include_files'] = [
        *options['build_exe']['include_files'],
        ('tcp_server/src/.venv/lib/python3.9/site-packages/tokenizers.libs', 'lib/tokenizers.libs')
    ]

executables = [
    Executable(
        script='tcp_server/src/main.py',
        target_name='leon-tcp-server'
    )
]

setup(
    name='leon-tcp-server',
    version=__version__,
    executables=executables,
    options=options
)
