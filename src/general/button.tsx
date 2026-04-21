import { NeolitComponent, StateOrPlain } from "@ubs-platform/neolit/core";
export interface ButtonProperties {
  onclick: (e: MouseEvent) => void;
  children?: any;
  disabled?: StateOrPlain<boolean>;
}
export class Button extends NeolitComponent<ButtonProperties> {
  properties = {
    disabled: false,
    children: null,
    onclick: () => {},
  }

  render() {
    return (
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={this.properties.onclick}
        disabled={this.properties.disabled }
      >
        {this.properties.children}
      </button>
    );
  }
}
