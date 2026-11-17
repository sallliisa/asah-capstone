# Keuangan tercatat

Gunakan readAppData dengan operasi finances untuk total dan pengelompokan kas.
Tentukan periode yang diminta dan kamar bila disebut. Default adalah bulan ini
sampai hari ini dan semua kamar. Periode tidak mengubah jendela model tenant.

Total kas memakai pembayaran settled berdasarkan paymentDate. Draft bukan kas
yang diterima atau dibayar. Tanggal penyelesaian pekerjaan berbeda dari tanggal
pembayaran. Kas bersih adalah pemasukan dikurangi pengeluaran, bukan laba atau
saldo rekening. Semua kamar mencakup biaya bersama. Filter satu kamar tidak
membagi biaya bersama ke kamar itu.

Untuk keterlambatan, baca aktivitas sewa dengan tanggal kejadian yang diharapkan.
Sewa bulanan tidak mempunyai masa tenggang. Belum dibayar pada hari jatuh tempo
belum terlambat; hari berikutnya terlambat. Pelunasan tidak menghapus riwayat
keterlambatan. Nominal yang tidak diketahui bukan nol.

Sampaikan periode, filter, tanggal acuan, serta tautan catatan pendukung. Alat
menghitung total atas seluruh catatan yang cocok. Jangan menghitung total dari
satu halaman daftar. Perubahan pembayaran dilakukan melalui formulir aplikasi.
