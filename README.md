# makromusic klonu

Müzik zevkine göre insanlarla tanıştıran sosyal uygulamanın çalışan bir klonu. Profil fotoğrafı yerine çalma listesi üzerinden eşleştirme yapar.

> Eğitim amaçlı bir demo. Gerçek makromusic ile bir bağlantısı yoktur; markası veya verisi kullanılmamıştır.

## Ne var

- **Müzik uyumu motoru** — iki kişinin en çok dinlediği sanatçı, şarkı ve türleri karşılaştırıp %42–99 bandında bir uyum skoru üretir
- **Keşfet** — uyum sırasına dizilmiş kart destesi; ortak sanatçılar, ortak türler ve marş şarkısı kartın üstünde
- **Eşleşme** — beğendiğin kişi yeterince yakın zevkteyse karşılık verir ve kutlama ekranı açılır
- **Sohbet** — metin mesajı ve şarkı gönderme; gönderilen şarkı baloncuğun içinden çalınır
- **Müzik** — popüler şarkılar kare kapak ızgarasında, her birinin üstünde o şarkı üzerinden kaç kişiyle eşleşebileceğin
- **Şarkı önerileri** — zevkine en yakın kişilerin dinlediği, senin listende olmayan şarkılar
- **Etkinlikler** — dinlediğin sanatçıların konserleri, en sevdiğin sanatçıya göre sıralı
- **Profil** — müzik pasaportun: sanatçılar, şarkılar, türler, eşleşmeler
- **Profil fotoğrafı** — kendi fotoğrafını yükle; tarayıcıda kare kırpılıp küçültülür ve kalıcı saklanır
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

## Tek dosyalık sürüm

Uygulamanın tamamı (CSS + JS dahil) tek bir HTML dosyasına gömülebilir — sunucu istemez, dosyayı açman yeter:

```bash
npm run build:single             # dist-single/index.html
node scripts/make-artifact.mjs   # artifact/makromusic.html
```

Bu sürüm yol tabanlı yönlendirme yerine hash yönlendirmesi kullanır (`#/kesfet`), çünkü statik bir dosyada bilinmeyen yolları `index.html`'e çeviren sunucu yoktur.

`scripts/make-artifact.mjs` sarmalayıcı etiketleri ayıklar ve şunları doğrular: dış istek kalmamış, JS paketi gerçekten gömülmüş, `#root` yerinde, boyut sınırın altında. Bu kontroller olmasa paket sessizce düşebiliyor ve geriye boş bir sayfa kalıyor.

## Uyum skoru nasıl hesaplanıyor

`src/lib/match.ts` üç sinyali harmanlar:

| Sinyal | Ağırlık | Yöntem |
|---|---|---|
| Ortak sanatçılar | %55 | Sıra ağırlıklı örtüşme — ortak bir 1 numara, ortak bir 5 numaradan çok daha değerli |
| Ortak türler | %27 | Jaccard benzerliği |
| Ortak şarkılar | %18 | Sıra ağırlıklı örtüşme |

Ham örtüşme yakın zevklerde bile ~0.7'yi geçmediği için sonuç 42–99 bandına taşınır. `MUTUAL_LIKE_SCORE` (55) eşiğini geçen kişiler beğeniye karşılık verir — bu eşik skalanın ürettiği aralığın içinde kalmalı; üstüne çıkarsa hiçbir beğeni eşleşmeye dönüşemez.

## Popülerlik ve öneriler

`src/lib/discovery.ts` iki şey üretir:

- **Popüler şarkılar** — her şarkıyı kaç kişinin en çok dinlediklerinde taşıdığını sayar. Tek dinleyicili şarkılar elenir (`minListeners: 2`), çünkü "popüler" başlığı altında çıkmaz sokak listelemek başlığı anlamsız kılar. İlk 12 gösterilir.
- **Öneriler** — senin listende olmayan şarkılar, onları dinleyen kişilerin uyum skorlarının toplamına göre sıralanır. Bir öneri, geldiği kişi kadar iyidir; bu yüzden ölçüt kişi sayısı değil, uyumların toplamı.

## Profil fotoğrafı

Seçilen dosya `src/lib/image.ts` içinde canvas ile ortadan kare kırpılır, 256×256'ya küçültülür ve JPEG data URL'e çevrilir — birkaç MB'lık kamera dosyası yerine ~4 kB saklanır. Sonuç `localStorage`'a yazılır, yani sayfa yenilense de kalır. Depolama kapalıysa (gizli sekme, kota dolu) fotoğraf o oturum boyunca çalışmaya devam eder; yükleme başarısız sayılmaz.

## Teknik

- React 19 + TypeScript, Vite 8
- Tailwind CSS 4 (`@theme` ile token'lar)
- react-router-dom 7, lucide-react ikonlar
- Durum yönetimi: üç React context — `PlayerContext` (çalar), `SocialContext` (beğeni, eşleşme, mesaj), `ProfileContext` (fotoğraf)
- Backend yok, API anahtarı yok. Tüm veri `src/data/` altında.

### Görseller

Uygulama hiç görsel dosyası taşımaz ve avatar için ağ isteği yapmaz. Her avatar ve şarkı kapağı, varlığın `id`'sinden türetilen deterministik bir gradyandır (`src/lib/visual.ts`) — aynı kişi ve aynı şarkı her zaman aynı görünür. Tek istisna senin yüklediğin profil fotoğrafın.

Tek dış bağımlılık Google Fonts (Poppins + Righteous), `index.html` içinden bağlanır. Erişilemediğinde `src/index.css` içindeki yığın devreye girer: Avenir Next / Futura / Trebuchet, sonra platform arayüz fontu — kaza eseri Arial değil, seçilmiş bir ikinci tercih.

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
├── lib/           match.ts (uyum motoru), discovery.ts (popülerlik + öneri),
│               visual.ts (gradyan avatar), image.ts (fotoğraf kırpma)
├── state/         PlayerContext.tsx, SocialContext.tsx, ProfileContext.tsx
├── components/    AppShell, MiniPlayer, CompatRing, TrackRow, Avatar, PhotoPicker, ...
└── pages/         Welcome, Discover, Music, Chats, ChatDetail, Events, Profile,
                PersonProfile
```

## Bilinen sınırlar

- Ses dosyası yok — çalar simüle ediliyor, ilerleme zamanlayıcıyla akıyor
- Beğeniler ve mesajlar bellekte tutuluyor; sayfa yenilenince sıfırlanır (profil fotoğrafı hariç, o kalıcı)
- Karşı taraf mesajlara cevap vermiyor; sohbetler tohum verilerle başlıyor
