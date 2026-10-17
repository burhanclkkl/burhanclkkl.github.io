# OPEN / NOTES

Yapay zekâ, yazılım ve sistemler üzerine Türkçe araştırma notları ve etkileşimli anlatımlar. Statik HTML, CSS ve JavaScript kullanır; framework veya veritabanı gerektirmez.

Yayın adresi: https://burhanclkkl.github.io/helloworld/

## Yerelde çalıştırma

Proje kökünde:

```bash
python3 -m http.server 8000
```

`http://localhost:8000` adresini açın. VS Code Live Server da kullanılabilir.

## Ayarlar

`js/config.js` dosyasında GitHub / LinkedIn profilleri, GoatCounter kodu ve footer fotoğrafı tanımlıdır.

- Fotoğraf: `assets/eminem.webp`. Yapılandırmadaki `../assets/eminem.webp` yolu `config.js` konumuna göre çözülür.
- GoatCounter yerelde kapalıdır. Footer'daki ziyaret sayısı için GoatCounter ayarlarında **Allow adding visitor counts on your website** seçeneğini açın. Servise erişilemezse sayaç `—` gösterir.
- Açık / koyu tema seçimi ana sayfada yerel depolamaya kaydedilir.

## Konu ekleme veya güncelleme

`js/topics.js` konu listesinin veri kaynağıdır. Yeni kaydı mevcut konuları örnek alarak ekleyin:

```js
{
  id: '06',
  title: 'Yeni Konu',
  description: 'Kısa açıklama.',
  category: 'ai', // ai, software, system
  categoryLabel: 'AI / TEMELLER',
  accent: 'lilac', // lilac, green, orange, red
  status: 'planned',
  href: ''
}
```

Sayfa hazır olduğunda `status: 'published'` yapın ve `href` alanına sayfanın yolunu yazın. JavaScript kapalıyken de görünmesi için `index.html` içindeki `#topic-list` listesini ve konu sayaçlarını aynı bilgilerle elle güncelleyin.

Konu sayfasında mevcut sunumu temel alabilir, görsel kurallar için [THEME.md](THEME.md) dosyasını kullanabilirsiniz. Kaynakçayı, yayımlanma ve son güncellenme tarihlerini konu sayfasının HTML'i içinde düzenleyin. `article:published_time` ve `article:modified_time` etiketlerini de bu tarihlerle eşleştirin. Mevcut konunun ilk kayıt tarihi 17 Ekim 2026 kabul edilmiştir.

Yeni sayfalarda paylaşım ve canonical etiketlerini ekleyin; yayımlanan adresi `sitemap.xml` içine yazın. Yayın adresi değişirse HTML dosyalarındaki tam adresleri, 404 dönüş bağlantılarını ve sitemap'i elle güncelleyin. Projede otomatik üretim veya derleme adımı yoktur.

Konu listesi başlangıç HTML'inde bulunur; JavaScript yüklenmezse yayımlanan konu bağlantıları kullanılabilir, arama ve filtre araçları gizlenir.

## Context Window kontrolleri

- `→`, `Space`, `PageDown`: sonraki adım; `←`, `PageUp`: önceki adım.
- `Home` / `End`: ilk / son sahne.
- `N`: konuşmacı notları; `F`: tam ekran.
- `#01`–`#07`: doğrudan sahne bağlantıları.
- Üst menüdeki **Kaynakça ve tarihler** paneli JavaScript olmadan da açılır. JavaScript açıkken `Escape` ile kapanır.

32K kapasite ve simülasyon sayıları temsilidir; GPU görseli gerçek bir VRAM hesabı değildir.

## Yayın ve 404

GitHub deposunda **Settings → Pages → Deploy from a branch → main / (root)** ayarını seçin. `.nojekyll` dosyasını koruyun.

GitHub Pages hatalı adreslerde `404.html` dosyasını otomatik gösterir. Python'un standart sunucusu ve Live Server bunu otomatik yapmaz; yerelde `/404.html` adresiyle önizleyin.

Favicon ve 1200 × 630 paylaşım görseli `assets/` içinde hazır dosyalar olarak bulunur.
