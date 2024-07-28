import { type ButtonProps } from '@leon-ai/aurora'

import { WidgetComponent } from '../widget-component'

export class Button extends WidgetComponent<ButtonProps> {
  constructor(props: ButtonProps) {
    super(props)
  }
}

/*
import { type ButtonProps } from '@leon-ai/aurora';
import { WidgetComponent } from '../widget-component';

export class Button extends WidgetComponent<ButtonProps> {
  private buttonElement: HTMLButtonElement;

  constructor(props: ButtonProps) {
    super(props);
    this.buttonElement = document.createElement('button');
    this.initialize();
  }

  private initialize(): void {
    // Set button properties from props
    if (this.props.type) {
      this.buttonElement.type = this.props.type;
    }
    if (this.props.disabled) {
      this.buttonElement.disabled = true;
    }
    if (this.props.loading) {
      // Handle loading state, e.g., show a loader icon
    }
    // Attach event listeners
    if (this.props.onClick) {
      this.buttonElement.addEventListener('click', this.props.onClick);
    }
    // Set classes and other attributes as needed
  }

  public render(): HTMLElement {
    // Assuming children is a string or HTMLElement. For more complex scenarios, this needs to be expanded.
    if (typeof this.props.children === 'string') {
      this.buttonElement.textContent = this.props.children;
    } else if (this.props.children instanceof HTMLElement) {
      this.buttonElement.appendChild(this.props.children);
    }
    return this.buttonElement;
  }

  // Example method to mount the button to a specific container
  public mountTo(container: HTMLElement): void {
    container.appendChild(this.render());
  }
}*/

// SERVER
// WebSocket server setup
/*
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    // Determine response based on message
    const response = determineResponse(message);
    // Send response back to client
    ws.send(response);
  });
});

function determineResponse(message) {
  // Logic to determine response based on message
  // This could involve rendering a React component to a string
  return "Response or React component as a string";
}*/

// CLIENT

// Establish WebSocket connection
/*const socket = new WebSocket('ws://localhost:8080');

// Listen for messages
socket.addEventListener('message', function (event) {
  console.log('Message from server ', event.data);
  // Assuming event.data is a React component as a string
  // Render this component into the DOM
  renderComponent(event.data);
});

function renderComponent(componentString) {
  // Convert the string to a React component
  // This might involve using a library like 'html-react-parser'
  const component = parseComponentFromString(componentString);
  // Render the component into the chat UI
  ReactDOM.render(component, document.getElementById('chat'));
}

function parseComponentFromString(string) {
  // Use html-react-parser or similar to parse string to React component
  return HTMLReactParser(string);
}*/
