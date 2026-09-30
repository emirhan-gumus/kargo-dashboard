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

// Grafik nesneleri (filtre değişince yeniden çizmek için saklıyoruz)
let cizgi = null;
let cubuk = null;

// 3.5) Grafikleri çizer
function grafikleriGuncelle(liste) {
  // Aylara göre toplam tonaj
  const aylik = {};
  liste.forEach(function (satir) {
    aylik[satir.tarih] = (aylik[satir.tarih] || 0) + satir.tonaj;
  });
  const aylar = Object.keys(aylik).sort();
  const aylikDegerler = aylar.map(function (ay) {
    return aylik[ay];
  });
  const ayEtiketleri = aylar.map(function (ay) {
    return ay.slice(0, 7); // 2026-04-01 -> 2026-04
  });

  // İstasyonlara göre toplam tonaj
  const istasyon = {};
  liste.forEach(function (satir) {
    istasyon[satir.istasyon] = (istasyon[satir.istasyon] || 0) + satir.tonaj;
  });
  const istasyonAdlari = Object.keys(istasyon);
  const istasyonDegerler = istasyonAdlari.map(function (ad) {
    return istasyon[ad];
  });

  // Eski grafikler varsa önce sil
  if (cizgi) cizgi.destroy();
  if (cubuk) cubuk.destroy();

  cizgi = new Chart(document.getElementById("cizgiGrafik"), {
    type: "line",
    data: {
      labels: ayEtiketleri,
      datasets: [
        {
          label: "Aylık toplam tonaj",
          data: aylikDegerler,
          borderColor: "#b91c1c",
          backgroundColor: "rgba(185, 28, 28, 0.15)",
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  cubuk = new Chart(document.getElementById("cubukGrafik"), {
    type: "bar",
    data: {
      labels: istasyonAdlari,
      datasets: [
        {
          label: "İstasyona göre toplam tonaj",
          data: istasyonDegerler,
          backgroundColor: "#b91c1c"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
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
      grafikleriGuncelle(veri);;
    })
    .catch(function (hata) {
      console.error("Veri okunamadı:", hata);
    });
}

baslat();
