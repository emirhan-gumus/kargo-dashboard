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

// 4) Seçim kutusuna seçenek ekler
function secenekEkle(kutu, deger, yazi) {
  const secenek = document.createElement("option");
  secenek.value = deger;
  secenek.textContent = yazi;
  kutu.appendChild(secenek);
}

// 5) Filtre kutularını veriden doldurur
function filtreleriHazirla() {
  const istasyonKutu = document.getElementById("istasyonSec");
  const baslangicKutu = document.getElementById("baslangicSec");
  const bitisKutu = document.getElementById("bitisSec");

  const istasyonlar = Array.from(new Set(veri.map(function (s) {
    return s.istasyon;
  })));
  const tarihler = Array.from(new Set(veri.map(function (s) {
    return s.tarih;
  }))).sort();

  istasyonlar.forEach(function (ad) {
    secenekEkle(istasyonKutu, ad, ad);
  });

  tarihler.forEach(function (t) {
    secenekEkle(baslangicKutu, t, t.slice(0, 7));
    secenekEkle(bitisKutu, t, t.slice(0, 7));
  });

  // Varsayılan: tüm dönem
  baslangicKutu.value = tarihler[0];
  bitisKutu.value = tarihler[tarihler.length - 1];

  // Seçim değişince filtreyi yeniden uygula
  istasyonKutu.addEventListener("change", filtreUygula);
  baslangicKutu.addEventListener("change", filtreUygula);
  bitisKutu.addEventListener("change", filtreUygula);
}

// 6) Seçimlere göre veriyi süzer ve ekranı günceller
function filtreUygula() {
  const istasyon = document.getElementById("istasyonSec").value;
  const baslangic = document.getElementById("baslangicSec").value;
  const bitis = document.getElementById("bitisSec").value;
  const uyari = document.getElementById("uyari");

  const liste = veri.filter(function (s) {
    const istasyonUygun = istasyon === "hepsi" || s.istasyon === istasyon;
    return istasyonUygun && s.tarih >= baslangic && s.tarih <= bitis;
  });

  if (liste.length === 0) {
    uyari.textContent = "Bu aralıkta veri yok. Başlangıç, bitişten önce olmalı.";
    ["kpiTonaj", "kpiZaman", "kpiDoluluk"].forEach(function (id) {
      document.getElementById(id).textContent = "-";
    });
    grafikleriGuncelle([]);
    return;
  }

  uyari.textContent = "";
  kartlariGuncelle(liste);
  grafikleriGuncelle(liste);
}

// 7) Sayfa yüklenince veriyi çek ve başlat
function baslat() {
  fetch("data.csv")
    .then(function (yanit) {
      return yanit.text();
    })
    .then(function (metin) {
      veri = csvOku(metin);
      filtreleriHazirla();
      filtreUygula();
    })
    .catch(function (hata) {
      console.error("Veri okunamadı:", hata);
    });
}

baslat();
