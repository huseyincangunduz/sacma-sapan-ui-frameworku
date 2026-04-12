import { State } from "./state";

export type NeolitNode = HTMLElement | Text | Comment;
export type NeolitChild = NeolitNode | State<any> | string | number | null | undefined;