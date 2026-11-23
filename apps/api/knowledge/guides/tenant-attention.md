# Memahami perhatian tenant

## Arti nilai dan sumber data

A berarti perhatian rutin. B berarti perlu diperiksa segera. C berarti diperiksa
lebih dahulu. Nilai menyatakan prioritas pemeriksaan dari beban kegiatan dan
pembayaran yang terkait tenant. Nilai tidak menyatakan watak atau membuktikan
bahwa tenant menyebabkan kerusakan. Model bersifat eksperimental, dilatih dengan
contoh sintetis, dan dapat menempatkan lonjakan perbaikan terlalu rendah. Periksa
fakta sumber sebelum mengambil keputusan.

Data mencakup perbaikan insidental selesai, pengeluaran perbaikan yang sudah
dibayar, pembersihan tambahan, dan ketepatan pembayaran sewa. Pembersihan rutin
dan servis terencana bukan masukan yang menaikkan perhatian. Satu perbaikan mahal
tidak otomatis membuat nilai C. Keluhan terbuka tetap dilihat melalui pekerjaan
terbuka, terpisah dari pola kejadian yang sudah selesai.

## Cakupan riwayat dan perpindahan kamar

Aplikasi menentukan awal riwayat dari tanggal jatuh tempo, penyelesaian, atau
pembayaran paling awal pada aktivitas yang terkait tenant dan kamar. Jendela
penilaian memakai paling lama dua belas bulan kalender. Penilaian memerlukan
rentang riwayat minimal sembilan puluh hari dan tiga tagihan sewa yang sudah
jatuh tempo. Hasil memakai aktivitas yang tercatat. Jika data belum cukup,
aplikasi menampilkan Not enough data. Tanggal di masa depan tidak dihitung
sebagai kejadian yang sudah terjadi.

Nilai mengikuti tenant di beberapa kamar. Pindah kamar tidak menghapus riwayat.
Aktivitas tetap memiliki kamar sumber dan hubungan historis dengan tenant.
Kegiatan tersebut muncul dalam riwayat kamar dan tenant tanpa menjadi dua
transaksi. Tenant sebelumnya tetap dapat ditinjau setelah pindah atau tidak
aktif. Koreksi hubungan tenant memerlukan alasan dan dicatat dalam audit.
Nilai tersimpan menampilkan tanggal dan jendela penilaiannya. Hasil lama tetap
tersedia saat layanan model gagal atau pembaruan sedang menunggu.
