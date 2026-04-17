// import "./button.css";
import { NeolitComponent, StateOrPlain } from "@ubs-platform/neolit/core";
export interface ButtonProperties {
  onclick: (e: MouseEvent) => void;
  children?: any;
  disabled?: StateOrPlain<boolean>;
}
export class Button extends NeolitComponent {
  onclick: (e: MouseEvent) => void;
  children: any;
  disabled: StateOrPlain<boolean>;
  /**
   *
   */
  constructor({ onclick, children, disabled }: ButtonProperties) {
    super();
    this.onclick = onclick;
    this.children = children;
    this.disabled = disabled || false;
  }

  render() {
    return (
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={this.onclick}
        disable={this.disabled}
      >
        {this.children}
      </button>
    );
  }
}
