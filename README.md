# ssuf

Bu repo, Neolit tabanli deneysel bir UI/runtime calismasi icerir.

## Render Karar Checklist

Bir degisiklikten sonra asagidaki 4 soruyu hizlica kontrol et:

1. State degisince UI her zaman dogru gorunuyor mu?
2. Gereksiz DOM degisimi azaldi mi?
3. Kod karmasikligi, kazanilan performansa deger mi?
4. Yeni gelen ekip uyesi bu modeli kolayca anlayabilir mi?

## Kullanim Notu

- Amac: Gereksiz rerenderlari azaltmak.
- Kirmizi cizgi: UI dogrulugunu asla bozmamak.
- Kural: Sadece gerekli yerde rerender yap; geri kalan yerde daha ince taneli guncellemeyi tercih et.
