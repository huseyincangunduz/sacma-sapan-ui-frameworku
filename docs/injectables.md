# Injectables Dokumani

Bu dokuman, `@ubs-platform/neolit/injectables` altindaki DI (Dependency Injection) yapisinin mantigini ve temel kullanimlarini ozetler.

## Neden Bu Yapi?

Hedefler:
- String token carpismalarini onlemek (object/class/symbol token desteklenir)
- Resolve aninda lazy construct yapabilmek
- Service -> service bagimliliklarini otomatik cozebilmek
- Angular benzeri ama framework'e uygun hafif bir gelistirici deneyimi sunmak

## Temel Bilesenler

### 1) `InjectHolder`
Container'dir. Provider kaydi, resolve, singleton cache ve circular dependency kontrolu burada yapilir.

Desteklenen provider tipleri:
- `useValue`
- `useFactory`
- `useClass`

Token tipleri:
- `string`
- `symbol`
- `object`
- `class` (constructable)

### 2) `rootInjector`
Uygulama geneli root container.

Yardimcilar:
- `inject(token)`
- `provideValue(token, value)`
- `provideClass(token, useClass)`
- `createInjector()`

### 3) `@Injectable(...)`
Service siniflarini root'a kaydetmek ve dependency metadata tanimlamak icin class decorator.

Opsiyonlar:
- `providedIn: "root"`
- `token`
- `deps`
- `singleton`

### 4) `@Inject(token)`
Constructor parametre decorator'u. Ozellikle class olmayan tokenlar (symbol/string/object) icin kullanisli.

## Cozme Sirasi (Resolve Akisi)

1. Token map'te var mi kontrol edilir.
2. Varsa cache varsa cache doner.
3. Yoksa token bir class ise auto provider uretilir (lazy construct).
4. Provider `useClass` ise deps listesi su sirayla okunur:
   - acik `deps`
   - sinif metadata'si (`@Inject` veya static `inject`)
5. Tum bagimliliklar recursive resolve edilir.
6. `singleton !== false` ise sonuc cache'lenir.
7. Cycle varsa hata firlatilir.

## Ornekler

### Ornek 1: Basit root service

```ts
import { Injectable, inject } from "@ubs-platform/neolit/injectables";

@Injectable({ providedIn: "root" })
class LoggerService {
  log(message: string): void {
    console.log("[LOG]", message);
  }
}

const logger = inject(LoggerService);
logger.log("ready");
```

### Ornek 2: Symbol token + constructor inject

```ts
import { Injectable, Inject, provideValue, inject } from "@ubs-platform/neolit/injectables";

const API_URL = Symbol("API_URL");
provideValue(API_URL, "https://api.example.com");

@Injectable({ providedIn: "root" })
class ApiClient {
  constructor(@Inject(API_URL) private apiUrl: string) {}

  getBaseUrl(): string {
    return this.apiUrl;
  }
}

const api = inject(ApiClient);
console.log(api.getBaseUrl());
```

### Ornek 3: Service -> service bagimliligi

```ts
import { Injectable, inject } from "@ubs-platform/neolit/injectables";

@Injectable({ providedIn: "root" })
class LoggerService {
  log(message: string): void {
    console.log(message);
  }
}

@Injectable({ providedIn: "root" })
class UserService {
  // Class dependency oldugu icin otomatik cozulur
  constructor(private logger: LoggerService) {}

  loadUsers(): void {
    this.logger.log("loading users");
  }
}

inject(UserService).loadUsers();
```

### Ornek 4: Factory provider

```ts
import { rootInjector } from "@ubs-platform/neolit/injectables";

const NOW_TOKEN = Symbol("NOW_TOKEN");

rootInjector.registerFactory(NOW_TOKEN, () => new Date().toISOString(), false);

console.log(rootInjector.resolve<string>(NOW_TOKEN));
```

## Component Tarafi Notu

Simdilik componentlerde constructor otomatik inject yerine manuel kullanim onerilir:

```ts
import { inject } from "@ubs-platform/neolit/injectables";

class MyComponent {
  private userService = inject(UserService);
}
```

Bu tercih component yasam dongusu ile DI karmasikligini ayri tutar.

## Dikkat Edilecekler

- Circular dependency durumunda hata alirsin.
- Singleton davranisi default aciktir (`singleton: true`).
- Factory provider'da `singleton: false` verirsen her resolve'ta yeni instance uretilir.
- String token yerine `symbol` veya class token tercih et.
