# makromusic klonu

Müzik zevkine göre insanlarla tanıştıran sosyal uygulamanın çalışan bir klonu. Profil fotoğrafı yerine çalma listesi üzerinden eşleştirme yapar.

> Eğitim amaçlı bir demo. Gerçek makromusic ile bir bağlantısı yoktur; markası veya verisi kullanılmamıştır.

## Ne var

- **Spotify ile giriş** — sahte OAuth onay ekranı; hesap seç, izinleri gör, bağlan. Zevkin, sanatçıların ve şu an çalan parçan oradan gelir
- **Müzik uyumu motoru** — iki kişinin en çok dinlediği sanatçı, şarkı ve türleri karşılaştırıp %42–99 bandında bir uyum skoru üretir
- **Keşfet** — Tinder gibi kaydırılan deste, ama havuz sabit değil: **aynı anda aynı şarkıyı dinleyenler** 10 saniyede bir birikir. Bir dakikanın sonunda 6 kişi kaydırılabilir
- **Eşleşme** — beğendiğin kişi yeterince yakın zevkteyse karşılık verir ve kutlama ekranı açılır
- **Sohbet** — metin mesajı ve şarkı gönderme; gönderilen şarkı baloncuğun içinden çalınır
- **Müzik** — popüler şarkılar kare kapak ızgarasında, her birinin üstünde o şarkı üzerinden kaç kişiyle eşleşebileceğin
- **Şarkı önerileri** — zevkine en yakın kişilerin dinlediği, senin listende olmayan şarkılar
- **Sosyal akış** — şarkılar hakkında gönderi yaz, başkalarınınkini beğen ve yorumla
- **Yapay zeka şarkısı** — sohbette eşleşmeniz için şarkı üret; aşamalı ilerleme, iptal edilebilir
- **Geri alma** — yanlış kaydırmayı geri al; ücretsizde günde 1, Platinum'da sınırsız
- **Seni beğenenler** — seni kimin beğendiği; ücretsizde sayı, Platinum'da isimler
- **Platinum** — paket karşılaştırması ve yükseltme ekranı (ödeme alınmaz). Vaat ettiği üç sınır gerçekten uygulanır
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

`scripts/verify-artifact.mjs` çıktıyı **düşmanca bir host** altında açar: sayfanın kendi CSS'inden önce enjekte edilen, katmansız bir `body { background:#fff; color:#111 }`. Katmansız kurallar `@layer` içindeki her şeyi yendiği için bu, gerçek ortamı taklit eder. Kontroller: `#root` doluyor mu, `body` kendi zeminini ve metin rengini boyayabiliyor mu, rengini miras alan metinler koyu zeminde okunuyor mu, dış istek var mı, yatay taşma var mı.

```bash
npm i -D playwright
node scripts/verify-artifact.mjs
```

### Neden katmansız

`body` renkleri `@layer base` içindeyken host'un katmansız `body` kuralı onları eziyordu: zemin beyaza dönüyor, rengini miras alan her şey — isimler, başlıklar, düz bağlantılar — koyu kartın üstünde neredeyse siyah kalıp kayboluyordu. Açık renk sınıfı taşıyanlar kurtuluyordu, o yüzden metinlerin yalnızca bir kısmı yok oluyordu. Düşmanca host altında ayakta kalması gereken kurallar `src/index.css` içinde katman **dışında** durur.

## Denetim

`audit.mjs` paleti ve arayüzü ölçer: token çiftlerinin kontrast oranları, her rotada yatay taşma, 375px'de 40px'in altındaki dokunma hedefleri, kırpılan metinler, console hataları. Her ekranın iki genişlikte ekran görüntüsünü de alır.

```bash
npm i -D playwright     # kayıtlı bağımlılık değil
npm run dev             # başka bir terminalde
node audit.mjs
```

Bu geçişte bulup düzelttikleri: orta bant uyum skoru 2.13:1 kontrastla okunmuyordu (`--color-secondary-bright` eklendi), kenarlıklar 1.48:1 ile kayboluyordu (`--color-border` açıldı), yıkıcı metin 4.48:1 ile eşiğin altındaydı (`--color-destructive-bright`), avatar bağlantıları 40×19px'e çökmüştü (`inline-flex`), anahtar ve sayaç düğmeleri 44px'in altındaydı.

### Denetimin göremediği

Bu ölçümler geçtikten sonra bile arayüz soluk görünüyordu. Sebep: WCAG eşiğini geçmek okunaklı olmak demek değil. İkincil metin `#94A3B8` ile 6.57:1'de kalıyordu ve çoğu yerde 10–11px'e basılıyordu; toplamı telefonda yıkanmış görünüyordu.

Yapılanlar: `--color-muted-foreground` `#B3C0D4`'e açıldı (kartta 9.15:1), 12px altındaki bütün sınıflar kaldırıldı, şarkı/sanatçı gibi bilgi taşıyan ikincil satırlar 14px'e çıkarıldı, kenarlıklar `/60`–`/70` opaklıktan tam tona geçti. Uyum halkasındaki "UYUM" etiketi satır içi stille 7px'e düşüyordu — sınıf tabanlı taban onu yakalamıyordu, alt sınır 10px'e çekildi.

