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
Container'dir. Provider kaydi, resolve, singleton cache, circular dependency kontrolu ve parent injector fallback burada yapilir.

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
- `createInjector(parent?)`

`createInjector(parent)` ile child injector olusturulabilir. Bir token child injector'da bulunamazsa parent injector'a dusulur.

### 3) `@Injectable(...)`
Service siniflarini bir injector'a kaydetmek ve dependency metadata tanimlamak icin class decorator.

Opsiyonlar:
- `providedIn: "root"`
- `providedIn: injectorInstance`
- `providedIn: () => injectorInstance`
- `token`
- `deps`
- `singleton`

### 4) `@Inject(token)`
Constructor parametre decorator'u. Ozellikle class olmayan tokenlar (symbol/string/object) icin kullanisli.

## Cozme Sirasi (Resolve Akisi)

1. Token map'te var mi kontrol edilir.
2. Varsa cache varsa cache doner.
3. Yoksa current injector'da provider aranir.
4. Current injector'da yoksa parent injector varsa parent'a dusulur.
5. Hala yoksa token bir class ise auto provider uretilir (lazy construct).
6. Provider `useClass` ise deps listesi su sirayla okunur:
   - acik `deps`
   - sinif metadata'si (`@Inject` veya static `inject`)
7. Tum bagimliliklar recursive resolve edilir.
8. `singleton !== false` ise sonuc cache'lenir.
9. Cycle varsa hata firlatilir.

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

### Ornek 5: Child injector

```ts
import { createInjector, rootInjector } from "@ubs-platform/neolit/injectables";

const featureInjector = createInjector(rootInjector);
featureInjector.registerValue("feature-name", "books");

console.log(featureInjector.resolve("feature-name"));
```

Bu yapida `featureInjector`, kendi tokenlarini cozer; bulamazsa `rootInjector`'a duser.

### Ornek 6: Ozel injector'a `@Injectable` kaydi

```ts
import { Injectable, createInjector, rootInjector } from "@ubs-platform/neolit/injectables";

const featureInjector = createInjector(rootInjector);

@Injectable({ providedIn: featureInjector })
class FeatureLoggerService {
  log(message: string): void {
    console.log("[feature]", message);
  }
}

const featureLogger = featureInjector.resolve(FeatureLoggerService);
featureLogger.log("ready");
```

Declaration order veya import dongusu riski varsa getter formu kullanilabilir:

```ts
@Injectable({ providedIn: () => featureInjector })
class FeatureLoggerService {}
```

### Ornek 7: Runtime local injector icin explicit registration

```ts
import { createInjector, rootInjector } from "@ubs-platform/neolit/injectables";

const localInjector = createInjector(rootInjector);
localInjector.registerClass(UserService, UserService);

const userService = localInjector.resolve(UserService);
```

Bu model, runtime'da olusan component veya feature instance scope'lari icin `providedIn` kullanmaktan daha temizdir.

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
- `providedIn` daha cok statik olarak bilinen injector'lar icin uygundur.
- Runtime'da olusan local injector'larda `registerClass/registerValue/registerFactory` ile explicit kayit daha sagliklidir.
