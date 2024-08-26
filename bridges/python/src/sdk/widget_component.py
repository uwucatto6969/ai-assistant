from typing import TypeVar, Generic, TypedDict, List, Any
import random
import string

T = TypeVar('T', TypedDict, dict)

SUPPORTED_WIDGET_EVENTS = [
    'onClick',
    'onSubmit',
    'onChange',
    'onStart',
    'onEnd'
]


def generate_id() -> str:
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))


class WidgetEvent:
    def __init__(self, type: str, id: str, method: Any):
        self.type = type
        self.id = id
        self.method = method


class WidgetComponent(Generic[T]):
    def __init__(self, props: T):
        self.component = type(self).__name__
        self.id = f'{self.component.lower()}-{generate_id()}'
        self.props = props
        self.events = self.parse_events()

    def __dict__(self):
        children_value = self.props.get('children')
        rest_of_values = {key: value for key, value in self.props.items() if key != 'children'}
        children = None

        if children_value is not None:
            if isinstance(children_value, list):
                children = []
                for child in children_value:
                    if isinstance(child, WidgetComponent):
                        children.append(child.__dict__())
                    else:
                        children.append(child)
            else:
                children = children_value

        result = {
            'component': self.component,
            'id': self.id,
            'props': {
                **rest_of_values,
                'children': children
            },
            'events': [event.__dict__() for event in self.events]
        }

        return result

    def parse_events(self) -> List[WidgetEvent]:
        if not self.props:
            return []

        event_types = [key for key in self.props if key.startswith('on') and key in SUPPORTED_WIDGET_EVENTS]

        events = []
        for event_type in event_types:
            event_id = f'{self.id}_{event_type.lower()}-{generate_id()}'
            event_method = getattr(self.props, event_type)
            events.append(WidgetEvent(event_type, event_id, event_method))

        return events
