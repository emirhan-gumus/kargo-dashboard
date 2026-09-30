// Tüm CSV verisi burada tutulacak
let veri = [];

// 1) CSV metnini nesne listesine çevirir
function csvOku(metin) {
  const satirlar = metin.trim().split("\n");
  const basliklar = satirlar[0].split(",");

  return satirlar.slice(1).map(function (satir) {
    const degerler = satir.split(",");
    const nesne = {};

    basliklar.forEach(function (baslik, i) {
      nesne[baslik.trim()] = degerler[i].trim();
    });

    // Sayı olması gereken alanları sayıya çevir
    nesne.tonaj = Number(nesne.tonaj);
    nesne.zamaninda = Number(nesne.zamaninda);
    nesne.doluluk = Number(nesne.doluluk);
    return nesne;
  });
}

// 2) Bir listenin ortalamasını hesaplar
function ortalama(liste, alan) {
  const toplam = liste.reduce(function (t, satir) {
    return t + satir[alan];
  }, 0);
  return toplam / liste.length;
}

// 3) KPI kartlarını doldurur
function kartlariGuncelle(liste) {
  const toplamTonaj = liste.reduce(function (t, satir) {
    return t + satir.tonaj;
  }, 0);

  document.getElementById("kpiTonaj").textContent =
    toplamTonaj.toLocaleString("tr-TR") + " ton";

  document.getElementById("kpiZaman").textContent =
    "%" + ortalama(liste, "zamaninda").toFixed(1);

  document.getElementById("kpiDoluluk").textContent =
    "%" + ortalama(liste, "doluluk").toFixed(1);
}

// 4) Sayfa yüklenince veriyi çek ve ekrana yansıt
function baslat() {
  fetch("data.csv")
    .then(function (yanit) {
      return yanit.text();
    })
    .then(function (metin) {
      veri = csvOku(metin);
      kartlariGuncelle(veri);
    })
    .catch(function (hata) {
      console.error("Veri okunamadı:", hata);
    });
}

baslat();
