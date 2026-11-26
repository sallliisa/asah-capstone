import hashlib
import itertools
import json
import random
from collections import Counter

import joblib
import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, f1_score

from kos_models.generate import ROOT

LABELS = ["rooms", "schedules", "finances", "guidance", "out-of-scope"]
MIN_GROUPED_VALIDATION_ACCEPTED = 54
TEMPLATES = {
    "rooms": [
        "Tunjukkan riwayat kerusakan {item}",
        "Kamar mana yang punya masalah {item}",
        "Siapa penghuni yang terkait perbaikan {item}",
        "Apakah ada catatan kondisi {item}",
        "Saya mau lihat daftar kamar dengan {item}",
        "Cari aktivitas perawatan {item} milik penyewa",
        "Tampilkan kejadian {item} pada riwayat penghuni",
        "Penyewa mana yang paling perlu diperiksa terkait {item}",
        "Ada berapa perbaikan {item} yang tercatat",
        "Coba periksa hubungan penghuni dengan {item}",
        "Lihat profil tenant dan catatan {item}",
        "Apa saja ruang kosong yang memiliki {item}",
        "Ringkas kondisi kamar dan masalah {item}",
        "Bantu cek histori penanganan {item}",
        "Penghuni sebelumnya pernah mengalami {item} apa saja",
        "Rekap kejadian {item} di kamar penyewa ini",
        "Urutkan tenant berdasarkan perhatian untuk {item}",
        "Informasi hunian dan catatan {item} dong",
        "Saya ingin mengecek keadaan {item} di kamar",
        "Tolong buka rekam aktivitas {item} penghuni",
    ],
    "schedules": [
        "Kapan jadwal perawatan {item} berikutnya",
        "Apa agenda {item} hari ini",
        "Tampilkan rencana rutin {item} minggu depan",
        "Tanggal berapa {item} akan dikerjakan",
        "Ada pengingat {item} yang jatuh tempo",
        "Lihat kalender kegiatan {item}",
        "Kapan terakhir dan selanjutnya jadwal {item}",
        "Daftar pekerjaan {item} yang dijadwalkan besok",
        "Saya perlu tahu waktu pelaksanaan {item}",
        "Apa rencana {item} yang mendekati tanggalnya",
        "Cek kegiatan rutin {item} yang belum jatuh tempo",
        "Rangkum agenda mendatang untuk {item}",
        "Pengingat kegiatan {item} sudah muncul belum",
        "Tolong cari tanggal rencana {item}",
        "Ada aktivitas {item} terjadwal pekan ini",
        "Urutan tanggal jatuh tempo {item} seperti apa",
        "Pekerjaan berkala {item} dijalankan hari apa",
        "Kegiatan {item} kapan harus ditangani menurut jadwal",
        "Sebutkan tenggat rencana {item}",
        "Apa notifikasi jadwal tentang {item} yang belum dibaca",
    ],
    "finances": [
        "Berapa biaya {item} bulan ini",
        "Hitung pengeluaran untuk {item}",
        "Total pemasukan dan pembayaran {item} berapa",
        "Ada tagihan {item} yang belum lunas",
        "Tampilkan uang yang keluar untuk {item}",
        "Bagaimana arus kas dari {item}",
        "Saya mau rekap nominal pembayaran {item}",
        "Jumlah biaya tercatat {item} selama tiga bulan",
        "Berapa rupiah yang dipakai buat {item}",
        "Bandingkan pengeluaran {item} bulan lalu dan sekarang",
        "Cari pembayaran {item} yang terlambat",
        "Sewa terkait {item} sudah dibayar atau belum",
        "Lihat transaksi keuangan untuk {item}",
        "Pengeluaran {item} masuk kategori biaya apa",
        "Ringkas penerimaan uang terkait {item}",
        "Nominal biaya {item} di kamar ini berapa",
        "Mana bukti transaksi pembayaran {item}",
        "Ada uang sewa atau biaya {item} yang menunggak",
        "Saldo arus kas tercatat dari {item} berapa",
        "Saya ingin rincian pemasukan biaya dan pelunasan {item}",
    ],
    "guidance": [
        "Bagaimana cara mencatat {item}",
        "Jelaskan langkah penggunaan aplikasi untuk {item}",
        "Apa panduan penanganan {item}",
        "Kenapa kategori {item} dipakai",
        "Ajari saya prosedur {item}",
        "Apa yang harus diperiksa saat {item}",
        "Boleh jelaskan arti istilah {item}",
        "Tolong beri petunjuk mengisi formulir {item}",
        "Bagaimana aturan operasional tentang {item}",
        "Saya belum paham fungsi menu {item}",
        "Langkah aman ketika menghadapi {item} apa",
        "Apa perbedaan jenis kegiatan {item}",
        "Ada panduan yang membahas {item}",
        "Bantu saya memahami kebijakan {item}",
        "Tata cara pemakaian fitur {item} seperti apa",
        "Berikan penjelasan umum mengenai {item}",
        "Cara kerja pencatatan {item} bagaimana",
        "Aturan kos terkait {item} itu apa",
        "Saya butuh tutorial menyelesaikan {item}",
        "Menurut buku panduan tindakan untuk {item} apa",
    ],
    "out-of-scope": [
        "Buat puisi tentang {item}",
        "Siapa pemenang pertandingan bola kemarin {item}",
        "Rekomendasikan film bertema {item}",
        "Ceritakan dongeng lucu tentang {item}",
        "Tolong kerjakan soal fisika tentang {item}",
        "Bagaimana ramalan zodiak {item}",
        "Siapa presiden Amerika dan apa hubungannya dengan {item}",
        "Buatkan resep kue bernama {item}",
        "Main tebak tebakan tentang {item}",
        "Saya ingin belajar bahasa Jepang dari {item}",
        "Cari tiket pesawat untuk liburan {item}",
        "Berapa harga saham perusahaan {item}",
        "Tulis lirik lagu baru tentang {item}",
        "Kasih lelucon tentang {item}",
        "Siapa tokoh anime yang suka {item}",
        "Jelaskan sejarah kerajaan dan {item}",
        "Apakah alien suka {item}",
        "Prediksi skor sepak bola tim {item}",
        "Bantu pilih hadiah ulang tahun bertema {item}",
        "Saya mau cerita fantasi petualangan {item}",
    ],
}
ITEMS = [
    "AC bocor",
    "pembersihan kamar",
    "perbaikan pintu",
    "sewa bulanan",
    "layanan kamar 12",
    "penggantian lampu",
    "keran air rusak",
    "servis rutin",
    "aktivitas penyewa",
    "nilai perhatian tenant",
]


