import { NeolitChild, NeolitComponent, NeolitNode, State } from "@ubs-platform/neolit/core";


type ComponentConstructor = new () => NeolitComponent;
type Tag = string | ComponentConstructor;
type Props = Record<string, unknown> | null;

export interface ComponentRenderResult {
    componentInstance: NeolitComponent;
    element: NeolitNode;
}

type JsxChild = NeolitChild | ComponentRenderResult;

function normalizeChild(child: NeolitChild): Node {
    if (child === null || child === undefined) return document.createTextNode("");
    if (child instanceof State) {
        return document.createTextNode(child.toString());
    }
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(String(child));
    }
    return child as Node;
}

function isComponentRenderResult(value: JsxChild): value is ComponentRenderResult {
    return typeof value === "object"
        && value !== null
        && "componentInstance" in value
        && "element" in value;
}

function appendJsxChild(parent: HTMLElement, child: JsxChild): void {
    if (isComponentRenderResult(child)) {
        child.componentInstance.mount(parent, child.element);
        return;
    }
    if (Array.isArray(child)) {
        child.forEach(c => appendJsxChild(parent, c));
        return;
    }
    parent.appendChild(normalizeChild(child));
}

export function jsx(tag: ComponentConstructor, props: Props & { children?: JsxChild[] | JsxChild }): ComponentRenderResult;
export function jsx(tag: string, props: Props & { children?: JsxChild[] | JsxChild }): HTMLElement;
export function jsx(tag: Tag, props: Props & { children?: JsxChild[] | JsxChild }): ComponentRenderResult | HTMLElement {
    const { children, ...attrs } = props ?? {};

    if (typeof tag === "function") {
        const instance = new tag();
        return { componentInstance: instance, element: instance.render() };
    }

    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs ?? {})) {
        if (key.startsWith("on") && typeof value === "function") {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, value as EventListener);
        } else {
            el.setAttribute(key, String(value));
        }
    }

    if (Array.isArray(children)) {
        children.forEach(child => appendJsxChild(el, child));
    } else if (children !== undefined) {
        appendJsxChild(el, children);
    }

    return el;
}

export const jsxs = jsx;

export const Fragment = "neolit-fragment" as unknown as Tag;

declare global {
    namespace JSX {
        type Element = HTMLElement;
        interface IntrinsicElements {
            [tag: string]: Record<string, unknown>;
        }
    }
}
