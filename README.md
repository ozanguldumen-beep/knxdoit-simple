# Modüler Masraf - Kurumsal Harcama Yönetim Sistemi

## Özellikler
- Login
- Personel, departman, rol yönetimi
- Roller: Personel, Departman Yöneticisi, Muhasebe, Finans, Sistem Yöneticisi
- Kamera/fotoğraf ile harcama belgesi yükleme
- Google Vision OCR
- OpenAI ile AI parsing
- Otomatik alanlar: Firma Ünvanı, Belge Tarihi, Belge No, Matrah, KDV, Toplam
- Dinamik onay akışları
- Departman + masraf türü bazlı flow
- Tutar bazlı onay kuralı
- Kişi bazlı onay ve aylık harcama limitleri
- Risk kontrolleri: yüksek tutar, aylık limit, tekrarlayan harcama
- Aylık dönem kapanışı
- Fiş/açıklama zorunluluğu
- Eksik evrak / red bildirimleri
- Muhasebe ve finans ekranları
- Audit log

## Kurulum
```bash
npm install
cp .env.example .env
npm start
```

Aç:
```text
http://localhost:3000
```

## Railway
GitHub'a yükle, Railway'de repo seç, environment variables içine `.env.example` içindeki değerleri ekle.

## Not
Bu MVP SQLite ve lokal uploads kullanır. Railway'de kalıcı dosya için sonraki sürümde Cloudflare R2 / S3 önerilir.