EXTRA_TEMPLATES = {
    "rooms": [
        "Mana kamar yang saat ini ditempati penyewa {item}",
        "Tolong tunjukkan data hunian terkait {item}",
        "Saya mencari daftar tenant dengan kejadian {item}",
        "Ruangan kosong atau terisi mana yang ada {item}",
        "Apa kondisi terakhir {item} yang dicatat petugas",
        "Laporan kerusakan {item} pernah masuk di kamar mana",
        "Kejadian perbaikan {item} dialami penyewa siapa",
        "Siapa nama penghuni kamar yang mengalami {item}",
        "Ringkasan histori kegiatan {item} per tenant dong",
        "Tampilkan catatan kerusakan {item} sepanjang penghuni tinggal",
        "Jumlah kejadian {item} penyewa ini bertambah tidak",
        "Cek informasi kamar serta penghuni terkait {item}",
        "Kamar apa yang paling sering ada perbaikan {item}",
        "Nilai perhatian tenant mana yang terkait {item}",
        "Perlihatkan profil penghuni dan rekam perawatan {item}",
        "Keadaan fasilitas {item} menurut catatan terakhir bagaimana",
        "Cari tahu kamar penyewa dengan insiden {item}",
        "Siapa tenant aktif yang punya rekaman {item}",
        "Buka detail ruang hunian dan catatan masalah {item}",
        "Tolong daftar kamar dan penghuni yang punya riwayat {item}",
    ],
    "schedules": [
        "Agenda mendatang {item} jatuh pada tanggal apa",
        "Jam dan tanggal rencana aktivitas {item} kapan",
        "Jadwal bulanan {item} paling dekat hari apa",
        "Ingatkan saya daftar pengingat {item} yang terbit",
        "Apakah kegiatan {item} direncanakan minggu ini",
        "Buka notifikasi untuk agenda {item}",
        "Sebutkan tanggal servis berkala {item}",
        "Apa jadwal berikutnya untuk petugas menangani {item}",
        "Tenggat kegiatan {item} di kalender itu kapan",
        "Cek rencana berulang {item} pekan depan",
        "Pengingat {item} yang belum saya baca ada apa saja",
        "Kapan rutinitas {item} akan muncul lagi",
        "Tolong tampilkan waktu jatuh tempo rencana {item}",
        "Rencana kegiatan {item} hari esok apa",
        "Saya mencari agenda perawatan {item} mendatang",
        "Hari apa pelaksanaan rutin {item} selanjutnya",
        "Daftar notifikasi kegiatan {item} hari ini dong",
        "Tanggal agenda {item} pekan ini perlu saya lihat",
        "Urutkan kegiatan terjadwal {item} menurut tenggat",
        "Ada rencana {item} yang harus dikerjakan hari ini",
    ],
    "finances": [
        "Penerimaan kas dari {item} sudah tercatat berapa rupiah",
        "Biaya transaksi {item} total nominalnya berapa",
        "Tolong jumlahkan uang keluar terkait {item}",
        "Rincian pengeluaran {item} per kategori dong",
        "Berapa total sewa belum dibayar untuk {item}",
        "Siapa yang menunggak pembayaran terkait {item}",
        "Sajikan laporan kas masuk dan keluar untuk {item}",
        "Ada selisih pemasukan pengeluaran pada {item}",
        "Harga biaya tercatat untuk pekerjaan {item} berapa",
        "Pembayaran sewa {item} terlambat berapa hari",
        "Cek bukti penerimaan pembayaran {item}",
        "Uang yang telah dibayar untuk {item} berapa",
        "Saya perlu nominal tagihan belum lunas {item}",
        "Total biaya perbaikan {item} dibanding bulan lalu bagaimana",
        "Ada transaksi draft belum dibayar untuk {item}",
        "Hitung kas bersih pemasukan dikurangi biaya {item}",
        "Berapa besar pengeluaran pemeliharaan {item}",
        "Rangkum pembayaran lunas untuk {item}",
        "Nilai uang sewa dan pelunasan {item} berapa",
        "Sebutkan biaya paling besar terkait {item}",
    ],
    "guidance": [
        "Panduan aplikasi menjelaskan {item} seperti apa",
        "Tutorial penggunaan fitur {item} ada bagaimana",
        "Apa kebijakan umum kos mengenai {item}",
        "Jelaskan pengertian istilah {item} dalam aplikasi",
        "Petunjuk cara memasukkan data {item} apa",
        "Bagaimana prosedur aman merawat {item}",
        "Ajarkan langkah demi langkah untuk fitur {item}",
        "Apa arti kategori dan status {item}",
        "Saya ingin belajar cara kerja menu {item}",
        "Bacakan panduan operasional terkait {item}",
        "Cara memakai aplikasi saat mencatat {item} itu apa",
        "Definisi {item} menurut panduan apa",
        "Bagaimana aturan pencatatan {item} yang benar",
        "SOP penanganan {item} mohon dijelaskan",
        "Apa tata cara mengelola {item}",
        "Panduan mengisi data {item} dengan benar dong",
        "Penjelasan fungsi fitur {item} boleh",
        "Langkah pengecekan aman untuk {item} bagaimana",
        "Apa perbedaan konsep {item} dalam buku bantuan",
        "Ajari penggunaan menu untuk memasukkan {item}",
    ],
    "out-of-scope": [
        "Tuliskan pantun cinta bertema {item}",
        "Rekomendasi drama Korea yang cocok untuk {item}",
        "Bagaimana cuaca di kutub dan {item}",
        "Ajar saya matematika integral terkait {item}",
        "Buat cerita horor dengan tokoh {item}",
        "Saya mau ramalan tarot mengenai {item}",
        "Siapa pemain bola terbaik yang suka {item}",
        "Tolong ciptakan lagu dangdut tentang {item}",
        "Cari destinasi wisata luar negeri bertema {item}",
        "Apa resep nasi goreng dengan nama {item}",
        "Bantu saya membuat game fantasi tentang {item}",
        "Jelaskan astronomi dan planet bernama {item}",
        "Kasih tips make up untuk pesta {item}",
        "Aku mau belajar gitar dengan lagu {item}",
        "Tulis novel detektif tentang {item}",
        "Sebutkan karakter kartun yang memiliki {item}",
        "Prediksi kurs dolar untuk {item}",
        "Berikan tebakan nomor lotre bertema {item}",
        "Buat caption romantis untuk {item}",
        "Apa arti mimpi bertemu {item}",
    ],
}
for label, values in EXTRA_TEMPLATES.items():
    TEMPLATES[label].extend(values)
