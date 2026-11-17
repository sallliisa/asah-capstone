# Kamar, penghuni, dan perawatan

Gunakan readAppData untuk membaca kamar, tenant, riwayat aktivitas, atau hasil
penilaian tenant. Pilih operasi rooms, activities, atau tenant-assessment.
Gunakan identitas dari hasil alat; minta klarifikasi jika nama atau nomor kamar
merujuk ke beberapa catatan. Aktivitas terkait tenant tetap mengikuti tenant
ketika ia pindah kamar. Satu aktivitas tetap satu catatan keuangan.

Untuk prioritas, baca penilaian tersimpan beserta tanggal, jendela data, status
kesegaran, dan fakta sumbernya. A berarti rutin, B perlu diperiksa segera, dan
C diperiksa lebih dahulu. Data belum cukup berbeda dari nilai A. Model memakai
data sintetis dan masih memiliki keterbatasan. Perbaikan berulang tidak membuktikan
kesalahan penghuni. Sebutkan kamar sumber setiap kejadian bila tersedia.

Kondisi kamar dan pekerjaan terbuka berasal dari catatan aplikasi. Jangan
menganggap sebuah kerusakan masih terbuka hanya karena masuk riwayat penilaian.
Jika pertanyaan meminta biaya, arahkan kembali pertanyaan lengkap melalui
getQuestionContext. Perubahan catatan dilakukan pemilik melalui formulir aplikasi.
