import { HelloWorld } from "./hello-world";
import { jsx } from "@ubs-platform/neolit/jsx-runtime";

const element = jsx(HelloWorld, {});

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    if (root) {
        root.appendChild(element);
    }
});