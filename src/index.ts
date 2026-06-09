
import { App } from "./app";


// Bootstrap

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    if (!root) {
        console.error("Root element not found");
        return;
    }
    const component = new App();

    // const component = new BookList();
    component.mount(root);
});