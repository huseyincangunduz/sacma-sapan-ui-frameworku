import { NeolitChild, NeolitComponent } from "@ubs-platform/neolit/core";


type ComponentConstructor = new () => NeolitComponent;
type Tag = string | ComponentConstructor;
type Props = Record<string, unknown> | null;

function normalizeChild(child: NeolitChild): Node {
    if (child === null || child === undefined) return document.createTextNode("");
    if (typeof child === "string" || typeof child === "number") {
        return document.createTextNode(String(child));
    }
    return child;
}

export function jsx(tag: Tag, props: Props & { children?: NeolitChild | NeolitChild[] }): HTMLElement {
    const { children, ...attrs } = props ?? {};

    if (typeof tag === "function") {
        const instance = new tag();
        return instance.render();
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
        children.forEach(child => el.appendChild(normalizeChild(child)));
    } else if (children !== undefined) {
        el.appendChild(normalizeChild(children));
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
