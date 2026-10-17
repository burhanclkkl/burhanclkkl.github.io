# MOTION / MONO — Tekrarlanabilir Sunum Teması

**Sürüm:** 1.0  
**Durum:** Kullanıma hazır, konu bağımsız tasarım sistemi  
**Amaç:** Bu belgeyi farklı bir yapay zekâya, tasarımcıya veya geliştiriciye verdiğinizde, **sunumun konusu değişse de görsel kimliği, hareket dili ve etkileşim kalitesi aynı kalsın**.  
**Referans uygulama:** `context_window_interaktif_sunum.html`. Referans yalnızca bu tasarım dilinin bir örneğidir; yeni bir sunum Context Window ile ilgili olmak zorunda değildir.

> **Temel kural:** Konu, metin, veri, örnek ve sahne sayısı değişebilir. Aşağıda `SABİT` olarak işaretlenen tasarım kararları, kullanıcı açıkça tema revizyonu istemedikçe değiştirilemez.

---

## 01 — Tema kimliği [SABİT]

| Alan | Kural |
|---|---|
| Tema adı | **MOTION / MONO** |
| Karakter | Light Minimal + Editorial Tech + Purposeful Motion |
| Sunum ortamı | Tarayıcıda çalışan, tam ekran, sahne tabanlı etkileşimli web sunumu |
| Görsel duygu | Ferah, rafine, teknik, yaratıcı; sakin ama durağan değil |
| Yazı tipi | **JetBrains Mono** — bütün metinlerde |
| Temel zemin | Sıcak kırık beyaz `#FAF9F7` |
| Ana metin | Antrasit-mor `#27232C` |
| Vurgu ailesi | **Lila, yeşil, turuncu, kırmızı** |
| İlkeler | Az metin, büyük fikir, bol negatif alan, konuya özel görsel, nedensel animasyon |
| Kaçınılacak estetik | Jenerik AI dashboard, SaaS landing page, stok illüstrasyon, aşırı kart kullanımı |

**Bir cümlede kimlik:** Kırık beyaz bir editoryal yüzey üzerinde, JetBrains Mono ile yazılmış, lila/yeşil/turuncu/kırmızı anlam sistemine sahip, hareketli ama sakin bir görsel anlatı.

Bu tema **terminal teması değildir**. Kod yazı tipini profesyonel bir tipografik imza olarak kullanır; tüm sayfalara sahte kod pencereleri çizmez.

---

## 02 — Renk sistemi [SABİT]

### 02.1 Temel palet

| Token | HEX | Görev |
|---|---|---|
| `color.background` | `#FAF9F7` | Ana sayfa zemini; geniş ölçüde görünür |
| `color.surface` | `#FFFFFF` | Gerektiğinde sınırlı destek yüzeyi |
| `color.ink` | `#27232C` | Ana başlık, metin ve güçlü grafik çizgileri |
| `color.muted` | `#67616C` | İkincil metin ve açıklamalar |
| `color.rule` | `#EAE5ED` | İnce ayırıcı çizgiler |
| `color.lilac` | `#AE91E8` | Temel kavram, yapı, ana sistem veya odak |
| `color.green` | `#51BA93` | Olumlu durum, ilerleme, başarılı/uygun sonuç |
| `color.orange` | `#FF975E` | Hareket, yeni bilgi, etki, değişim, yeni aşama |
| `color.red` | `#E96B72` | Hata, sınır aşımı, risk, kritik uyarı |
| `color.empty` | `#EEEAF0` | Boş/pasif kapasite, devre dışı alan |

### 02.2 Okunabilir koyu karşılıklar

Pastel vurgu renklerini beyaz/kırık beyaz arka plan üzerinde **küçük metin rengi olarak doğrudan kullanma**. Normal metin için aşağıdaki mürekkep renklerini kullan:

| Token | HEX |
|---|---|
| `color.lilacInk` | `#7957B0` |
| `color.greenInk` | `#247F5F` |
| `color.orangeInk` | `#B45320` |
| `color.redInk` | `#B73946` |

### 02.3 Hafif yüzey tonları

| Token | HEX |
|---|---|
| `color.lilacTint` | `#F0EBF8` |
| `color.greenTint` | `#E8F6EF` |
| `color.orangeTint` | `#FFF0E5` |
| `color.redTint` | `#FCEAEC` |

