import { Introduction } from "./landing/introduction";

import { InjectHolder, Injectable, createInjector, inject, rootInjector } from "@ubs-platform/neolit/injectables";
import { BookList } from "./lotus-app/components/book-list";
import axios from "axios";

rootInjector.registerValue("app-axios-instance", axios.create({
    baseURL: "",
    timeout: 1000,
}));

document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("root");
    if (!root) {
        console.error("Root element not found");
        return;
    }
    const component = new Introduction();

    // const component = new BookList();
    component.mount(root);
});