ITEMS = ITEMS[:5]


def dataset():
    rows = []
    for label in LABELS:
        order = list(range(40))
        random.Random(29942 + LABELS.index(label)).shuffle(order)
        for position, index in enumerate(order):
            split = (
                "train" if position < 28 else "validation" if position < 34 else "test"
            )
            for item_index, item in enumerate(ITEMS):
                text = TEMPLATES[label][index].format(item=item)
                if item_index % 4 == 0:
                    for word, short in [
                        ("Berapa", "Brp"),
                        ("kamar", "kmr"),
                        ("jadwal", "jdwl"),
                        ("Saya", "Gue"),
                        ("Tolong", "Tlg"),
                    ]:
                        text = text.replace(word, short)
                rows.append(
                    {
                        "text": text,
                        "intent": label,
                        "split": split,
                        "group": f"{label}-template-{index}",
                    }
                )
    path = ROOT / "intent-dataset.jsonl"
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))
    return rows


def scores(model, rows):
    truth = np.array([row["intent"] for row in rows])
    probabilities = model.predict_proba([row["text"] for row in rows])
    order = np.argsort(probabilities, axis=1)
    index = np.arange(len(rows))
    confidence = probabilities[index, order[:, -1]]
    margin = confidence - probabilities[index, order[:, -2]]
    return truth, model.classes_[order[:, -1]], confidence, margin


