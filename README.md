# Neolit

> **⚠️ WARNING: This project is under active development and is NOT suitable for production use. APIs may change without notice, and the library may contain bugs or incomplete features. Use at your own risk.**

A lightweight, class-based, declarative UI framework for building web interfaces with TypeScript and JSX. Neolit renders directly to real DOM elements (no virtual DOM) and features fine-grained reactive state, structural directives, and Angular-style dependency injection.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Components](#components)
  - [State](#state)
  - [JSX](#jsx)
  - [Structural Directives](#structural-directives)
    - [`fromState` fluent API](#fromstate--fluent-builder-api)
  - [Dependency Injection](#dependency-injection)
  - [Routing](#routing)
- [Scripts](#scripts)
- [Package Entrypoints](#package-entrypoints)

---

## Installation

```bash
npm install @ubs-platform/neolit
```

Configure your `tsconfig.json` to use the custom JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@ubs-platform/neolit"
  }
}
```

---

## Quick Start

```tsx
import { NeolitComponent, state } from "@ubs-platform/neolit/core";

class Counter extends NeolitComponent {
    private count = state(0);

    render() {
        return (
            <div>
                <p>Count: {this.count}</p>
                <button onclick={() => this.count.update(n => n + 1)}>
                    Increment
                </button>
            </div>
        );
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new Counter().mount(document.getElementById("root")!);
});
```

---

## Core Concepts

### Components

All components extend `NeolitComponent` and implement a `render()` method that returns DOM nodes via JSX. You can type incoming JSX props with a generic parameter.

```tsx
import { NeolitComponent } from "@ubs-platform/neolit/core";

interface GreetingProps {
    name: string;
}

class Greeting extends NeolitComponent<GreetingProps> {
    onInit() {
        // this.properties is fully populated before onInit is called
        console.log(this.properties.name); // "World"
    }

    render() {
        return <h1>Hello, {this.properties.name}!</h1>;
    }
}

// Use in JSX — props are mapped to this.properties automatically:
<Greeting name="World" />
```

Props passed in JSX are stored in `this.properties` before `onInit()` is called, so they are available in both `onInit()` and `render()`. If a prop value is a `State`, it is bound two-way: changes to the incoming state propagate in, and changes inside the component propagate out.

**Key methods:**

| Method | Description |
|---|---|
| `mount(target)` | Attach component to a DOM element |
| `destroy()` | Remove from DOM and clean up subscriptions |
| `onInit()` | Optional lifecycle hook called after props are assigned, before first render |
| `watchToRerender(state)` | Re-render the entire component when a state changes |
| `rerender()` | Manually trigger a full re-render |

> For partial/scoped updates, prefer the `Stateful` structural directive over `watchToRerender`.

---

### State

Neolit's reactive state system avoids full re-renders by updating only the affected DOM nodes.

```ts
import { state, computed, asyncState } from "@ubs-platform/neolit/core";

// Basic reactive state
const count = state(0);
count.get();               // 0
count.set(5);              // set to 5
count.update(n => n + 1);  // increment
count.subscribe(val => console.log(val)); // listen to changes
count.unsubscribe(listener);             // remove a listener

// Derive a new state
const doubled = count.map(n => n * 2);   // updates whenever count changes

// Array-specific helpers
const items = state([1, 2, 3, 4]);
const evens = items.arrayFilter(n => n % 2 === 0);      // State<number[]>
const labels = items.arrayMap((n, i) => `#${i}: ${n}`); // State<string[]>

// Computed state (multiple inputs)
const sum = computed([a, b], () => a.get() + b.get());

// Async state (wraps a Promise)
const users = asyncState(fetch("/api/users").then(r => r.json()), []);
// users.busy         → State<boolean>      (true while loading)
// users.error        → State<Error | null>
// users.setAsync(p)  — restart with a new promise
// users.allInComputed() — ComputedState<{ data, busy, error }>
```

Passing a `State` directly as a JSX child creates a **self-updating text node** — no re-render needed:

```tsx
render() {
    return <p>Value: {this.count}</p>; // auto-updates on change
}
```

---

### JSX

The JSX runtime maps tags to real DOM elements or component constructors.

```tsx
// HTML element
<div class="container">Hello</div>

// Component
<MyComponent />

// Event listeners (on* prefix)
<button onclick={() => doSomething()}>Click</button>

// Reactive style
<div style={{ color: this.textColor, fontSize: "16px" }} />

// Conditional class toggling
<div className={{ active: this.isActive, hidden: this.isHidden }} />

// Fragment
<>
    <p>First</p>
    <p>Second</p>
</>
```

---

### Structural Directives

Import from `@ubs-platform/neolit/structural`.

#### `fromState` — Fluent builder API

Instead of using `<For>`, `<If>`, and `<Stateful>` directly as JSX components, you can use the `fromState` helper for a chainable, fluent API.

```tsx
import { fromState } from "@ubs-platform/neolit/structural";

// Conditional rendering with an else branch
// fn receives the current state value
{fromState(this.isVisible)
  .renderIf((value) => <p>Value is: {value}</p>)
  .else(() => <small>Not visible.</small>)}

// Reactive list with a key function
{fromState(this.items)
  .keyFn(item => item.id)
  .renderFor((item, index) => <li>{item.name}</li>)}

// Scoped stateful re-render; fn receives the current value
{fromState(this.counter)
  .stateful((value) => <strong>{value}</strong>)}
```

| Method | Returns | Description |
|---|---|---|
| `fromState(state)` | `FromState` | Creates a builder for the given state |
| `.renderIf(fn)` | `() => If` | Renders `fn(value)` when state is truthy; `value` is the current state value |
| `.renderIf(fn).else(fn)` | `() => If` | Adds an else branch |
| `.keyFn(fn)` | `FromState` | Sets a key extractor for list rendering (chainable) |
| `.renderFor(fn)` | `() => For` | Renders each item in the state array |
| `.stateful(fn)` | `() => Stateful` | Scoped re-render on state change; `fn` receives the current value |

---

#### `For` — Reactive list rendering

Efficiently renders and updates lists. Caches nodes by key to avoid unnecessary re-renders on insert, remove, or reorder.

```tsx
import { For } from "@ubs-platform/neolit/structural";

// In render():
<For items={this.items} keyFn={(item) => item.id}>
    {(item, index) => <li>{item.name}</li>}
</For>
```

| Prop | Type | Description |
|---|---|---|
| `items` | `State<T[]>` | Reactive list |
| `children` | `(item, index) => NeolitNode` | Render function for each item |
| `keyFn` | `(item) => string \| number` | Key extractor for diffing |
| `compareItems` | `(a, b) => boolean` | Custom equality check |
| `strictKeys` | `boolean` | Enforce unique keys |

#### `If` — Conditional rendering

```tsx
import { If } from "@ubs-platform/neolit/structural";

<If condition={this.isVisible}>
    {() => <p>This is visible!</p>}
</If>

{/* With an else branch: */}
<If condition={this.isVisible} elseChildren={() => <p>Not visible.</p>}>
    {() => <p>This is visible!</p>}
</If>
```

#### `Stateful` — Scoped re-render boundary

Re-renders only its children when the given state changes, avoiding full component re-renders. The children function receives the current state value.

```tsx
import { Stateful } from "@ubs-platform/neolit/structural";

<Stateful state={this.counter}>
    {(value) => <strong>{value}</strong>}
</Stateful>
```

---

### Dependency Injection

An Angular-style DI system with singleton caching, circular dependency detection, and hierarchical injectors.

#### Registering services in root

```ts
import { Injectable } from "@ubs-platform/neolit/injectables";

// Singleton registered in the root injector automatically
@Injectable({ providedIn: "root" })
class LoggerService {
    log(message: string) {
        console.log(message);
    }
}
```

#### Registering services in a custom injector

```ts
import { Injectable, createInjector, rootInjector } from "@ubs-platform/neolit/injectables";

const featureInjector = createInjector(rootInjector);

@Injectable({ providedIn: featureInjector })
class FeatureLogger {
    log(message: string) {
        console.log("[feature]", message);
    }
}
```

If declaration order is a concern, you can also pass a getter:

```ts
@Injectable({ providedIn: () => featureInjector })
class FeatureLogger {}
```

#### Injecting services

```ts
import { inject } from "@ubs-platform/neolit/injectables";

class MyComponent extends NeolitComponent {
    private logger = inject(LoggerService);

    render() {
        this.logger.log("Rendered!");
        return <div>Hello</div>;
    }
}
```

You can also resolve against a specific injector:

```ts
const featureLogger = inject(FeatureLogger, featureInjector);
```

#### Registering arbitrary values

```ts
import { rootInjector } from "@ubs-platform/neolit/injectables";
import axios from "axios";

rootInjector.registerValue("http-client", axios.create({ baseURL: "/api" }));
```

#### Creating child injectors

```ts
import { createInjector, rootInjector } from "@ubs-platform/neolit/injectables";

const featureInjector = createInjector(rootInjector);

featureInjector.registerValue("feature-id", "books");
```

Child injectors fall back to their parent when a token is not registered locally.

#### Injecting non-class tokens

```ts
import { Injectable, Inject } from "@ubs-platform/neolit/injectables";

@Injectable({ providedIn: "root" })
class ApiService {
    constructor(@Inject("http-client") private http: typeof axios) {}
}

// or with deps array
@Injectable({ deps: ["http-client"] })
class ApiService {
    constructor(private http: typeof axios) {}
}
```

#### Dynamic local injectors

If you create injectors at runtime, prefer explicit registration over `providedIn`.

```ts
const localInjector = createInjector(rootInjector);
localInjector.registerClass(ApiService, ApiService);

const apiService = localInjector.resolve(ApiService);
```

This is usually a better fit for per-component, per-feature-instance, or per-request scopes.

**Provider types:**

| Type | Description |
|---|---|
| `useValue` | Register a plain value |
| `useClass` | Register a class (instantiated on first resolve) |
| `useFactory` | Register a factory function `(injector) => T` |

**Scope options for `@Injectable`:**

| Option | Description |
|---|---|
| `providedIn: "root"` | Registers into the global root injector |
| `providedIn: injectorInstance` | Registers into a specific injector |
| `providedIn: () => injectorInstance` | Lazily resolves the injector and registers there |

`createInjector(parent)` creates a new injector with optional parent fallback.

---

### Routing

Import from `@ubs-platform/neolit/routing`.

#### Defining routes

```ts
import { RouteMap } from "@ubs-platform/neolit/routing";

const routeMap = new RouteMap([
    {
        path: "/",
        componentFactory: () => <Home />,
    },
    {
        path: "/users/:id",
        componentFactory: (params) => <UserDetail userId={params.pathParameters.id} />,
        canActivate: async (params) => {
            // return true to allow, false for 404, or a path string to redirect
            return isLoggedIn();
        },
        childRoutes: [
            {
                path: "posts/:postId",
                componentFactory: (params) => <Post postId={params.pathParameters.postId} />,
            },
        ],
    },
]);
```

Path parameters are defined with `:name` segments. Query string parameters are parsed automatically.

#### Creating a router

```ts
import { Router } from "@ubs-platform/neolit/routing";

const router = new Router({
    routeMap,
    initialPath: window.location.pathname + window.location.search,
});

router.navigate("/users/42");   // push history + match route
router.replace("/users/42");    // replace history + match route
await router.sync("/users/42"); // match without history change
router.destroy();               // remove popstate listener

// Reactive state
// router.pathState        → State<string>                     current path
// router.activeRouteState → AsyncState<RouteMatch | null>     current matched route
```

#### Rendering with `Outlet`

```tsx
import { Outlet } from "@ubs-platform/neolit/routing";

// Pass an existing router:
<Outlet router={myRouter} />

// Or let Outlet create its own router:
<Outlet routeMap={routeMap} initialPath="/" />
```

`Outlet` renders the component returned by the matched route's `componentFactory`, or a `404 Not Found` message when no route matches.

**Route definition props:**

| Prop | Type | Description |
|---|---|---|
| `path` | `string` | URL path, supports `:param` segments |
| `componentFactory` | `(params) => NeolitNode` | Factory called with resolved URL parameters |
| `childRoutes` | `RouteInfo[]` | Nested routes |
| `canActivate` | `(params) => boolean \| string \| Promise<...>` | Guard: `true` allows, `false` shows 404, a string redirects |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build the demo application |
| `npm run preview` | Preview the production build |
| `npm run build:lib` | Build the distributable library to `dist/lib/` |

---

## Package Entrypoints

| Entrypoint | Contents |
|---|---|
| `@ubs-platform/neolit/core` | `NeolitComponent`, `State`, `ComputedState`, `AsyncState` |
| `@ubs-platform/neolit/injectables` | `Injectable`, `Inject`, `inject`, `rootInjector` |
| `@ubs-platform/neolit/structural` | `For`, `If`, `Stateful`, `fromState` |
| `@ubs-platform/neolit/routing` | `Router`, `RouteMap`, `Outlet` |
| `@ubs-platform/neolit/jsx-runtime` | JSX factory (for `tsconfig.json`) |
| `@ubs-platform/neolit/jsx-dev-runtime` | JSX dev factory |

---

> This project is developed and maintained by [ubs-platform](https://github.com/ubs-platform).
