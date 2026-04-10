import { NeolitComponent } from "./component";

export class Operation {
    
    renderMainComponent(mainElement: HTMLElement, component: NeolitComponent): void {
        component.mount(mainElement)
    }
}