### 02.4 Renk kompozisyonu kuralları

- Bir sahnenin görsel yüzeyinin yaklaşık **%75–85'i nötr/açık** kalmalı; bu kesin bir piksel kotası değil, sanat yönetimi hedefidir.
- Bir sahnede **en fazla iki vurgu rengi baskın** olabilir. Diğer iki renk yalnızca gerçek anlam ihtiyacı varsa görünür.
- **Lila = kavram/yapı**, **turuncu = hareket/değişim**, **yeşil = olumlu durum**, **kırmızı = risk/hata** semantiği sunumlar arasında korunur.
- Dört rengi aynı başlıkta, aynı grafikte eşit ağırlıkla sırf tema rengi olduğu için kullanma.
- Degrade metin, yoğun glow, cam efekti, neon gölge ve rastgele renkli blob kullanma.
- Anlamı yalnızca renkle iletme; rakam, metin, desen veya konumla da destekle.
- Konu başka bir semantik gerektiriyorsa önce **bu dört rengin görevleri içinde** çözüm bul. Yeni marka rengi ekleme.

---

## 03 — Tipografi [SABİT]

### Font

- Her unsurda **JetBrains Mono**. Başlık, paragraf, sayısal veri, buton, navigasyon, grafik etiketi, sunucu notları dahil.
- İzinli ağırlıklar: `400`, `500`, `600`, `700`.
- Teknik sahnelerde `tabular-nums` veya eşdeğeri ile hizalı rakamlar.
- Gerekirse erişim sorunu için geçici sistem monospace fallback kullanılabilir, fakat nihai sunumda JetBrains Mono'nun yüklendiği doğrulanmalıdır.
- JetBrains Mono'nun lisansı ve dağıtım koşullarına uyulmalı; kullanıcıya font dosyası paketlenmesi zorunlu değildir. Web sunumu bir font CDN'i kullanabilir; çevrimdışı kullanım istenirse font lisansı ve dağıtım yöntemi ayrıca çözümlenir.

### 1920 × 1080 referans ölçek

| Eleman | Boyut | Ağırlık | Satır aralığı |
|---|---:|---:|---:|
| Açılış ana başlığı | 72–92 px | 700 | 1.06–1.13 |
| Sahne başlığı | 46–62 px | 600–700 | 1.1–1.2 |
| Büyük veri / sayı | 64–100 px | 600–700 | 1.0–1.1 |
| Açıklama | 22–27 px | 400 | 1.45–1.6 |
| Şema etiketi | 17–21 px | 500–600 | 1.3–1.5 |
| Kontrol | 16–19 px | 500–600 | 1.3 |
| Meta etiket / dipnot | 12–15 px | 500 | 1.4–1.6 |

**Responsive ölçek:** `clamp()` ya da eşdeğer uyarlanabilir ölçek kullan; ölçüleri küçük ekranlarda körü körüne sabit tutma. Büyük başlıklar en fazla 2–3 satır, açıklamalar genellikle 1–2 satır olmalı. Çok uzun Türkçe başlıklar görsel olarak doğru yerden kırılmalı.

### Yazı kullanım dili

- Gereksiz tamamı büyük harfle yazılmış uzun cümleler kullanma. Büyük harf yalnızca küçük kategori etiketlerinde olabilir.
- Teknik sözcükleri vurgulamak için `_`, `/`, `>`, `{}` motiflerini **seyrek** kullan.
- Her sahnede birçok farklı font ağırlığı, altı çizili cümle ve renkli kelime yığma.
- Metin grafik gibi kullanılabilir; kelimeleri küçük kartlar içine hapsetme.
- Yüksek kontrastı koru, küçük metinleri pastel renkte gösterme.

---

## 04 — Düzen ve boşluklar [SABİT]

