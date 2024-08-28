from typing import TypedDict
from bridges.python.src.sdk.aurora.list import List
from bridges.python.src.sdk.aurora.list_item import ListItem
from bridges.python.src.sdk.aurora.text import Text

from bridges.python.src.sdk.widget import Widget, WidgetOptions
from bridges.python.src.sdk.widget_component import WidgetComponent


class ListOfListsWidgetParams(TypedDict):
    list_names: list[str]


class ListOfListsWidget(Widget[ListOfListsWidgetParams]):
    def __init__(self, options: WidgetOptions[ListOfListsWidgetParams]):
        super().__init__(options)

    def render(self) -> WidgetComponent:
        return List({
            'children': [
                ListItem({
                    'children': [Text({
                        'children': 'List 1'
                    })],
                    'align': 'center',
                    # TODO: error here
                    # 'onClick': lambda: self.send_utterance('List 1')
                    'onClick': lambda: self.send_utterance('List 1')
                }),
                ListItem({
                    'children': [Text({
                        'children': 'List 2'
                    })]
                }),
                ListItem({
                    'children': [Text({
                        'children': 'List 3'
                    })]
                })
            ]
        })