def route(prediction, confidence, margin, cutoff, minimum_margin):
    return np.where(
        (confidence >= cutoff) & (margin >= minimum_margin), prediction, "uncertain"
    )


def thresholds(model, grouped, natural):
    grouped_truth, *grouped_scores = scores(model, grouped)
    natural_truth, *natural_scores = scores(model, natural)
    choices = []
    for cutoff, margin in itertools.product(
        (value / 100 for value in range(30, 81, 5)),
        (value / 100 for value in range(0, 31, 5)),
    ):
        grouped_route = route(*grouped_scores, cutoff, margin)
        natural_route = route(*natural_scores, cutoff, margin)
        if np.any((grouped_route != "uncertain") & (grouped_route != grouped_truth)):
            continue
        if np.any((natural_route != "uncertain") & (natural_route != natural_truth)):
            continue
        grouped_correct = int((grouped_route == grouped_truth).sum())
        if grouped_correct < MIN_GROUPED_VALIDATION_ACCEPTED:
            continue
        correct = natural_route == natural_truth
        priority = min(
            int((correct & (natural_truth == label)).sum())
            for label in ("rooms", "guidance")
        )
        choices.append(
            (priority, int(correct.sum()), grouped_correct, -cutoff, -margin)
        )
    if not choices:
        raise ValueError("No threshold pair preserves safe validation coverage")
    _, _, _, cutoff, margin = max(choices)
    return -cutoff, -margin


def routing_report(model, rows, cutoff, margin):
    truth, *row_scores = scores(model, rows)
    routed = route(*row_scores, cutoff, margin)
    correct = routed == truth
    calls_workflow = np.isin(routed, ["rooms", "schedules", "finances", "guidance"])
    return {
        "total": len(rows),
        "wrongTool": int((~correct & calls_workflow).sum()),
        "perClass": {
            label: {
                "total": int((truth == label).sum()),
                "correct": int((correct & (truth == label)).sum()),
                "wrongTool": int((~correct & calls_workflow & (truth == label)).sum()),
            }
            for label in sorted(set(truth))
        },
    }


