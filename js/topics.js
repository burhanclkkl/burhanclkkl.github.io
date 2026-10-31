/* Arşive yeni konu eklemek için bu diziyi genişletin.
 * href yalnızca gerçek sayfası hazır olan konuya verilmelidir.
 */
window.SITE_TOPICS = [
  {
    id: '01', title: 'Context Window',
    description: 'Bir dil modeli aynı anda ne kadar bilgiyi değerlendirebilir?',
    category: 'ai', categoryLabel: 'LLM / TEMELLER',
    accent: 'lilac', status: 'published',
    href: 'topics/context-window/index.html', featured: true
  },
  {
    id: '02', title: 'RAG Mimarisi',
    description: 'Modelin yanıtına dış bilgi nasıl eklenir?',
    category: 'ai', categoryLabel: 'AI / BİLGİ',
    accent: 'green', status: 'published', href: 'topics/rag-mimarisi/index.html'
  },
  {
    id: '03', title: 'Agent ile Chatbot Farkı',
    description: 'Yanıt vermekle araç kullanıp bir hedefi takip etmek arasındaki fark.',
    category: 'ai', categoryLabel: 'AI / AJANLAR',
    accent: 'orange', status: 'published', href: 'topics/agent-chatbot-farki/index.html'
  },
  {
    id: '04', title: 'MCP Nedir?',
    description: 'Modeller ve araçlar arasında ortak bir bağlam protokolü.',
    category: 'system', categoryLabel: 'SİSTEM / PROTOKOL',
    accent: 'lilac', status: 'published', href: 'topics/mcp-nedir/index.html'
  },
  {
    id: '05', title: 'API Gateway',
    description: 'İstek yönetimi, gözlemlenebilirlik ve erişim kontrolü.',
    category: 'software', categoryLabel: 'YAZILIM / ALTYAPI',
    accent: 'red', status: 'planned', href: ''
  },
  {
    id: '06', title: 'Token Nedir?',
    description: 'Bir dil modeli metni nasıl parçalara ve sayılara dönüştürür?',
    category: 'ai', categoryLabel: 'LLM / TOKENİZASYON',
    accent: 'lilac', status: 'published', href: 'topics/token-nedir/index.html'
  },
  {
    id: '07', title: 'Fine-tuning Nedir?',
    description: 'Hazır bir model, örneklerle bir göreve nasıl uyarlanır?',
    category: 'ai', categoryLabel: 'LLM / EĞİTİM',
    accent: 'orange', status: 'published', href: 'topics/fine-tuning/index.html'
  },
  {
    id: '08', title: 'Makine Öğrenmesinde Öğrenme Türleri',
    description: 'Modelin elinde hangi veri veya geri bildirim var?',
    category: 'ai', categoryLabel: 'ML / TEMELLER',
    accent: 'lilac', status: 'published', href: 'topics/ogrenme-turleri/index.html'
  },
  {
    id: '09', title: 'Klasik ML: Tahmin ve Sınıflandırma',
    description: 'Bir sayı mı tahmin ediyoruz, bir sınıf mı seçiyoruz?',
    category: 'ai', categoryLabel: 'ML / KLASİK · 1/3',
    accent: 'lilac', status: 'published', href: 'topics/klasik-ml-tahmin-siniflandirma/index.html'
  },
  {
    id: '10', title: 'Klasik ML: Ağaçlar ve Topluluklar',
    description: 'Tek bir ağacın kararından birlikte çalışan modellere.',
    category: 'ai', categoryLabel: 'ML / KLASİK · 2/3',
    accent: 'orange', status: 'published', href: 'topics/klasik-ml-agaclar-topluluklar/index.html'
  },
  {
    id: '11', title: 'Klasik ML: Kümeleme ve Boyut İndirgeme',
    description: 'Etiket yokken yapı bulmakla temsili küçültmek aynı mı?',
    category: 'ai', categoryLabel: 'ML / KLASİK · 3/3',
    accent: 'green', status: 'published', href: 'topics/klasik-ml-kumeleme-boyut-indirgeme/index.html'
  },
  {
    id: '12', title: 'İlk Yerel Yapay Zekân',
    description: 'Ollama ile modelini indir, ilk sohbetini aç ve offline kullanımı öğren.',
    category: 'ai', categoryLabel: 'LLM / YEREL AI',
    accent: 'green', status: 'published', href: 'topics/ilk-yerel-yapay-zeka/index.html'
  }
];