Ders: kontrast oranı gerekli ama yeterli değil; punto ve opaklık da ölçülmeli.

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

## Eşleşme: aynı şarkı, aynı an

Keşfet sabit bir listeyi sıralamaz. Radar açıkken (`LIVE_BOARD_INTERVAL_MS`, 10 sn) senin **o an çaldığın şarkıyı** dinleyen biri desteye eklenir.

İlk kart sıfırıncı saniyede değil, bir tam aralık sonra düşer. Yoksa bir dakikanın sonunda yedi kart olurdu; böyle **tam altı** oluyor:

| Süre | Destedeki kişi |
|---|---|
| 0 sn | 0 |
| 10 sn | 1 |
| 30 sn | 3 |
| 60 sn | **6** |

Sayaç ve ilerleme çubuğu bir sonrakine kaç saniye kaldığını gösterir; ritim tahmin edilmek zorunda kalmaz.

### Paket sınırları gerçek

Platinum ekranı bir süre var olmayan özellikler satıyordu. Üçü de yazıldı ve `SocialContext` içinde uygulanıyor:

| Vaat | Ücretsiz | Platinum |
|---|---|---|
| Günlük keşif | 10 kaydırma (`FREE_DAILY_SWIPES`) | Sınırsız |
| Geri alma | Günde 1 (`FREE_UNDOS`) | Sınırsız |
| Seni kimin beğendiğini gör | Sayı görünür, isimler bulanık | Açık, oradan beğenilebilir |

Geri alma yalnızca kartı iade etmez: kaydırmanın yaptığı her şeyi geri sarar — verdikt, o kaydırmanın kurduğu eşleşme, sohbet, kutlama ve harcanan günlük hak. Yoksa geri aldığın halde kabul etmediğin bir eşleşme geride kalırdı.

Düğme destenin **dışında** durur. İçindeyken son kart kaydırılınca birlikte kayboluyordu — yanlış kaydırmanın en can yaktığı an.

İki günlük hak da `localStorage`'da tutulur. Geri alma hakkı yalnız bellekte dururken sayfayı yenilemek harcanmış hakkı geri veriyordu; kaydırma hakkı ise kalıcıydı. İki hak aynı şekilde davranmalı, aksi halde ücretli sınırın etrafından tek tuşla dolaşılıyordu.

"Seni beğenenler" ayrı bir zar atışı değil: `like` fonksiyonunun karşılık verme kuralının aynısı, önceden gösterilmiş hali. Bu yüzden oradan beğenmek her zaman eşleşmeyle sonuçlanır.

### Dinleyici nereden geliyor

`src/lib/presence.ts` bir **canlı dinleme akışı** taklit eder. Kritik nokta: kimin destede olacağı, kişilerin "en çok dinledikleri" listesinden türetilemez — herhangi bir şarkı kadroda en fazla iki üç kişide bulunur ve öyle kurulmuş bir deste yirmi saniyede kurur.

Bunun yerine, gerçek bir presence servisinin döndüreceği şey modellenir: zamanla insanlar o şarkıyı açar. Herkes açabilir, tıpkı herkesin play'e basabileceği gibi. Zevk yalnızca **sırayı** belirler — şarkıyı zaten seven biri, türe hiç dokunmamış birinden daha olası bir sonraki dinleyicidir. Sıralama şarkı başına deterministiktir, ekrandan çıkıp dönmek kimin "zaten dinliyor" olduğunu yeniden karmaz.

Kart üstündeki "az önce başladı / 3 dk önce başladı" bu simülasyondan gelir.

Kadro 26 kişiye çıkarıldı; 10 kişilik havuz bu ritmi bir dakikadan fazla besleyemiyordu.


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

---

# Gerçek servislere geçiş

Uygulama şu an mock veriyle çalışıyor. Gerçek mimariye geçiş başladı; bu bölüm nerede kalındığını ve nasıl devam edileceğini anlatır.

## Neden Supabase

Firebase yerine Supabase seçildi, belirleyici olan **mesafe bazlı eşleşme**:

| İhtiyaç | Supabase (Postgres) | Firebase (Firestore) |
|---|---|---|
| Yarıçap sorgusu | PostGIS ile tek indeksli `st_dwithin` | Yerel destek yok; geohash kütüphanesi + istemcide eleme |
| Zevk + mesafe birlikte | Tek SQL sorgusu | Sunucu tarafı birleştirme yok, iki aşama |
| Moderasyon | RLS ile satır bazlı; şikayeti yalnız sahibi ve servis rolü görür | Security Rules, daha kırılgan |
| Gerçek zamanlı sohbet | Realtime, tabloya abone | Var |

## Kurulum

```bash
cp .env.example .env      # değerleri doldur
npm install
```

Sıra önemli: Supabase projesi olmadan Spotify'a hangi redirect URI'yi kaydedeceğin belli olmaz.

