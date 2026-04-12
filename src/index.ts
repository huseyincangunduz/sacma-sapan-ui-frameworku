import { Introduction } from "./landing/introduction";

import { Injectable, Inject, inject } from "@ubs-platform/neolit/injectables";

const API_URL = Symbol("API_URL");

@Injectable({ providedIn: "root" })
class Logger {
  constructor(
  ) {}

  public info(message: string): void {
    console.info(`[Logger]: ${message}`);
  }
}


@Injectable({ providedIn: "root" })
class ApiService {
    constructor(
        private logger: Logger,
    ) {}

    public fetchData(): void {
        debugger
        this.logger.info(`Fetching data from api url...`);
        // Simulate fetching data...
    }
}

// Manually register API_URL value in the root injector
inject(ApiService).fetchData(); // This will throw an error because API_URL is not registered


document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    if (!root) {
        console.error("Root element not found");
        return;
    }
    const component = new Introduction();
    component.mount(root);
});