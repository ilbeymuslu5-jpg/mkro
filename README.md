# makromusic klonu

Müzik zevkine göre insanlarla tanıştıran sosyal uygulamanın çalışan bir klonu. Profil fotoğrafı yerine çalma listesi üzerinden eşleştirme yapar.

> Eğitim amaçlı bir demo. Gerçek makromusic ile bir bağlantısı yoktur; markası veya verisi kullanılmamıştır.

## Ne var

- **Müzik uyumu motoru** — iki kişinin en çok dinlediği sanatçı, şarkı ve türleri karşılaştırıp %42–99 bandında bir uyum skoru üretir
- **Keşfet** — uyum sırasına dizilmiş kart destesi; ortak sanatçılar, ortak türler ve marş şarkısı kartın üstünde
- **Eşleşme** — beğendiğin kişi yeterince yakın zevkteyse karşılık verir ve kutlama ekranı açılır
- **Sohbet** — metin mesajı ve şarkı gönderme; gönderilen şarkı baloncuğun içinden çalınır
- **Etkinlikler** — dinlediğin sanatçıların konserleri, en sevdiğin sanatçıya göre sıralı
- **Profil** — müzik pasaportun: sanatçılar, şarkılar, türler, eşleşmeler
- **Mini çalar** — her ekranda açık kalır, ilerleme çubuğu sürüklenebilir

## Çalıştır

```bash
npm install
npm run dev      # http://localhost:5173
```

```bash
npm run build    # üretim derlemesi
npm run preview  # derlemeyi yerelde sun
```

## Uyum skoru nasıl hesaplanıyor

`src/lib/match.ts` üç sinyali harmanlar:

| Sinyal | Ağırlık | Yöntem |
|---|---|---|
| Ortak sanatçılar | %55 | Sıra ağırlıklı örtüşme — ortak bir 1 numara, ortak bir 5 numaradan çok daha değerli |
| Ortak türler | %27 | Jaccard benzerliği |
| Ortak şarkılar | %18 | Sıra ağırlıklı örtüşme |

Ham örtüşme yakın zevklerde bile ~0.7'yi geçmediği için sonuç 42–99 bandına taşınır. `MUTUAL_LIKE_SCORE` (55) eşiğini geçen kişiler beğeniye karşılık verir — bu eşik skalanın ürettiği aralığın içinde kalmalı; üstüne çıkarsa hiçbir beğeni eşleşmeye dönüşemez.

## Teknik

- React 19 + TypeScript, Vite 8
- Tailwind CSS 4 (`@theme` ile token'lar)
- react-router-dom 7, lucide-react ikonlar
- Durum yönetimi: iki React context — `PlayerContext` (çalar) ve `SocialContext` (beğeni, eşleşme, mesaj)
- Backend yok, API anahtarı yok. Tüm veri `src/data/` altında.

### Görseller

Uygulama hiç görsel dosyası taşımaz ve avatar için ağ isteği yapmaz. Her avatar ve kapak, varlığın `id`'sinden türetilen deterministik bir gradyandır (`src/lib/visual.ts`) — aynı kişi her zaman aynı görünür.

Tek dış bağımlılık Google Fonts (Poppins + Righteous). Erişilemezse sistem yazı tipine düşer, düzen bozulmaz.

## Tasarım sistemi

Palet, tipografi ve düzen kuralları [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) skill'iyle üretildi:

```bash
python3 ui-ux-pro-max/scripts/search.py "music social network" --design-system -p "makromusic"
```

Çıkan sistem: **Dark Mode (OLED)** stili, "Dark audio + play green" paleti (`#0F0F23` zemin, `#22C55E` vurgu), Righteous/Poppins eşleşmesi. Token'lar `src/index.css` içinde `@theme` bloğunda.

Skill'in teslim öncesi kontrol listesi uygulandı: ikonlar SVG (emoji değil), tıklanabilir her öğede `cursor-pointer`, 150–300ms geçişli hover durumları, klavye için görünür odak halkası, `prefers-reduced-motion` desteği, 375/768/1024/1440px'de yatay taşma yok.

## Yapı

```
src/
├── data/          catalog.ts (sanatçı + şarkı), people.ts, events.ts
├── lib/           match.ts (uyum motoru), visual.ts (gradyan avatar)
├── state/         PlayerContext.tsx, SocialContext.tsx
├── components/    AppShell, MiniPlayer, CompatRing, TrackRow, Avatar, ...
└── pages/         Welcome, Discover, Chats, ChatDetail, Events, Profile, PersonProfile
```

## Bilinen sınırlar

- Ses dosyası yok — çalar simüle ediliyor, ilerleme zamanlayıcıyla akıyor
- Durum bellekte tutuluyor; sayfa yenilenince beğeniler ve mesajlar sıfırlanır
- Karşı taraf mesajlara cevap vermiyor; sohbetler tohum verilerle başlıyor