**1. Supabase projesi.** [supabase.com](https://supabase.com) → yeni proje. Project Settings > API'den `URL` ve `anon public` anahtarını `.env`'e yaz. Proje referansın (`abcdefgh` gibi) bir sonraki adımda lazım.

**2. Spotify uygulaması.** [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) → Create app. Redirect URI olarak **Supabase'in callback adresini** gir, kendi uygulamanınkini değil:

```
https://<proje-ref>.supabase.co/auth/v1/callback
```

Client ID ve Client Secret'ı kopyala. Secret **uygulamaya girmez** — token takası Supabase tarafında olur.

**3. Sağlayıcıyı bağla.** Supabase > Authentication > Providers > Spotify'ı aç, Client ID ve Secret'ı yapıştır.

**4. Dönüş adresleri.** Supabase > Authentication > URL Configuration → Site URL ve Redirect URLs'e uygulamanın adresini ekle (`http://localhost:5173`, sonra üretim adresin).

**5. Şema.** SQL Editor'de `supabase/migrations/` altındaki üç dosyayı **isim sırasıyla** çalıştır. Ya da Supabase CLI ile:

```bash
npx supabase link --project-ref <proje-ref>
npx supabase db push
```

Dosya adları Supabase'in beklediği `<zaman-damgası>_ad.sql` biçiminde; CLI ve GitHub entegrasyonu bu biçime göre sıralar.

İstenen izinler `src/services/spotify.ts` içindeki `SPOTIFY_SCOPES` listesinde durur: `user-read-email`, `user-read-private`, `user-top-read`, `user-read-currently-playing`, `user-read-playback-state`.

> Spotify uygulaman "Development mode"dayken yalnızca dashboard'da tek tek eklediğin hesaplar giriş yapabilir. Kendi hesabın dahil — test edecek herkesi User Management'a eklemen gerekir.

## Şema

| Dosya | İçerik |
|---|---|
| `20250101000001_init.sql` | Tablolar: profiles (PostGIS konum), top_artists, top_tracks, now_playing, swipes, matches, posts, post_likes, post_comments, messages, blocks, reports. Karşılıklı beğeniyi eşleşmeye çeviren trigger. Realtime yayını. |
| `20250101000002_rls.sql` | Row level security. Engelleme iki yönlü çalışır: taraflardan biri engellediyse ikisi de diğerinin satırlarını göremez. Kimin seni beğendiği görünmez — sadece eşleşme satırı görünür. |
| `20250101000003_discovery.sql` | `taste_score` (istemcideki `match.ts` ile aynı formül), `discover_candidates` (zevk + mesafe tek sorguda), `listening_now` (aynı şarkı + tazelik penceresi), `set_my_location`. |

Mesafe filtresi `max_distance_km` null ise "her yer" demektir. Konumu olmayan profiller **yalnızca** o durumda listeye girer — konumu bilinmeyen birine mesafe filtresi uygulamak dürüst olmaz.

## Kod katmanı

| Dosya | Durum |
|---|---|
| `src/services/spotify.ts` | **Gerçek.** api.spotify.com'a `fetch`; profil, top artists, top tracks, şu an çalan. 204, 401 ve 429 ayrı ayrı ele alınıyor. |
| `src/services/db.ts` | **Gerçek.** Tüm CRUD, Realtime abonelikleri, konum, engelleme, şikayet. |
| `src/lib/supabase.ts` | İstemci. Ortam değişkenleri yoksa `null` — çağıranlar bunu ele almak zorunda. |
| `src/components/ReportDialog.tsx` | **Bağlı.** Kişi profilinde "Şikayet et". |
| `src/services/spotifyMock.ts` | **Geçici.** Arayüzü ayakta tutuyor, migrasyon bitince silinecek. |

### Spotify token'ının bir saatlik sınırı

Giriş Supabase Auth üzerinden yapılır (sağlayıcı: Spotify), çünkü RLS'in `auth.uid()`'e ihtiyacı var. Dönen `provider_token` ile Web API çağrılır. Bu token tarayıcıda yenilenemez — yenileme client secret ister. Bir saat sonra `SpotifyAuthExpired` fırlar ve kullanıcıdan yeniden bağlanması istenir. Üretim çözümü: secret'ı tutan bir Supabase Edge Function; uygulamanın geri kalanında hiçbir şey değişmez.

## Kalan iş

Arayüzün tamamı hâlâ `src/data/catalog.ts` üzerinden render ediyor — yerel id'ler (`t-11`), gerçek Spotify id'leri değil. Migrasyonun kalanı:

1. `AuthContext`'i Supabase Auth'a bağla, `spotifyMock.ts`'i sil
2. Bileşenleri id yerine veritabanındaki `track_name` / `artist_name` / `image_url` sütunlarıyla besle, `data/catalog.ts` ve `data/people.ts`'i kaldır
3. `SocialContext` ve `FeedContext`'i `services/db.ts` çağrılarına çevir
4. `ChatDetail`'e `subscribeToMessages` bağla
5. Konum izni akışı → `setLocation`, keşifte mesafe filtresi

**Sosyal grafik uyarısı:** mock `PEOPLE` kaldırıldığında keşif destesi, pano ve öneriler boşalır. Gerçek kullanıcılar kaydolana kadar uygulama boş görünür; test için seed kullanıcı stratejisi gerekir.
