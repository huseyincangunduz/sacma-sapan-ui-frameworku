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

All components extend `NeolitComponent` and implement a `render()` method that returns DOM nodes via JSX.

```tsx
import { NeolitComponent } from "@ubs-platform/neolit/core";

class MyComponent extends NeolitComponent {
    render() {
        return <h1>Hello, Neolit!</h1>;
    }
}

// Mount to DOM
const comp = new MyComponent();
comp.mount(document.getElementById("root")!);

// Unmount and clean up
comp.destroy();
```

**Key methods:**

| Method | Description |
|---|---|
| `mount(target)` | Attach component to a DOM element |
| `destroy()` | Remove from DOM and clean up subscriptions |
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
count.get();              // 0
count.set(5);             // set to 5
count.update(n => n + 1); // increment
count.subscribe(val => console.log(val)); // listen to changes

// Derived / computed state
const doubled = computed([count], () => count.get() * 2);

// Async state (wraps a Promise)
const users = asyncState(fetch("/api/users").then(r => r.json()), []);
// users.busy → State<boolean> (true while loading)
// users.errorObject → State<Error | null>
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
{fromState(this.isVisible)
  .renderIf(() => <p>Visible!</p>)
  .else(() => <small>Not visible.</small>)}

// Reactive list with a key function
{fromState(this.items)
  .keyFn(item => item.id)
  .renderFor((item, index) => <li>{item.name}</li>)}

// Scoped stateful re-render
{fromState(this.counter)
  .stateful(() => <strong>{this.counter.get()}</strong>)}
```

| Method | Returns | Description |
|---|---|---|
| `fromState(state)` | `FromState` | Creates a builder for the given state |
| `.renderIf(fn)` | `() => If` | Renders `fn()` when state is truthy |
| `.renderIf(fn).else(fn)` | `() => If` | Adds an else branch |
| `.keyFn(fn)` | `FromState` | Sets a key extractor for list rendering (chainable) |
| `.renderFor(fn)` | `() => For` | Renders each item in the state array |
| `.stateful(fn)` | `() => Stateful` | Scoped re-render on state change |

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
```

#### `Stateful` — Scoped re-render boundary

Re-renders only its children when the given state changes, avoiding full component re-renders.

```tsx
import { Stateful } from "@ubs-platform/neolit/structural";

<Stateful state={this.counter}>
    {() => <strong>{this.counter.get()}</strong>}
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
| `@ubs-platform/neolit/structural` | `For`, `If`, `Stateful` |
| `@ubs-platform/neolit/jsx-runtime` | JSX factory (for `tsconfig.json`) |
| `@ubs-platform/neolit/jsx-dev-runtime` | JSX dev factory |

---

> This project is developed and maintained by [ubs-platform](https://github.com/ubs-platform).