- Öncelikli tuval: **16:9**, tam ekran projeksiyon/masaüstü; mobilde yeniden akışlı tasarım.
- Referans: **1920 × 1080**; ayrıca 1366 × 768 ve 1024 × 768 üzerinde kontrol et.
- Referans güvenli kenar boşlukları: yatay yaklaşık **96–118 px**, dikey yaklaşık **72 px**; `clamp()` ile ölçekle.
- İçeriğin yararlı maksimum genişliği yaklaşık **1440–1580 px**; kompozisyonu her sahnede aynı merkeze mahkûm etme.
- Tasarım ritmi: **bol negatif alan**, hizalanmış güçlü tipografi, ince kurallar, tek baskın görsel.
- Önerilen spacing ailesi: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px`. Göz kararı rastgele aralık üretme.
- Çizgi: `1 px` nötr; bazı odak çerçevelerinde `2 px` vurgu.
- Köşe: küçük detaylarda `4–10 px`; büyük simülasyon alanlarında en çok `14 px`. Her nesneyi 20+ px yuvarlatma.
- Gölge yerine öncelik: **boşluk → çizgi → hafif ton ayrımı**. Gölge gerekiyorsa çok hafif.
- Görsel alanlar konuya özgü tasarlanmalı; bir “widget galerisi” olarak sunum yapılmamalı.

### Sahne yerleşim aileleri [SABİT ÇEŞİTLİLİK KURALI]

İçeriğe uygun seç; her sunumun aynı sahne dizilimini takip etmesi gerekmez.

1. **Editorial opener:** Tek büyük soru/fikir, az yardımcı nesne.
2. **Object-centric:** Sayfanın odağında tek büyük diyagram/nesne.
3. **Asymmetric explainer:** Sol metin, sağ önemli görsel veya tersi.
4. **Interactive focus:** Alanın çoğu simülasyona ayrılır, kontroller ikincildir.
5. **Before / after:** Aynı nesnenin iki durumunun sade karşılaştırması.
6. **Technical lens:** Basit sistem şeması veya bellek/veri/akış görünümü.
7. **Editorial closing:** Kısa güçlü çıkarım, en çok üç destekleyici ifade.

**Yasak:** Her sahneye “başlık + 3 eşit kart + ikon + açıklama” düzeni uygulamak.

---

## 05 — Hareket dili [SABİT]

Sunumun ayırt edici özelliği **amaçlı animasyon** olmalı. Hareket bir fikrin nasıl değiştiğini açıklamıyorsa kullanma.

| Hareket | Süre | Kullanım |
|---|---:|---|
| Mikro tepki | 120–200 ms | Hover, focus, seçim |
| Metin reveal | 450–650 ms | Başlık veya kısa açıklama görünüşü |
| Sahne geçişi | 450–700 ms | Sahne arasında kontrollü görsel akış |
| Bilgi akışı | 650–900 ms | Sisteme eklenen veri, mesaj, token vb. |
| Sayaç dönüşümü | 450–650 ms | Sayısal değer değişimi, kesin rakamla bitiş |
| Nesne dönüşümü / morph | 550–850 ms | Aynı konseptin bir sonraki durumu |
| Kritik uyarı | 250–400 ms | Gerçekten sorunlu durumlarda tek pulse |

- Önerilen easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Hareket karakteri: hızlı başlayan, yumuşak biten, **fazla esnemeyen**.
- Ekranda en fazla **bir baskın hareket fikri** olsun.
- Aynı kavram sahneler arasında devam ediyorsa, mümkünse nesne konum/boyut/durum değiştirerek yolculuğunu sürdürsün.
- Sonsuz partikül yağmuru, 3D tilt, yoğun parallax, her yöne uçan nesneler, devamlı pulse ve dekoratif animasyon kullanma.
- Kullanıcı ilerleyişi keserse animasyon kararlı yeni duruma ulaşabilmeli.
- `prefers-reduced-motion` desteklenmeli. Hareket azaltıldığında hiçbir ana bilgi kaybolmamalı.
- Animasyonlar ses gerektirmez; otomatik müzik ve ses efekti yoktur.

### Animasyon tarifinin yazım standardı

Yeni sunumun her animasyonunu şu beş alanla tanımla:

1. **Nesne:** Hangi öğe hareket ediyor?
2. **Başlangıç durumu:** Konum, görünürlük, boyut, değer.
3. **Bitiş durumu:** Net ve deterministik hedef durum.
4. **Tetikleyici:** Sunucu sonraki adıma basınca mı, bir seçenek değişince mi?
5. **Süre ve gerekçe:** Milisaniye ve öğrenmeyi kolaylaştırdığı neden.

“Güzel animasyon ekle” ifadesini geçerli bir teknik talimat sayma.

---

## 06 — Navigasyon ve etkileşim [SABİT]

Tarayıcı sunumu kullanıcı tarafından yönetilir; sahneler bir videodaki gibi kendiliğinden geçmek zorunda değildir.

| Kontrol | Davranış |
|---|---|
| `→`, `Space`, `PageDown` | Önce sahnenin sıradaki anlatım adımı, sonra sonraki sahne |
| `←`, `PageUp` | Önce önceki anlatım adımı, ardından önceki sahne |
| `Home` | İlk sahne |
| `End` | Son sahne |
| `N` | Sunucu notlarını göster/gizle (opsiyonel) |
| `F` | Tam ekran aç/kapat (tarayıcı izin verirse) |
| Görünür ileri/geri | Her sahnede bulunmalı |
| Sahne sayacı | Küçük, sakin, `01 / 07` benzeri |
| İlerleme göstergesi | İnce, görsele rakip olmayan |

- Klavyeyle gezinme her zaman çalışmalı, odaklanabilir gerçek butonlar kullanılmalı.
- Hızlı ileri/geri yapıldığında sayı ve animasyon durumları bozulmamalı.
- Simülasyonlar geri alınabilir, seçimler tekrar yapılabilir ve gerekirse sıfırlanabilir.
- Ekran metni ile sunucu notu ayrılmalı; sunucu notunu ana sahnenin içine büyük paragraf olarak ekleme.
- Kullanıcının etkileşimi gerektirmeyen dekoratif kontroller ekleme.
- Dokunmatik cihazlarda hedef en az `44 × 44 CSS px`.

---

## 07 — İçerik ve anlatım ilkeleri [SABİT]

Bu tema herhangi bir konuya uygulanabilir: LLM, Context Window, Agent, siber güvenlik, mimari, yazılım, ürün, bilim, süreç, finans, proje tanıtımı vb.

**İçerik değişken; anlatım kalitesi sabit.**

- **Bir sahne = bir temel fikir.** Bir ekranda beş kavramı açıklamaya çalışma.
- Her sunum bir **merak uyandıran soru/gerilim** ile başlamalı; zorunlu olarak aynı soru cümlesi kullanılmaz.
- Önce sezgisel açıklama, sonra kısa teknik detay ve gerekli örnekler gelir.
- Metni yüksek sesle anlatan sunucu olacaktır. Ekran metni konuşmayı tamamlar; tekrar etmez.
- Akış: **Merak → Kavram → Mekanizma → Deney/Örnek → Sonuç**; konu gerekirse farklı sahne sayısına genişler.
- Teknik iddialar örnekse “örnek/temsili” diye belirtilir; ölçülmeyen veriler benchmark gibi sunulmaz.
- Sahnelerde uzun madde listeleri ve dokümandan kopyalanmış metin duvarları bulunmaz.
- Son sahnede kısa ve akılda kalıcı tek fikir, gerekirse üç kısa çıkarım bulunur.

**Konuya göre değişebilen:** Sunum başlığı, konu, izleyici, süre, sahne sayısı, açıklama dili, simülasyon verileri, diyagram tipleri, tekil sahnelerin kompozisyonu, anlatıcı notları.

**Konuya göre değişmeyen:** Renk tokenları, JetBrains Mono, nötr zemin, görsel disiplin, hareket zamanlama sistemi, kontrol karakteri, sade/özgün görünüm, teknik doğruluk ve erişilebilirlik beklentisi.

---

## 08 — Bileşen ve görsel varlık ilkeleri [SABİT]

**Öncelikli varlık türleri:** CSS ile çizilmiş basit şekiller, özgün SVG şemaları, çizgiler, veri akışları, tipografik kompozisyonlar, anlam taşıyan geometrik semboller.

**Yalnızca gerekliyse:** Fotoğraf, video, gerçek ürün görüntüsü, marka logosu; gerçek bilgiye dayanmalı ve telif koşullarına uyulmalı.

**Kaçın:** Robot/beyin/roket/ampul stok illüstrasyonu, emoji başlıklar, her yerde benzer ikon, gösteriş amaçlı grafikler, web arayüzüymüş gibi sahte metrikler.

Sunum **hazır komponent vitrini** gibi görünmemeli. Grafik ya da simülasyon konu için özel üretilmiş hissi vermeli.

---

## 09 — Teknik ve kalite sözleşmesi [SABİT]

- Güncel Chrome/Chromium, Firefox ve Safari masaüstünde çalışmalı.
- Referans ekranlar: 1920×1080, 1366×768, 1024×768, 390×844. Ekran dışına taşan kritik metin olmamalı.
- Erişilebilir HTML, klavye odağı, renk kontrastı, reduced motion, anlamlı erişilebilir adlar kullanılmalı.
- Görsel amaçlı hızlı animasyonlarda mümkün oldukça `transform`/`opacity` tercih et.
- Dış servis/analitik, hesap veya veri tabanı yalnızca açık ihtiyaç varsa dahil edilmeli.
- Tam ekran başlatma başarısız olsa da sunum normal çalışmalı.
- Font bağlantısı çevrimdışı koparsa metin okunabilir bir monospace fallback'e düşmeli; offline sunum istendiğinde uygun font dağıtım yolu seçilmeli.
- Yeni bir framework seçilebilir, ancak **tema kararları framework tarafından belirlenmemeli**.
- Her etkileşimin gerçekten çalıştığı ve ileri/geri adımların deterministik olduğu test edilmeli.

---

## 10 — Anti-pattern listesi [SABİT]

Başka bir AI aşağıdaki yaklaşımları **uygulamamalı**:

1. Her slaytta 3 veya 4 özdeş yuvarlak kart.
2. Beyaz üzerine neon gradient, cam efektli paneller, parlak glow.
3. “Şık olsun” diyerek kullanıcı paletini değiştirme.
4. Başka bir font veya başlıklarda sans-serif / metinde monospace karışımı.
5. Emojilerle, temsili olmayan stok resimlerle doldurulmuş sunum.
6. Aynı hizalamayı, aynı iki kolon oranını ve aynı şekli her sahnede kullanma.
7. Bir sahnedeki mantıksal nesneyi sonraki sahnede tamamen yeni bir ilgisiz nesneye dönüştürme.
8. Sadece estetik için sürekli hareket, aşırı slow-motion veya parallax.
9. Belirsiz veri etiketleri, gerçek olmayan performans rakamları.
10. Seyirciyi küçük puntolu detaylarla boğma.
11. Tam ekran kullanmayı zorunlu kılan veya klavye kontrolü olmayan yapı.
12. Tamamen statik sayfalar; etkileşimli diye yalnızca ileri/geri düğmesi koyma.

---

## 11 — Yeni konuya uygulama protokolü

Yeni bir sunum için aşağıdaki **değişken girdiler** toplanır. Bunlar tema kuralları değildir.

```text
KONU: [sunumun başlığı ve amacı]
HEDEF KİTLE: [teknik / karışık / başlangıç]
SÜRE: [ör. 5 / 10 / 15 dakika]
DİL: [ör. Türkçe]
ANA MESAJ: [izleyicinin aklında kalacak tek cümle]
TEKNİK DERİNLİK: [basit / orta / ileri]
ZORUNLU KONULAR: [varsa]
HASSAS KISITLAR: [varsa kaynak sınırı, marka, telif vb.]
ÇIKTI: [önce storyboard / sonra çalışan web sunumu]
```

Bu alanların dışında sunum konusu ile ilgili hiçbir örnek, görsel veya değer **tema dosyasına gömülü değildir**. Yeni konu için yeni bir `CONTENT_BRIEF.md` veya `PRESENTATION_SPEC.md` üretilebilir.

### Konu + tema dosyası birlikte verildiğinde öncelik sırası

1. Kullanıcının yeni konuya ilişkin açık içerik hedefi ve doğruluk gereksinimleri.
2. **Bu THEME.md içindeki sabit görsel sistem.**
3. Konuya ait yeni sahne planının özgün ihtiyaçları.
4. Seçilen framework'ün uygulama detayları.

Tema kilitlerinin değiştirilmesi isteniyorsa dosyanın yeni bir sürümü çıkarılır; başka AI kendiliğinden yeni tema icat etmez.

---

## 12 — Başka bir AI'a aynen verilecek görev promptu

> Sen deneyimli bir **creative technologist, motion designer, bilgi tasarımcısı ve frontend geliştiricisisin**.
>
> Sana verilen **`THEME.md`**, bütün sunum projelerimin sabit sanat yönetimi ve etkileşim standardıdır. Konu değişse de aynı görsel kimliği uygula. Renkler, tipografi, hareket dili, kontroller ve anti-pattern kurallarını değiştirme.
>
> **Tema:** MOTION / MONO. Sıcak kırık beyaz `#FAF9F7` zemin; antrasit `#27232C` metin; lila `#AE91E8`, yeşil `#51BA93`, turuncu `#FF975E`, kırmızı `#E96B72` vurgu; bütün arayüzde **JetBrains Mono**.
>
> Yeni konuda **özgün bir sahne anlatısı** tasarla. “Başlık + üç kart” gibi hazır yapılar kullanma. Her sahnede tek ana fikir, bol boşluk, konuya özel özgün diyagram ve gerekçeli animasyon bulunmalı. Referans sunumun görünümünü kopyalama.
>
> **Önce** süreye uygun storyboard, sahne metinleri, görsel kompozisyonlar, etkileşimler, animasyon zaman çizelgesi ve sunucu notları oluştur. Kullanıcı uygulama istediğinde çalışan tarayıcı sunumunu geliştir; çalışmayan dekoratif düğmeler ekleme.
>
> Bilimsel ve teknik iddiaları doğrula. Sayıları temsiliyse açıkça belirt. Erişilebilirlik, farklı ekranlar, azaltılmış hareket tercihi, klavye navigasyonu ve ileri/geri durum tutarlılığı vazgeçilmezdir.
>
> Sonuç bir chatbot dashboard'u veya standart AI üretimi şablon gibi değil; profesyonel sanat yönetimi yapılmış, **aynı tema ailesine ait özgün ve hareketli bir web anlatısı** gibi görünmeli.

