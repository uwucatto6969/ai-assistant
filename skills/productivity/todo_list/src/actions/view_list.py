from bridges.python.src.sdk.leon import leon
from bridges.python.src.sdk.types import ActionParams
from bridges.python.src.sdk.widget import WidgetOptions
from ..widgets.todos_list_widget import TodosListWidget, TodosListWidgetParams
from ..lib import memory

from typing import Union


def run(params: ActionParams) -> None:
    """View a to-do list"""

    list_name: Union[str, None] = None

    for item in params['entities']:
        if item['entity'] == 'list':
            list_name = item['sourceText'].lower()

    if list_name is None:
        return leon.answer({'key': 'list_not_provided'})

    if not memory.has_todo_list(list_name):
        return leon.answer({
            'key': 'list_does_not_exist',
            'data': {
                'list': list_name
            }
        })

    todos = memory.get_todo_items(list_name)

    if len(todos) == 0:
        return leon.answer({
            'key': 'empty_list',
            'data': {
                'list': list_name
            }
        })

    todos_list_options: WidgetOptions[TodosListWidgetParams] = WidgetOptions(
        wrapper_props={'noPadding': True},
        params={'list_name': list_name, 'todos': todos}
    )
    todos_list_widget = TodosListWidget(todos_list_options)

    leon.answer({'widget': todos_list_widget})
