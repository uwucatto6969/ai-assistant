from typing import Any, Optional, Generic, TypeVar, Literal, TypedDict, Union, Dict
from dataclasses import dataclass
from abc import ABC, abstractmethod
import random

from .widget_component import WidgetComponent
from ..constants import SKILL_CONFIG, INTENT_OBJECT

T = TypeVar('T')

UtteranceSender = Literal['leon', 'owner']


class FetchWidgetDataWidgetEventMethodParams(TypedDict):
    action_name: str
    widget_id: str
    data_to_set: list[str]


class SendUtteranceWidgetEventMethodParams(TypedDict):
    from_: UtteranceSender
    utterance: str


class RunSkillActionWidgetEventMethodParams(TypedDict):
    action_name: str
    params: Dict[str, Any]


class SendUtteranceOptions(TypedDict, total=False):
    from_: Optional[UtteranceSender]
    data: Optional[Dict[str, Any]]


class WidgetEventMethod(TypedDict):
    methodName: Literal['send_utterance', 'run_skill_action']
    methodParams: Union[
        SendUtteranceWidgetEventMethodParams,
        RunSkillActionWidgetEventMethodParams,
        FetchWidgetDataWidgetEventMethodParams
    ]


@dataclass
class WidgetOptions(Generic[T]):
    wrapper_props: dict[str, Any] = None
    params: T = None
    on_fetch_action: Optional[str] = None


class Widget(ABC, Generic[T]):
    def __init__(self, options: WidgetOptions[T]):
        self.action_name = f"{INTENT_OBJECT['domain']}:{INTENT_OBJECT['skill']}:{INTENT_OBJECT['action']}"
        self.widget = self.__class__.__name__
        self.id = f"{self.widget.lower()}-{random.randint(100000, 999999)}"
        self.wrapper_props = options.wrapper_props
        self.params = options.params
        self.on_fetch_action = f"{INTENT_OBJECT['domain']}:{INTENT_OBJECT['skill']}:{options.on_fetch_action}" \
            if options.on_fetch_action else None

    @abstractmethod
    def render(self) -> WidgetComponent:
        pass

    def send_utterance(self, key: str, options: Optional[Dict[str, Any]] = None) -> WidgetEventMethod:
        """
        Indicate the core to send a given utterance
        :param key: The key of the content
        :param options: The options of the utterance
        """
        utterance_content = self.content(key, options.get('data') if options else None)
        from_ = options.get('from', 'owner') if options else 'owner'

        return WidgetEventMethod(
            methodName='send_utterance',
            methodParams={
                'from': from_,
                'utterance': utterance_content
            }
        )

    def run_skill_action(self, action_name: str, params: Dict[str, Any]) -> WidgetEventMethod:
        """
        Indicate the core to run a given skill action
        :param action_name: The name of the action
        :param params: The parameters of the action
        """
        return WidgetEventMethod(
            methodName='run_skill_action',
            methodParams={
                'actionName': action_name,
                'params': params
            }
        )

    def content(self, key: str, data: Optional[Dict[str, Any]] = None) -> str:
        """
        Grab and compute the target content of the widget
        :param key: The key of the content
        :param data: The data to apply
        """
        widget_contents = SKILL_CONFIG.get('widget_contents', {})

        if key not in widget_contents:
            return 'INVALID'

        content = widget_contents[key]

        if isinstance(content, list):
            content = random.choice(content)

        if data:
            for k, v in data.items():
                content = content.replace(f'%{k}%', str(v))

        return content
