import { NeolitComponent, NeolitNode, state } from "./package/core";

export class KyleBroflovski extends NeolitComponent {
    imageSrc = state("");
    imageAlt = state("")
    alterEgos = [
        { name: "Günlük", src: "assets/kyle-daily.gif" },
        { name: "Elf Kralı", src: "assets/kyle-elfking.webp" },
        { name: "İnsan uçurtma", src: "assets/kyle-humankite.png" },

    ]
    constructor() {
        super();
    }

    setAlterEgo({ name, src }: Record<string, string>) {
        this.imageSrc.set(src);
        this.imageAlt.set(name);
    }

    render(): NeolitNode {
        return <div>
            <h2 style={{backgroundColor: "orange", color: "green"}}>Kyle Alter Egos</h2>
            {
                this.alterEgos.map(a => <button onclick={() => this.setAlterEgo(a)}>{a.name}</button>)
            }
            <img src={this.imageSrc} alt={this.imageAlt} height="200" />
        </div>;
    }
}