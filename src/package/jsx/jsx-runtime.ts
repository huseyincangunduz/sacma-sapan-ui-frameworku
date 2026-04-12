import { getStateValue, isState, NeolitChild, NeolitComponent, NeolitNode, State, StateOrPlain } from "@ubs-platform/neolit/core";


type ComponentConstructor = new (props?: Record<string, any>) => NeolitComponent;
type Tag = string | ComponentConstructor;
type Props = Record<string, unknown> | null;

export interface ComponentRenderResult {
    componentInstance: NeolitComponent;
    element: NeolitNode | NeolitNode[];
}

type JsxChild = NeolitChild | ComponentRenderResult;

function manupileElementByStateOrNot(element: HTMLElement, stateOrPlain: StateOrPlain<any>, callback: (value: any) => void) {
    if (isState(stateOrPlain)) {
        const cb = () => callback(getStateValue(stateOrPlain));
        stateOrPlain.subscribe(cb);
        callback(getStateValue(stateOrPlain));
        element.addEventListener("close", () => stateOrPlain.unsubscribe(cb));
    } else {
        callback(stateOrPlain);
    }
}

function setAttributeWithStateSupport(element: HTMLElement, attributeKey: string, stateOrPlainValue: StateOrPlain<any>): void {
    manupileElementByStateOrNot(element, stateOrPlainValue, (value) => {
        element.setAttribute(attributeKey, String(value));
    });
}

function setStyleWithStateSupport(element: HTMLElement, styleKey: string, stateOrPlainValue: StateOrPlain<any>): void {
    manupileElementByStateOrNot(element, stateOrPlainValue, (value) => {
        Object.assign(element.style, { [styleKey]: value });
    });
}




function normalizeChild(child: NeolitChild): Node {
    if (child === null || child === undefined) return document.createTextNode("");
    if (child instanceof State) {
        const textNode = document.createTextNode(child.toString());
        child.subscribe(() => {
            textNode.textContent = child.toString();
        });
        return textNode;
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
        const instance = new tag(props);
        return { componentInstance: instance, element: instance.render() };
    }

    const el = document.createElement(tag);

    for (const [attributeKey, attributeValue] of Object.entries(attrs ?? {})) {
        if (attributeKey.startsWith("on") && typeof attributeValue === "function") {
            const eventName = attributeKey.slice(2).toLowerCase();
            el.addEventListener(eventName, attributeValue as EventListener);
        } else if (attributeKey === "style") {
            if (typeof attributeValue === "object") {
                for (const [styleKey, styleValue] of Object.entries(attributeValue!)) {
                    setStyleWithStateSupport(el, styleKey, styleValue);
                }
            }
        }
        else {
            if (attributeKey === 'className' || attributeKey === 'klass') {
                setAttributeWithStateSupport(el, 'class', attributeValue);
            } else {
                setAttributeWithStateSupport(el, attributeKey, attributeValue);
            }
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
