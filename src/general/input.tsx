import {
  isState,
  NeolitComponent,
  state,
  StateOrPlain,
} from "@ubs-platform/neolit/core";

export interface InputProperties {
  value: StateOrPlain<string>;
  onInput?: (e: InputEvent) => void;
  placeholder?: string;
}

export class Input extends NeolitComponent {
  properties: InputProperties = {
    value: state(""),
    onInput: () => {},
    placeholder: "",
  };

  onInputEvent(e: InputEvent) {
    if (this.properties.onInput) {
      this.properties.onInput(e);
    }

    if (this.properties.value && isState(this.properties.value)) {
      this.properties.value.set((e.target as HTMLInputElement).value);
    }
  }

  render() {
    return (
      <input
        value={this.properties.value}
        onInput={(e: InputEvent) => this.onInputEvent(e)}
        placeholder={this.properties.placeholder}
        className="px-4 py-2 border rounded"
      />
    );
  }
}
