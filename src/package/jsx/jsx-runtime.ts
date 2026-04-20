import { computed, getStateValue, isState, NeolitChild, NeolitComponent, State, StateOrPlain } from "@ubs-platform/neolit/core";

type ComponentConstructor = new (props?: Record<string, any>) => NeolitComponent;
type Tag = string | ComponentConstructor;
type Props = Record<string, unknown> | null;


type JsxChild = NeolitChild | NeolitComponent;

// --- State binding helpers ---

function bindToStateOrPlain(element: HTMLElement, stateOrPlain: StateOrPlain<any>, callback: (value: any) => void) {
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
    bindToStateOrPlain(element, stateOrPlainValue, (value) => {
        element.setAttribute(attributeKey, String(value));
    });
}

function setStyleWithStateSupport(element: HTMLElement, styleKey: string, stateOrPlainValue: StateOrPlain<any>): void {
    bindToStateOrPlain(element, stateOrPlainValue, (value) => {
        if (styleKey.startsWith("--")) {
            element.style.setProperty(styleKey, String(value));
            return;
        }
        Object.assign(element.style, { [styleKey]: value });
    });
}

// --- Child helpers ---

function normalizeChild(child: NeolitChild): Node {
    if (child === null || child === undefined) return document.createTextNode("");
    if (child instanceof State) {
        const textNode = document.createTextNode(child.toString());
        child.subscribe(() => { textNode.textContent = child.toString(); });
        return textNode;
    }
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(String(child));
    }
    if (typeof child === "number") {
        return document.createTextNode(String(child));
    }
    if (typeof child === "boolean") {
        return document.createTextNode("");
    }
    return child as Node;
}

// function isComponentRenderResult(value: JsxChild): value is ComponentRenderResult {
//     return typeof value === "object"
//         && value !== null
//         && "componentInstance" in value
// }

function appendJsxChild(parent: HTMLElement, child: JsxChild): void {
    if (child instanceof NeolitComponent) {
        child.mount(parent);
        return;
    }
    if (Array.isArray(child)) {
        child.forEach(c => appendJsxChild(parent, c));
        return;
    }
    parent.appendChild(normalizeChild(child as NeolitChild));
}

function appendJsxChildOrFunction(parent: HTMLElement, child: JsxChild | (() => JsxChild)): void {
    if (typeof child === "function") {
        const result = (child as () => JsxChild)();
        if (result instanceof NeolitComponent) {
            appendJsxChild(parent, result);
        } else {
            console.warn("JSX child function must return a NeolitComponent instance. Got:", result);
        }
    } else {
        appendJsxChild(parent, child);
    }
}

function toChildArray(children: JsxChild[] | JsxChild | undefined): (JsxChild | (() => JsxChild))[] {
    if (children === undefined) return [];
    return Array.isArray(children) ? children : [children];
}

// --- Prop helpers ---

function applyClassName(el: HTMLElement, value: StateOrPlain<any> | Record<string, StateOrPlain<any>> | (StateOrPlain<any>)[]): void {
    if (typeof value === "object" && !(value instanceof Array) && !isState(value)) {
        // TODO: value bir state ise veya value bir state değilse ama değeri boolean ise,
        // classKey'i ekle veya çıkar. Yani classValue true ise classKey'i ekle, false ise classKey'i çıkar.
        for (const [classKey, classValue] of Object.entries(value!)) {
            bindToStateOrPlain(el, classValue as StateOrPlain<any>, (v) => {
                console.info("Applying class ", classKey, " with value ", v);
                el.classList.toggle(classKey, !!v);
            });
        }
    } else if (value instanceof Array && !isState(value)) {
        const statesListened = value.filter(isState);
        const classNamesComputed = computed(statesListened, () => value.filter(v => !!v).map((v) => getStateValue(v)).join(" "))
        setAttributeWithStateSupport(el, "class", classNamesComputed);
    } else {
        setAttributeWithStateSupport(el, "class", value);
    }
}

function applyProps(el: HTMLElement, attrs: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(attrs)) {
        if (key.startsWith("on") && typeof value === "function") {
            el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
        } else if (key === "style" && typeof value === "object") {
            for (const [styleKey, styleValue] of Object.entries(value!)) {
                setStyleWithStateSupport(el, styleKey, styleValue);
            }
        } else if (key === "className" || key === "klass") {
            applyClassName(el, value);
        } else if (el.tagName === "INPUT" && (key === "value" || key === "checked")) {
            // INPUT elementlerinde value ve checked özellikleri attribute değil property olarak setlenir.
            bindToStateOrPlain(el, value as StateOrPlain<any>, (v) => {
                (el as HTMLInputElement)[key as "value" | "checked"] = v as never;
            });
        }

        else {
            setAttributeWithStateSupport(el, key, value);
        }
    }
}

// --- JSX factory ---

export function jsx(tag: ComponentConstructor, props: Props & { children?: JsxChild[] | JsxChild }): NeolitComponent;
export function jsx(tag: string, props: Props & { children?: JsxChild[] | JsxChild }): HTMLElement;
export function jsx(tag: Tag, props: Props & { children?: JsxChild[] | JsxChild }): NeolitComponent | HTMLElement {
    const { children, ...attrs } = props ?? {};

    if (typeof tag === "function") {
        const instance = new tag(props);
        return instance;
    }

    const el = document.createElement(tag);
    applyProps(el, attrs);
    toChildArray(children).forEach(child => appendJsxChildOrFunction(el, child));
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
