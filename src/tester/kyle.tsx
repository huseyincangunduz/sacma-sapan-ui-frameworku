import { NeolitComponent, NeolitNode, state } from "../package/core";
import { Outlet, RouteMap, Router, UrlParameters } from "../package/routing";
export class KyleDaily extends NeolitComponent {
  render(): NeolitNode | NeolitNode[] | NeolitComponent | null {
    return <img src="/assets/kyle-daily.gif"></img>;
  }
}
export class ElfKing extends NeolitComponent {
  render(): NeolitNode | NeolitNode[] | NeolitComponent | null {
    return <img src="/assets/kyle-elfking.webp"></img>;
  }
}
export class Humankite extends NeolitComponent {
  render(): NeolitNode | NeolitNode[] | NeolitComponent | null {
    return <img src="/assets/kyle-humankite.png"></img>;
  }
}

export class KyleBroflovski extends NeolitComponent<UrlParameters> {
  imageSrc = state("");
  imageAlt = state("");
  router!: Router;


  onInit(): void {
    this.router = new Router({
      initialPath: this.properties.childrenPath!,
      routeMap: new RouteMap([
        {
          path: "",
          componentFactory: () => <KyleDaily />,
        },
        {
          path: "daily",
          componentFactory: () => <KyleDaily />,
        },
        {
          path: "elf-king",
          componentFactory: () => <ElfKing />,
        },
        {
          path: "human-kite",
          componentFactory: () => <Humankite />,
        },
      ]),
    });
  }

  render(): NeolitNode {
    return (
      <>
        {/* <div>{this.properties.childrenPath || "No path"}</div> */}
        <Outlet router={this.router} />
      </>
    );
  }
}
