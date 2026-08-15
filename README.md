# makromusic klonu

Müzik zevkine göre insanlarla tanıştıran sosyal uygulamanın çalışan bir klonu. Profil fotoğrafı yerine çalma listesi üzerinden eşleştirme yapar.

> Eğitim amaçlı bir demo. Gerçek makromusic ile bir bağlantısı yoktur; markası veya verisi kullanılmamıştır.

## Ne var

- **Spotify ile giriş** — sahte OAuth onay ekranı; hesap seç, izinleri gör, bağlan. Zevkin, sanatçıların ve şu an çalan parçan oradan gelir
- **Müzik uyumu motoru** — iki kişinin en çok dinlediği sanatçı, şarkı ve türleri karşılaştırıp %42–99 bandında bir uyum skoru üretir
- **Keşfet** — uyum sırasına dizilmiş kart destesi; ortak sanatçılar, ortak türler ve marş şarkısı kartın üstünde
- **Eşleşme** — beğendiğin kişi yeterince yakın zevkteyse karşılık verir ve kutlama ekranı açılır
- **Sohbet** — metin mesajı ve şarkı gönderme; gönderilen şarkı baloncuğun içinden çalınır
- **Müzik** — popüler şarkılar kare kapak ızgarasında, her birinin üstünde o şarkı üzerinden kaç kişiyle eşleşebileceğin
- **Şarkı önerileri** — zevkine en yakın kişilerin dinlediği, senin listende olmayan şarkılar
- **Sosyal akış** — şarkılar hakkında gönderi yaz, başkalarınınkini beğen ve yorumla
- **Anlık eşleşme panosu** — radarı aç, 10 saniyede bir aynı şarkıdaki biri panoya düşsün; sağa kaydır beğen, sola kaydır geç
- **Yapay zeka şarkısı** — sohbette eşleşmeniz için şarkı üret; aşamalı ilerleme, iptal edilebilir
- **Platinum** — paket karşılaştırması ve yükseltme ekranı (ödeme alınmaz)
- **Ayarlar** — bağlı hesap, engellenen kişiler, hesap verilerini silme
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
node scripts/make-artifact.mjs   # artifact/ altına iki dosya yazar
```

| Dosya | Ne işe yarar |
|---|---|
| `artifact/makromusic-standalone.html` | Tam HTML belgesi. Çift tıkla açılır, statik sunucuya atılır. Favicon gömülü. |
| `artifact/makromusic.html` | Sarmalayıcısız gövde — `<html>/<head>/<body>` etiketlerini host'un sağladığı ortamlar için. Tek başına açılmaz. |

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

## Anlık eşleşme panosu

`/anlik` sayfası, radar açıkken 10 saniyede bir (`LIVE_BOARD_INTERVAL_MS`) panoya bir kişi ekler. İlk kart beklemeden düşer; sonrakiler ritme uyar. Şarkı değişince pano sıfırlanır — eski kartlar eski şarkıyla ilgiliydi.

Adaylar `src/lib/liveBoard.ts` içinde üç kademede sıralanır ve her kart hangi kademeden geldiğini yazar:

| Kademe | Etiket |
|---|---|
| Şarkı, kişinin en çok dinlediklerinde | şu an aynı şarkıda |
| Şarkının sanatçısı listesinde | aynı sanatçıyı dinliyor |
| Sanatçının türlerinden biri ortak | aynı türde takılıyor |

Yalnız birinci kademeyi kullanmak panoyu yirmi saniyede kurutuyordu — herhangi bir şarkı en fazla iki üç kişinin listesinde. Alt kademeler panoyu canlı tutuyor; kart üstündeki etiket de hangisinin geçerli olduğunu saklamıyor.

### Kaydırma

`src/components/SwipeCard.tsx` pointer olaylarıyla çalışır, hem panoda hem Keşfet destesinde kullanılır. 110 px'i geçen yatay sürükleme kararı verir, altında kalan yayla geri döner. Sürükleme yönüne göre "BEĞEN" / "GEÇ" katmanı belirir, kart açıyla döner.

İlk 8 px'te eksen kilitlenir: yatay ise kaydırma, dikey ise sayfa kaydırması olarak devam eder (`touch-action: pan-y`) — yoksa telefonda sayfayı aşağı kaydırmak imkânsız hale geliyordu. `prefers-reduced-motion` açıksa uçuş animasyonu atlanır, karar anında uygulanır. Düğmeler de duruyor; kaydırma tek yol değil.

## Profil fotoğrafı

Seçilen dosya `src/lib/image.ts` içinde canvas ile ortadan kare kırpılır, 256×256'ya küçültülür ve JPEG data URL'e çevrilir — birkaç MB'lık kamera dosyası yerine ~4 kB saklanır. Sonuç `localStorage`'a yazılır, yani sayfa yenilense de kalır. Depolama kapalıysa (gizli sekme, kota dolu) fotoğraf o oturum boyunca çalışmaya devam eder; yükleme başarısız sayılmaz.

## Spotify mimarisi

`src/services/spotify.ts` gerçek Web API'nin şeklini taklit eder: `authorize()` bir bearer token döner, `getProfile()`, `getTopItems()` ve `getNowPlaying()` o token'la okur. Token bir saat sonra dolar, süresi geçmiş token 401 verir, `getNowPlaying()` hiçbir şey çalmıyorsa `null` döner — gerçek uç noktanın 204'ü gibi.

Bu dosyayı `api.spotify.com`'a giden gerçek `fetch` çağrılarıyla değiştirmek, uygulamanın geri kalanının ihtiyaç duyduğu tek değişikliktir; hiçbir bileşen verinin uydurma olduğunu bilmez.

`AuthContext` oturumu tutar, `localStorage`'a yazar, açılışta geri yükler ve şu an çalanı 15 saniyede bir yeniler. Kullanıcı artık sabit bir `ME` nesnesi değil — oturumdan türer, o yüzden farklı hesapla girince tüm uygulama değişir. Korumalı rotalar `RequireAuth` arkasında; oturum yoksa onay ekranına düşer.

## Teknik

- React 19 + TypeScript, Vite 8
- Tailwind CSS 4 (`@theme` ile token'lar)
- react-router-dom 7, lucide-react ikonlar
- Durum yönetimi: beş React context — `AuthContext` (oturum, zevk, şu an çalan), `SocialContext` (beğeni, eşleşme, mesaj, engelleme, anlık eşleşme), `FeedContext` (gönderiler), `ProfileContext` (fotoğraf, paket), `PlayerContext` (çalar)
- Backend yok, API anahtarı yok. Tüm veri `src/data/` ve `src/services/` altında.

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
├── services/      spotify.ts (sahte Web API), aiSong.ts (şarkı üretimi)
├── lib/           match.ts (uyum motoru), discovery.ts (popülerlik + öneri),
│               liveBoard.ts (pano adayları), visual.ts, image.ts
├── state/         AuthContext, SocialContext, FeedContext, ProfileContext,
│               PlayerContext
├── components/    AppShell, RequireAuth, SwipeCard, LiveMatch, SettingsModal,
│               MiniPlayer, CompatRing, TrackRow, Avatar, PhotoPicker, ...
└── pages/         Welcome, Login, Discover, LiveBoard, Feed, Music, Chats,
                ChatDetail, Events, Platinum, Profile, PersonProfile
```

## Bilinen sınırlar

- Ses dosyası yok — çalar simüle ediliyor, ilerleme zamanlayıcıyla akıyor
- Beğeniler ve mesajlar bellekte tutuluyor; sayfa yenilenince sıfırlanır (profil fotoğrafı hariç, o kalıcı)
- Karşı taraf mesajlara cevap vermiyor; sohbetler tohum verilerle başlıyor
- Tohum sohbetler `gecekusu` hesabının zevkine göre yazıldı; başka hesapla girince metinleri bağlamdan kopuk görünebilir
- Üretilen yapay zeka şarkısının sesi yok — başlık, ruh hali ve süreden ibaret
- Platinum ekranı ödeme almaz; paket yalnızca bu tarayıcıda saklanır