---

## 13 — Kabul kriterleri (her yeni sunum için)

### Görsel
- [ ] Tüm metinlerde JetBrains Mono kullanılmış.
- [ ] Zemin `#FAF9F7`; ana metin `#27232C`.
- [ ] Lila/yeşil/turuncu/kırmızı semantiği tutarlı.
- [ ] Her sahnede tüm renkleri kullanma zorunluluğu yok; renkler seçici kullanılmış.
- [ ] Büyük, okunaklı tipografi ve bol negatif alan var.
- [ ] Sahneler farklı kompozisyonlu fakat aynı tasarım ailesinde.
- [ ] Üç kartlı jenerik AI dashboard görünümü yok.

### Anlatı ve hareket
- [ ] Her sahnede bir temel fikir var.
- [ ] Açılış sorusu/gerilimi ve anlamlı kapanış var.
- [ ] Her animasyonun bilgi aktarma amacı belirli.
- [ ] İleri/geri durumları tutarlı ve yeniden oynatılabilir.
- [ ] En az bir ana kavram özel görselleştirme veya kontrollü etkileşimle açıklanıyor.

### Teknik
- [ ] Klavye ve dokunma ile kullanılabilir.
- [ ] Sunucu notu ve sahne metinleri ayrılmış.
- [ ] Küçük ekranlarda kritik içerik taşmıyor.
- [ ] Reduced-motion tercihi destekleniyor.
- [ ] Örnek veriler gerçek ölçüm gibi sunulmuyor.
- [ ] Görünür ama çalışmayan kontrol bulunmuyor.

---

## 14 — Kısa tema manifestosu

**MOTION / MONO:** *Monospace bir ses. Kırık beyaz bir tuval. Lila fikir, turuncu hareket, yeşil ilerleme, kırmızı uyarı. Az öğe, güçlü anlam. Her sahnede gerçek bir fikir; her animasyonda gerçek bir neden.*

Bu dosyayı **sunumdan bağımsız ana tema** olarak saklayın. Her yeni konu için değiştirilmesi gereken belge tema değil, konu brifi olmalıdır.
