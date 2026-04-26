# Neolit

> **⚠️ UYARI: Bu proje aktif geliştirme aşamasındadır ve üretim ortamı (production) için UYGUN DEĞİLDİR. API'lar önceden haber verilmeksizin değişebilir; kütüphane hata veya eksik özellikler içerebilir. Kullanım riski size aittir.**

Neolit, TypeScript ve JSX ile web arayüzleri oluşturmaya yönelik hafif, sınıf tabanlı ve deklaratif bir UI framework'üdür. Sanal DOM kullanmadan doğrudan gerçek DOM üzerine render eder; ince taneli reaktif state yönetimi, yapısal direktifler ve Angular tarzı bağımlılık enjeksiyonu (dependency injection) gibi özellikler sunar.

---

## İçindekiler

- [Kurulum](#kurulum)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Temel Kavramlar](#temel-kavramlar)
  - [Bileşenler](#bileşenler)
  - [State (Durum)](#state-durum)
  - [JSX](#jsx)
  - [Yapısal Direktifler](#yapısal-direktifler)
    - [`fromState` akıcı API](#fromstate--akıcı-fluent-builder-api)
  - [Bağımlılık Enjeksiyonu](#bağımlılık-enjeksiyonu)
  - [Yönlendirme (Routing)](#yönlendirme-routing)
- [Komutlar](#komutlar)
- [Paket Giriş Noktaları](#paket-giriş-noktaları)

---

## Kurulum

```bash
npm install @ubs-platform/neolit
```

`tsconfig.json` dosyanızı özel JSX runtime'ı kullanacak şekilde yapılandırın:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@ubs-platform/neolit"
  }
}
```

---

## Hızlı Başlangıç

```tsx
import { NeolitComponent, state } from "@ubs-platform/neolit/core";

class Sayac extends NeolitComponent {
    private sayi = state(0);

    render() {
        return (
            <div>
                <p>Sayı: {this.sayi}</p>
                <button onclick={() => this.sayi.update(n => n + 1)}>
                    Artır
                </button>
            </div>
        );
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new Sayac().mount(document.getElementById("root")!);
});
```

---

## Temel Kavramlar

### Bileşenler

Tüm bileşenler `NeolitComponent` sınıfını genişletir ve JSX aracılığıyla DOM düğümleri döndüren bir `render()` metodu uygular. Generic parametre ile gelen JSX prop'larına tip güvenliği sağlanabilir.

```tsx
import { NeolitComponent } from "@ubs-platform/neolit/core";

interface SelamlamaProps {
    isim: string;
}

class Selamlama extends NeolitComponent<SelamlamaProps> {
    onInit() {
        // this.properties, onInit çağrılmadan önce tam olarak doldurulur
        console.log(this.properties.isim); // "Dünya"
    }

    render() {
        return <h1>Merhaba, {this.properties.isim}!</h1>;
    }
}

// JSX'te kullanım — prop'lar this.properties'e otomatik atanır:
<Selamlama isim="Dünya" />
```

JSX üzerinden geçilen prop'lar, `onInit()` çağrılmadan önce `this.properties`'e atanır; dolayısıyla hem `onInit()` hem de `render()` içinde erişilebilirler. Gelen bir prop değeri `State` ise iki yönlü bağlanır: kaynak state değişince bileşen içindeki değer güncellenir, bileşen içinde yapılan değişiklikler de kaynağa geri iletilir.

**Temel metotlar:**

| Metot | Açıklama |
|---|---|
| `mount(hedef)` | Bileşeni bir DOM elemanına bağlar |
| `destroy()` | DOM'dan kaldırır ve abonelikleri temizler |
| `onInit()` | Props atandıktan, ilk render'dan önce çağrılan isteğe bağlı yaşam döngüsü kancası |
| `watchToRerender(state)` | Belirtilen state değiştiğinde tüm bileşeni yeniden render eder |
| `rerender()` | Tam yeniden render işlemini manuel olarak tetikler |

> Kısmi/kapsamlı güncellemeler için `watchToRerender` yerine `Stateful` yapısal direktifini tercih edin.

---

### State (Durum)

Neolit'in reaktif state sistemi, yalnızca etkilenen DOM düğümlerini güncelleyerek gereksiz tam render işlemlerinden kaçınır.

```ts
import { state, computed, asyncState } from "@ubs-platform/neolit/core";

// Temel reaktif state
const sayi = state(0);
sayi.get();               // 0
sayi.set(5);              // 5 olarak ayarla
sayi.update(n => n + 1);  // artır
sayi.subscribe(deger => console.log(deger)); // değişiklikleri dinle
sayi.unsubscribe(dinleyici);                 // dinleyiciyi kaldır

// Mevcut bir state'ten yeni bir state türetme
const ikiKat = sayi.map(n => n * 2);  // sayi değişince otomatik güncellenir

// Dizi state'leri için yardımcı metotlar
const ogeler = state([1, 2, 3, 4]);
const ciftler = ogeler.arrayFilter(n => n % 2 === 0);       // State<number[]>
const etiketler = ogeler.arrayMap((n, i) => `#${i}: ${n}`); // State<string[]>

// Hesaplanmış state (birden fazla girdi)
const toplam = computed([a, b], () => a.get() + b.get());

// Asenkron state (bir Promise'i sarar)
const kullanicilar = asyncState(fetch("/api/kullanicilar").then(r => r.json()), []);
// kullanicilar.busy          → State<boolean>      (yüklenirken true)
// kullanicilar.error         → State<Error | null>
// kullanicilar.setAsync(p)   — yeni bir promise ile yeniden başlatır
// kullanicilar.allInComputed() — ComputedState<{ data, busy, error }>
```

JSX'te bir `State` nesnesini doğrudan çocuk eleman olarak geçirmek, **kendiliğinden güncellenen bir metin düğümü** oluşturur; yeniden render gerekmez:

```tsx
render() {
    return <p>Değer: {this.sayi}</p>; // değiştiğinde otomatik güncellenir
}
```

---

### JSX

JSX runtime, etiketleri gerçek DOM elemanlarına veya bileşen yapıcılarına (constructor) eşler.

```tsx
// HTML elemanı
<div class="kapsayici">Merhaba</div>

// Bileşen
<BenimBilesenimi />

// Olay dinleyicileri (on* öneki)
<button onclick={() => birSeyYap()}>Tıkla</button>

// Reaktif stil
<div style={{ color: this.metinRengi, fontSize: "16px" }} />

// Koşullu sınıf değiştirme
<div className={{ aktif: this.aktifMi, gizli: this.gizliMi }} />

// Fragment
<>
    <p>Birinci</p>
    <p>İkinci</p>
</>
```

---

### Yapısal Direktifler

`@ubs-platform/neolit/structural` paketinden içe aktarın.

#### `fromState` — Akıcı (fluent) builder API

`<For>`, `<If>` ve `<Stateful>` bileşenlerini doğrudan JSX olarak kullanmak yerine, zincirleme çağrılara olanak tanıyan `fromState` yardımcısını kullanabilirsiniz.

```tsx
import { fromState } from "@ubs-platform/neolit/structural";

// else dalıyla koşullu render
// fn, mevcut state değerini parametre olarak alır
{fromState(this.gorunurMu)
  .renderIf((deger) => <p>Değer: {deger}</p>)
  .else(() => <small>Görünmüyor.</small>)}

// Anahtar fonksiyonlu reaktif liste
{fromState(this.ogeler)
  .keyFn(oge => oge.id)
  .renderFor((oge, index) => <li>{oge.isim}</li>)}

// Kapsamlı stateful yeniden render; fn mevcut değeri alır
{fromState(this.sayac)
  .stateful((deger) => <strong>{deger}</strong>)}
```

| Metot | Dönüş | Açıklama |
|---|---|---|
| `fromState(state)` | `FromState` | Verilen state için bir builder oluşturur |
| `.renderIf(fn)` | `() => If` | State truthy iken `fn(deger)` sonucunu render eder; `deger` mevcut state değeridir |
| `.renderIf(fn).else(fn)` | `() => If` | Else dalı ekler |
| `.keyFn(fn)` | `FromState` | Liste render için anahtar çıkarıcı ayarlar (zincirlenebilir) |
| `.renderFor(fn)` | `() => For` | State dizisindeki her ögeyi render eder |
| `.stateful(fn)` | `() => Stateful` | State değiştiğinde kapsamlı yeniden render tetikler; `fn` mevcut değeri alır |

---

#### `For` — Reaktif liste render'ı

Listeleri verimli şekilde render eder ve günceller. Ekleme, silme veya yeniden sıralama işlemlerinde gereksiz render'lardan kaçınmak için düğümleri anahtar (key) ile önbelleğe alır.

```tsx
import { For } from "@ubs-platform/neolit/structural";

// render() içinde:
<For items={this.ogeler} keyFn={(oge) => oge.id}>
    {(oge, index) => <li>{oge.isim}</li>}
</For>
```

| Prop | Tür | Açıklama |
|---|---|---|
| `items` | `State<T[]>` | Reaktif liste |
| `children` | `(oge, index) => NeolitNode` | Her öge için render fonksiyonu |
| `keyFn` | `(oge) => string \| number` | Fark hesabı için anahtar çıkarıcı |
| `compareItems` | `(a, b) => boolean` | Özel eşitlik kontrolü |
| `strictKeys` | `boolean` | Benzersiz anahtar zorunluluğu |

#### `If` — Koşullu render

```tsx
import { If } from "@ubs-platform/neolit/structural";

<If condition={this.gorunurMu}>
    {() => <p>Bu görünüyor!</p>}
</If>

{/* Else dalı ile: */}
<If condition={this.gorunurMu} elseChildren={() => <p>Görünmüyor.</p>}>
    {() => <p>Bu görünüyor!</p>}
</If>
```

#### `Stateful` — Kapsamlı yeniden render sınırı

Yalnızca belirtilen state değiştiğinde kendi çocuklarını yeniden render eder; tüm bileşenin render edilmesini önler. Çocuk fonksiyon, mevcut state değerini parametre olarak alır.

```tsx
import { Stateful } from "@ubs-platform/neolit/structural";

<Stateful state={this.sayac}>
    {(deger) => <strong>{deger}</strong>}
</Stateful>
```

---

### Bağımlılık Enjeksiyonu

Tekil (singleton) önbellekleme, döngüsel bağımlılık tespiti ve hiyerarşik injector desteği ile Angular tarzı bir DI sistemi.

#### Root scope'a servis kaydetme

```ts
import { Injectable } from "@ubs-platform/neolit/injectables";

// Root injector'a otomatik olarak kaydedilir (singleton)
@Injectable({ providedIn: "root" })
class LogService {
    kaydet(mesaj: string) {
        console.log(mesaj);
    }
}
```

#### Ozel injector'a servis kaydetme

```ts
import { Injectable, createInjector, rootInjector } from "@ubs-platform/neolit/injectables";

const featureInjector = createInjector(rootInjector);

@Injectable({ providedIn: featureInjector })
class FeatureLogService {
    kaydet(mesaj: string) {
        console.log("[feature]", mesaj);
    }
}
```

Declaration order problemi yasamamak icin getter da verebilirsin:

```ts
@Injectable({ providedIn: () => featureInjector })
class FeatureLogService {}
```

#### Servis enjekte etme

```ts
import { inject } from "@ubs-platform/neolit/injectables";

class BenimBileşenim extends NeolitComponent {
    private log = inject(LogService);

    render() {
        this.log.kaydet("Render edildi!");
        return <div>Merhaba</div>;
    }
}
```

Belirli bir injector uzerinden resolve etmek de mumkun:

```ts
const featureLog = inject(FeatureLogService, featureInjector);
```

#### Değer kaydetme

```ts
import { rootInjector } from "@ubs-platform/neolit/injectables";
import axios from "axios";

rootInjector.registerValue("http-client", axios.create({ baseURL: "/api" }));
```

#### Child injector olusturma

```ts
import { createInjector, rootInjector } from "@ubs-platform/neolit/injectables";

const featureInjector = createInjector(rootInjector);

featureInjector.registerValue("feature-id", "books");
```

Bir token local injector'da bulunmazsa parent injector'a dusulur.

#### Sınıf dışı token'ları enjekte etme

```ts
import { Injectable, Inject } from "@ubs-platform/neolit/injectables";

@Injectable({ providedIn: "root" })
class ApiServisi {
    constructor(@Inject("http-client") private http: typeof axios) {}
}

// ya da deps dizisiyle
@Injectable({ deps: ["http-client"] })
class ApiServisi {
    constructor(private http: typeof axios) {}
}
```

#### Dinamik local injector kullanimi

Injector runtime'da olusuyorsa `providedIn` yerine explicit registration daha uygundur.

```ts
const localInjector = createInjector(rootInjector);
localInjector.registerClass(ApiServisi, ApiServisi);

const apiServisi = localInjector.resolve(ApiServisi);
```

Bu kullanim genelde component instance, feature instance veya request bazli scope'lar icin daha uygundur.

**Sağlayıcı (provider) türleri:**

| Tür | Açıklama |
|---|---|
| `useValue` | Düz bir değer kaydeder |
| `useClass` | İlk çözümlenmede örneklenen bir sınıf kaydeder |
| `useFactory` | `(injector) => T` biçiminde bir fabrika fonksiyonu kaydeder |

**`@Injectable` icin scope secenekleri:**

| Secenek | Aciklama |
|---|---|
| `providedIn: "root"` | Global root injector'a kaydeder |
| `providedIn: injectorInstance` | Belirli bir injector'a kaydeder |
| `providedIn: () => injectorInstance` | Injector'u lazy olarak alip oraya kaydeder |

`createInjector(parent)` opsiyonel parent fallback ile yeni injector olusturur.

---

### Yönlendirme (Routing)

`@ubs-platform/neolit/routing` paketinden içe aktarın.

#### Rota tanımlama

```ts
import { RouteMap } from "@ubs-platform/neolit/routing";

const rotaHaritasi = new RouteMap([
    {
        path: "/",
        componentFactory: () => <AnaSayfa />,
    },
    {
        path: "/kullanicilar/:id",
        componentFactory: (params) => <KullaniciDetay userId={params.pathParameters.id} />,
        canActivate: async (params) => {
            // true → izin ver, false → 404, string → yönlendir
            return girisYapildiMi();
        },
        childRoutes: [
            {
                path: "gonderiler/:gonderiId",
                componentFactory: (params) => <Gonderi gonderiId={params.pathParameters.gonderiId} />,
            },
        ],
    },
]);
```

Path parametreleri `:isim` segmentleriyle tanımlanır. Sorgu dizisi (query string) parametreleri otomatik olarak ayrıştırılır.

#### Router oluşturma

```ts
import { Router } from "@ubs-platform/neolit/routing";

const router = new Router({
    routeMap: rotaHaritasi,
    initialPath: window.location.pathname + window.location.search,
});

router.navigate("/kullanicilar/42");   // geçmiş push + rota eşleştirme
router.replace("/kullanicilar/42");    // geçmiş replace + rota eşleştirme
await router.sync("/kullanicilar/42"); // geçmiş değişikliği olmadan eşleştirme
router.destroy();                      // popstate dinleyicisini kaldırır

// Reaktif state'ler
// router.pathState        → State<string>                     mevcut yol
// router.activeRouteState → AsyncState<RouteMatch | null>     eşleşen rota
```

#### `Outlet` ile render

```tsx
import { Outlet } from "@ubs-platform/neolit/routing";

// Mevcut bir router geçin:
<Outlet router={benimRouterim} />

// Ya da Outlet kendi router'ını oluştursun:
<Outlet routeMap={rotaHaritasi} initialPath="/" />
```

`Outlet`, eşleşen rotanın `componentFactory`'sinden dönen bileşeni render eder; hiçbir rota eşleşmezse `404 Not Found` mesajı gösterir.

**Rota tanım prop'ları:**

| Prop | Tür | Açıklama |
|---|---|---|
| `path` | `string` | URL yolu, `:param` segmentlerini destekler |
| `componentFactory` | `(params) => NeolitNode` | Çözümlenen URL parametreleriyle çağrılan fabrika |
| `childRoutes` | `RouteInfo[]` | İç içe rotalar |
| `canActivate` | `(params) => boolean \| string \| Promise<...>` | Guard: `true` izin verir, `false` 404 gösterir, string yönlendirir |

---

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır (Vite) |
| `npm run build` | Demo uygulamasını derler |
| `npm run preview` | Üretim derlemesini önizler |
| `npm run build:lib` | Dağıtılabilir kütüphaneyi `dist/lib/` klasörüne derler |

---

## Paket Giriş Noktaları

| Giriş Noktası | İçerik |
|---|---|
| `@ubs-platform/neolit/core` | `NeolitComponent`, `State`, `ComputedState`, `AsyncState` |
| `@ubs-platform/neolit/injectables` | `Injectable`, `Inject`, `inject`, `rootInjector` |
| `@ubs-platform/neolit/structural` | `For`, `If`, `Stateful`, `fromState` |
| `@ubs-platform/neolit/routing` | `Router`, `RouteMap`, `Outlet` |
| `@ubs-platform/neolit/jsx-runtime` | JSX fabrikası (`tsconfig.json` için) |
| `@ubs-platform/neolit/jsx-dev-runtime` | JSX geliştirme fabrikası |

---

> Bu proje [ubs-platform](https://github.com/ubs-platform) tarafından geliştirilmekte ve sürdürülmektedir.