def report(model, rows, cutoff, margin):
    truth = [r["intent"] for r in rows]
    probabilities = model.predict_proba([r["text"] for r in rows])
    predicted = model.classes_[probabilities.argmax(axis=1)]
    ordered = np.sort(probabilities, axis=1)
    accepted = (ordered[:, -1] >= cutoff) & (ordered[:, -1] - ordered[:, -2] >= margin)
    return {
        "macroF1": f1_score(
            truth, predicted, labels=LABELS, average="macro", zero_division=0
        ),
        "confusionMatrix": confusion_matrix(truth, predicted, labels=LABELS).tolist(),
        "perClass": classification_report(
            truth, predicted, labels=LABELS, output_dict=True, zero_division=0
        ),
        "acceptedCoverage": float(accepted.mean()),
        "acceptedAccuracy": float(
            (predicted[accepted] == np.array(truth)[accepted]).mean()
        )
        if accepted.any()
        else None,
        "errors": [
            {"question": r["text"], "expected": r["intent"], "actual": str(p)}
            for r, p in zip(rows, predicted)
            if r["intent"] != p
        ][:25],
    }


def read_rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def train():
    rows = dataset()
    splits = {
        name: [row for row in rows if row["split"] == name]
        for name in ["train", "validation", "test"]
    }
    groups = {name: {row["group"] for row in values} for name, values in splits.items()}
    if any(groups[a] & groups[b] for a, b in itertools.combinations(groups, 2)):
        raise ValueError("Paraphrase group crosses splits")
    natural_path = ROOT / "intent-natural.jsonl"
    natural_rows = read_rows(natural_path)
    natural_train = [row for row in natural_rows if row["split"] == "train"]
    natural_validation = [row for row in natural_rows if row["split"] == "validation"]
    train_rows = splits["train"] + natural_train
    features = FeatureUnion(
        [
            ("word", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
            (
                "char",
                TfidfVectorizer(
                    analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True
                ),
            ),
        ]
    )
    model = Pipeline(
        [
            ("features", features),
            (
                "classifier",
                LogisticRegression(
                    C=4, class_weight="balanced", max_iter=1000, random_state=29941
                ),
            ),
        ]
    )
    model.fit(
        [row["text"] for row in train_rows],
        [row["intent"] for row in train_rows],
        classifier__sample_weight=[1] * len(splits["train"]) + [3] * len(natural_train),
    )
    cutoff, margin = thresholds(model, splits["validation"], natural_validation)
    dataset_bytes = (ROOT / "intent-dataset.jsonl").read_bytes()
    natural_bytes = natural_path.read_bytes()
    digest = hashlib.sha256(dataset_bytes + natural_bytes).hexdigest()
    artifact = {
        "model": model,
        "modelVersion": "intent-v4-" + digest[:12],
        "confidenceThreshold": cutoff,
        "marginThreshold": margin,
        "labels": LABELS,
        "sklearnVersion": sklearn.__version__,
    }
    fresh_path = ROOT / "evaluations/intent-fresh-v4.jsonl"
    fresh = [
        {"text": row["text"], "intent": row["expected"]}
        for row in read_rows(fresh_path)
    ]
    if {row["text"].lower() for row in fresh} & {
        row["text"].lower() for row in rows + natural_rows
    }:
        raise ValueError("Fresh evaluation question occurs in the development dataset")
    result = {
        "synthetic": True,
        "modelVersion": artifact["modelVersion"],
        "datasetSha256": hashlib.sha256(dataset_bytes).hexdigest(),
        "naturalDatasetSha256": hashlib.sha256(natural_bytes).hexdigest(),
        "freshEvaluationSha256": hashlib.sha256(fresh_path.read_bytes()).hexdigest(),
        "counts": {
            name: dict(Counter(row["intent"] for row in values))
            for name, values in splits.items()
        },
        "naturalCounts": {
            "train": dict(Counter(row["intent"] for row in natural_train)),
            "validation": dict(Counter(row["intent"] for row in natural_validation)),
        },
        "labels": LABELS,
        "selected": "word-char-c4-natural",
        "confidenceThreshold": cutoff,
        "marginThreshold": margin,
        "validation": routing_report(model, natural_validation, cutoff, margin),
        "test": report(model, splits["test"], cutoff, margin),
        "fresh": routing_report(model, fresh, cutoff, margin),
        "limits": "The grouped and natural questions are synthetic. Grouped object substitutions are correlated. These results do not establish real-user accuracy.",
    }
    target = ROOT / "artifacts/intent-classifier.joblib"
    joblib.dump(artifact, target)
    (ROOT / "artifacts/intent-classifier.sha256").write_text(
        hashlib.sha256(target.read_bytes()).hexdigest() + "\n"
    )
    (ROOT / "intent-evaluation.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    train()
