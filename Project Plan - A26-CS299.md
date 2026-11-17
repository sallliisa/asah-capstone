# 

# 

# Asah 2026 

# *Capstone Project*

# *Project Plan*

 

# 

**Dokumen Project Plan**  
**Asah 2026 led by Dicoding supported by GoTo**

ID Tim Capstone Project: A26-CS299

Nama UMKM: Kos De Mansion

Bidang UMKM: Jasa penyewaan kamar kos (hunian)

Judul Use Case: Asisten Pengelolaan Kos Mobile: Pengingat Otomatis dan Pencatatan Keuangan Bulanan untuk Pemilik Kos

Tautan Dokumen Use Case: [Interview dan Use Case UMKM — Kos De Mansion](https://docs.google.com/document/d/1YooMDUd84DspDj8oIiXqfMR_xZMBtTk_NikXFy48NlI/edit) https\://docs.google.com/document/d/1YooMDUd84DspDj8oIiXqfMR\_xZMBtTk\_NikXFy48NlI/edit

Daftar Anggota:

1. FS200B6Y0619 – Filbert Restu Yudha Firmansyah – Full-Stack – Aktif

2. FS005B6Y0847 – Josep Natanael Pasaribu – Full-Stack – Aktif

3. DS200B6X0278 – Athaya Kyla Aimee – Data Science – Aktif

4. DS200B6X0962 – Marcelia Devi Sumita Br Tarigan S – Data Science – Aktif

5. AE200B6Y0940 – M. Ghani Aryasuta – Next-Gen AI Engineer – Aktif

6. AE322B6Y0694 – Hafidh Alfarisi – Next-Gen AI Engineer – Aktif

1. # **Ringkasan Eksekutif**

Pemilik Kos De Mansion mencatat keuangan di buku dan mengatur sendiri jadwal sewa, servis AC, serta pembayaran pajak. Tanpa pengingat otomatis, pemilik masih mengandalkan ingatan untuk memantau kegiatan yang harus dilakukan, sementara status pembayaran harus diperiksa dari catatan manual.

Tim akan membuat aplikasi web yang dapat diakses lewat HP untuk mengelola data kamar, tipe kamar, dan penghuni. Pemilik dapat mencatat aktivitas satu kali atau membuat jadwal untuk kegiatan yang berulang, lalu memperbarui status pekerjaan dan pembayaran secara terpisah. Bukti pembayaran dapat dilampirkan pada aktivitas yang bersangkutan. Dashboard akan menampilkan status kamar, kegiatan yang belum selesai, jadwal berikutnya, serta grafik dan rekap keuangan.

Riwayat perbaikan insidental, pembersihan tambahan, dan pembayaran sewa yang terkait tenant akan digunakan untuk melatih Isolation Forest. Hasilnya berupa A · Rutin, B · Periksa segera, atau C · Periksa lebih dahulu sebagai prioritas peninjauan tenant. Nilai mengikuti tenant saat berpindah kamar dan tidak membuktikan bahwa tenant menyebabkan kerusakan. Data belum cukup ditampilkan terpisah dari A.

Pemilik juga dapat bertanya tentang data kos melalui chatbot Pi yang terhubung ke layanan AI generatif. Pi dapat menggunakan seluruh data aplikasi yang boleh diakses pemilik untuk menjawab pertanyaan.

2. # **Cakupan Proyek dan Hasil Kerja**

Setelah login, pemilik mengisi data kamar dan penghuninya, kemudian membuat aktivitas satu kali atau jadwal berulang. Aplikasi akan menampilkan pengingat sesuai jadwal agar pemilik dapat membuka aktivitas yang perlu ditindaklanjuti dan memperbarui status pekerjaannya. Untuk aktivitas yang melibatkan transaksi, pemilik juga mencatat nominal dan status pembayaran serta menambahkan file pendukung jika ada. Catatan aktivitas dan transaksi dapat dipantau melalui dashboard atau ditanyakan kepada Pi.

MVP akan mencakup fitur utama aplikasi, analisis data, model anomali, dan chatbot Pi untuk memenuhi Main Quest. Setelah MVP, tim akan mengerjakan intent classifier dan RAG sebagai pekerjaan tambahan. Laporan masalah dari penghuni dan pengingat WhatsApp khusus pemilik tetap direncanakan sebagai fitur opsional.

Tim DS akan menganalisis data untuk menjawab tiga pertanyaan bisnis: aktivitas apa yang tertunda, bagaimana pemasukan dan pengeluaran berubah, dan kamar mana yang perlu dicek lebih dulu. Pekerjaan ini dimulai dengan mengumpulkan data, memeriksa kualitasnya, dan membersihkan data yang bermasalah. Setelah hasil perhitungannya diperiksa, temuan dan saran bagi pemilik akan ditampilkan di dashboard aplikasi yang sekaligus menjadi dashboard DS.

DS dan AE akan menyiapkan data untuk model anomali dan intent classifier, melakukan preprocessing serta feature engineering, lalu melatih dan mengevaluasi kedua model.

| Fitur / hasil kerja | Wajib / tambahan | Indikator keberhasilan | Penanggung jawab |
| ----- | ----- | ----- | ----- |
| **Data kamar dan penghuni** Pemilik mengelola data kamar, tipe kamar, tarif sewa, dan penghuni yang menempatinya. Pada denah, pemilik dapat melihat kamar yang terisi atau kosong, lalu memilih kamar untuk membuka detailnya. | Wajib (MVP) | Kode kamar tidak boleh sama. Data penghuni dan status kamar pada denah harus mengikuti perubahan yang disimpan. | Filbert (FS) |
| **Aktivitas, jadwal, dan keuangan** Pemilik dapat membuat aktivitas berdasarkan kategori, menentukan jadwal pengulangan, dan menerima notifikasi melalui kotak masuk dan percobaan Web Push pada PWA iPhone setiap kali notifikasi baru tersimpan. Untuk aktivitas yang melibatkan transaksi, pemilik dapat mencatat nominal, memperbarui status pembayaran secara terpisah dari status pekerjaan, dan melampirkan file pendukung. | Wajib (MVP) | Jadwal sewa bulanan dan servis AC empat bulanan menghasilkan tepat satu aktivitas setiap kali jatuh tempo. Status, nominal, tanggal pembayaran, dan bukti pembayaran diperiksa sebelum data disimpan. | Josep (FS) |
| **Dashboard dan analisis data** Melalui dashboard, pemilik dapat melihat denah kamar, aktivitas yang tertunda, jadwal mendatang, dan ringkasan kas. Grafik menampilkan arus kas harian serta pengeluaran per kategori, dengan filter periode dan kamar. | Wajib (MVP) | Rekap hanya menghitung pembayaran yang selesai berdasarkan tanggal pembayaran. Grafik, filter, dan denah harus sesuai dengan data di database. | Athaya (DS) |
| **Model perhatian tenant dan grade A–C** Isolation Forest akan mencari pola kegiatan dan pembayaran yang terkait tenant di beberapa kamar. Tim membandingkan tiga konfigurasi untuk melihat pengaruh feature engineering dan hyperparameter tuning. | Wajib (MVP) | Hasil perbandingan mencantumkan metrik yang sama untuk ketiga konfigurasi dengan pembagian data yang sama. Aplikasi menampilkan grade A–C dari hasil model. | Ghani (AE) |
| **Chatbot Pi dan riwayat chat** Pi menggunakan API model generatif (contoh dari layanan seperti Gemini), dengan prompt terstruktur untuk menjawab pertanyaan tentang seluruh data aplikasi yang boleh diakses pemilik. Pemilik dapat membuka kembali riwayat chat dan hasil prediksi yang disimpan. | Wajib (MVP) | Jawaban sesuai dengan data yang diakses, dan sedikitnya 10 pertanyaan uji di luar konteks usaha ditolak. Jika layanan gagal, Pi menampilkan pesan yang menjelaskan masalahnya. | Hafidh (AE) |
| **Intent classifier untuk Pi** Intent classifier akan dilatih untuk mengenali sedikitnya empat jenis pertanyaan, yaitu perawatan kamar, jadwal kegiatan, rekap keuangan, dan panduan pengelolaan kos. Berdasarkan hasil klasifikasi, Pi dapat memilih tool atau sumber informasi yang sesuai. | Tambahan | Hasil evaluasi dan contoh salah klasifikasi tercantum di README, bersama penjelasan perbaikan model dan cara Pi menggunakan hasil klasifikasi. README juga memuat pemeriksaan jumlah data tiap intent dan penanganannya jika ditemukan class imbalance. | Marcelia (DS) |
| **RAG untuk FAQ dan panduan** RAG akan mencari informasi dalam FAQ dan panduan berdasarkan pertanyaan pemilik. Pencarian memakai model embedding untuk mencocokkan makna teks dan vector database untuk menyimpan hasil pemrosesan dokumen. Pi menggunakan informasi yang ditemukan sebagai dasar jawaban. | Tambahan | Jawaban menyebut sumber yang mendukungnya. Jika dokumen tidak memuat informasi yang diminta, Pi menyampaikan bahwa informasi tersebut belum tersedia. | Hafidh (AE) |
| **Data, integrasi, dan dokumentasi** Tim akan menyiapkan rancangan tampilan aplikasi (mockup) dan API contract sebagai acuan pengembangan. Setiap modul akan dihubungkan dengan layanan model dan hasil analisis DS. Pekerjaan ini juga mencakup pengujian alur aplikasi, deployment, dan dokumentasi. | Wajib | Aplikasi dapat diakses online dan seluruh alur utama dapat dijalankan dari awal sampai akhir. Hasil pengujian dan seluruh dokumen pada daftar hasil akhir siap dikumpulkan. | Filbert (FS) |
| **Laporan masalah dari penghuni** Penghuni dapat melaporkan masalah fasilitas kamar, lalu pemilik membaca laporan dan memperbarui statusnya. Laporan tersebut dapat dihubungkan dengan aktivitas perawatan yang dibuat oleh pemilik. | Tambahan | Laporan mencatat pengirim dan kamar yang sesuai. Penghuni hanya dapat membuka laporan yang boleh diaksesnya dan tidak mendapat akses ke pengelolaan keuangan. | Filbert (FS) |
| **WhatsApp khusus pemilik** Pengingat akan dikirim ke nomor WhatsApp pemilik dengan link ke aktivitas terkait di aplikasi. | Tambahan | Penerima dan waktu pengiriman sesuai pengaturan, dengan penanganan untuk pesan yang gagal dikirim. | Josep (FS) |

Yang tidak dikerjakan: pemasaran, pencarian penghuni, penentuan harga sewa, integrasi bank, payment gateway, sistem perpajakan resmi, penggajian pegawai, pengelolaan kebun, dan aplikasi native.

Demo dan uji coba akan memakai data contoh. Penggunaan untuk operasional kos akan dibahas dalam kesepakatan terpisah dengan pemilik.

Hasil akhir yang dikumpulkan:

* Aplikasi web online, source code di GitHub, dan skema database.  
* Dataset contoh serta notebook untuk pengolahan dan analisis data. Penjelasan isi dataset dan pembagian data training, validation, dan test dicantumkan di notebook.  
* Model anomali dan intent classifier beserta API online untuk menjalankannya. README memuat konfigurasi yang dibandingkan, hasil evaluasi, dan aturan penentuan grade.  
* Chatbot Pi, prompt, dokumen RAG, serta riwayat chat dan hasil prediksi.  
* Project Brief, README, dokumentasi API yang dapat dicoba langsung, catatan pengujian, panduan penggunaan (PDF), slide presentasi, dan video presentasi.

Perubahan dari use case: model perhatian tenant akan ditambahkan untuk membantu pemilik memilih tenant yang perlu ditinjau lebih dahulu berdasarkan kegiatan dan pembayaran terkait, sedangkan Pi memungkinkan pemilik bertanya tentang data kos. Pi akan dilengkapi intent classifier untuk mengenali pertanyaan dan RAG untuk mengambil informasi dari FAQ serta panduan.

Pengingat WhatsApp khusus pemilik dan laporan penghuni tetap opsional agar waktu pengerjaan cukup untuk MVP, intent classifier, dan RAG. Side Quest integrasi aplikasi pesan akan terpenuhi jika WhatsApp dikerjakan. Perubahan scope ini akan dibahas bersama pemilik sebelum pengerjaan.

3. # **Jadwal Pengerjaan**

Tim akan mengerjakan proyek pada 20 November–20 Desember 2026, dengan target MVP bisa digunakan pada akhir minggu kedua. Intent classifier dan RAG akan dihubungkan pada minggu ketiga agar minggu keempat dapat digunakan untuk pengujian, perbaikan, dan dokumentasi.

| Waktu | Pekerjaan | Hasil yang ditargetkan | Penanggung jawab |
| ----- | ----- | ----- | ----- |
| **Minggu 1** 20–26 Nov | Tim akan menyusun alur penggunaan dan mockup, lalu merancang database dan menyepakati API contract. Dataset akan dilengkapi data dictionary dan pembagian train/validation/test, sementara dokumen RAG disiapkan untuk Pi. Frontend dan backend akan disiapkan beserta file storage, hosting, dan akses API generatif agar koneksi layanan bisa diuji. | Mockup, struktur data, dan API contract siap dipakai. Koneksi frontend, backend, database, serta layanan AI bisa diuji. | Filbert (FS) |
| **Minggu 2** 27 Nov–3 Des | Tim akan membuat modul kamar, aktivitas, pengingat, keuangan, dan dashboard. Model Isolation Forest akan dihubungkan ke aplikasi setelah tiga konfigurasinya dilatih dan dibandingkan, sedangkan Pi akan disiapkan untuk menjawab pertanyaan menggunakan data aplikasi. | MVP, termasuk model anomali dan Pi, ditargetkan bisa digunakan pada 3 Desember. Dokumentasi akan memuat hasil analisis data dan perbandingan konfigurasi model. | Josep (FS) |
| **Minggu 3** 4–10 Des | Intent classifier akan dilatih dan dievaluasi sebelum dihubungkan ke Pi bersama RAG. Pengujian integrasi akan mencakup riwayat chat dan prediksi, error handling, serta tampilan di HP, tablet, dan desktop. Dokumentasi API interaktif juga akan dilengkapi. | Pada 10 Desember, MVP, intent classifier, dan RAG bisa digunakan bersama di aplikasi. Bug dari pengujian masuk dalam daftar perbaikan. | Hafidh (AE) |
| **Minggu 4** 11–17 Des | Tim akan menguji alur aplikasi dari awal sampai akhir, memeriksa ketepatan jadwal dan perhitungan, serta mengadakan uji coba bersama pemilik. Tim juga akan memperbaiki bug dari pengujian tersebut dan menyelesaikan dokumen serta bahan presentasi yang tercantum pada daftar hasil akhir. | Target 17 Desember: alur utama lolos pengujian, dan dokumen dan video presentasi dibuat. | Filbert (FS) |

Tanggal 18–20 Desember disediakan sebagai waktu cadangan untuk perbaikan dan pengujian ulang. Batas pengumpulan final deliverables adalah 20 Desember 2026 pukul 23.59 WIB.

4. # **Sumber Daya Proyek**

| Sumber daya / fungsi | Ketersediaan / izin | Batas pemakaian | Pilihan pengganti |
| ----- | ----- | ----- | ----- |
| **Frontend** Vue/Vite, Tailwind CSS, Reka UI, dan Chart.js. FS menyiapkan tampilan aplikasi, sedangkan DS menentukan angka dan grafik dashboard. | Tim akan memeriksa lisensi library serta aset yang digunakan. | Tampilan harus dapat digunakan pada HP, tablet, dan desktop. API key disimpan di server. | Ganti komponen UI atau library grafik jika integrasinya bermasalah. |
| **API aplikasi** Hono untuk autentikasi dan REST API, serta Zod untuk schema validation. | FS, DS, dan AE akan menyepakati API contract yang mencakup endpoint, format request/response, serta kode error. | Permintaan dari frontend ke model dan API generatif harus melalui backend yang memeriksa hak akses pengguna. | Jika hosting perlu diganti, pertahankan API contract yang digunakan frontend. |
| **Data dan aset** PostgreSQL dan object storage yang kompatibel dengan S3 | FS menyiapkan skema dan migration database, file storage, serta penyimpanan aktivitas, transaksi, chat, dan hasil prediksi. | Data hanya dapat diakses pengguna yang berhak. Penggunaan data pribadi atau keuangan asli memerlukan izin. | Gunakan PostgreSQL lokal selama pengembangan, lalu layanan online saat integrasi. |
| **Hosting** Vercel, Neon, layanan Cloudflare, dan VPS | Vercel digunakan untuk aplikasi dan API utama, Neon untuk PostgreSQL, serta Workers AI dan Vectorize untuk embedding dan vector database. Layanan model Python dan job terjadwal ditempatkan pada VPS 2 vCPU dan RAM 8 GB. | Paket gratis atau free tier akan dipilih dengan mempertimbangkan kuota, batas durasi proses, kapasitas storage, dan waktu respons layanan. | Pindahkan komponen yang bermasalah ke hosting lain yang sesuai kebutuhan dan anggaran. |
| **Dataset dan dokumen RAG** Wawancara, data sintetis, panduan | DS menyiapkan dataset dan data dictionary berdasarkan informasi usaha yang diizinkan. AE menyusun FAQ dan panduan untuk RAG. | Data sintetis harus diberi label dan disertai sumber atau cara pembuatannya. Data training, validation, dan test dipisahkan untuk mencegah data leakage. | Tambahkan variasi kasus pada data sintetis dan lengkapi panduan berdasarkan use case. |
| **Model dan API** Python, scikit-learn, FastAPI | DS dan AE mengembangkan Isolation Forest serta intent classifier. AE dan FS menyiapkan model serving lewat API online. | Konfigurasi dipilih berdasarkan validation set sebelum dievaluasi pada test set terpisah. Hasil pengujian dengan data sintetis akan dilaporkan sebagai hasil simulasi. | Flask dapat menggantikan FastAPI dengan API contract yang sama. |
| **Chatbot dan RAG** Pi melalui CloudflareOS dan Wisp, API model generatif, Workers AI BGE-M3 sebagai kandidat embedding, dan Vectorize. | AE menghubungkan model generation yang dipilih melalui Wisp dengan pipeline retrieval yang dikelola aplikasi. Akses, lisensi, serta kuota diperiksa pada minggu pertama. | Gunakan data dan dokumen yang diizinkan. Simpan API key di server dan tetapkan batas biaya serta timeout. | Gunakan penyedia API atau model pendukung lain yang sesuai kebutuhan dan anggaran. |
| **Kolaborasi dan pengujian** Git/GitHub serta HP, tablet, dan desktop untuk menguji aplikasi. | Tim menyiapkan repository, catatan kerja, dokumentasi API interaktif, hasil pengujian, dan panduan pemilik. | Repository dan bahan demo tidak boleh memuat data sensitif atau credential. Pengujian mencakup HP, tablet, dan desktop. | Gunakan dokumen bersama dan simulasi ukuran layar untuk melengkapi pengujian perangkat fisik. |

Frontend Vue akan mengirim permintaan melalui Fetch/RPC ke backend Hono untuk mengambil atau menyimpan data. Hono memeriksa login dan input serta menjalankan jadwal aktivitas. Data aplikasi disimpan di PostgreSQL dan digunakan oleh dashboard, sedangkan file pendukung disimpan di object storage yang kompatibel dengan S3 dan dihubungkan dengan aktivitas yang sesuai.

Untuk menjalankan model, backend akan mengirim request ke layanan FastAPI dan menerima hasil dari model anomali atau intent classifier. Hasil prediksi tersebut disimpan di database agar dapat dibuka kembali. Penilaian tenant memakai paling lama dua belas bulan kalender, minimal sembilan puluh hari pencatatan yang dikonfirmasi dan tiga kejadian sewa jatuh tempo. Sewa dibayar bulanan tanpa masa tenggang. Pembersihan rutin kira-kira dua kali sebulan dengan tanggal fleksibel; pembersihan di luar itu dicatat sebagai tambahan. Servis AC rutin setiap empat bulan dipisahkan dari perbaikan insidental. Hasil eksperimen, termasuk target yang belum tercapai, dilaporkan sebagai evaluasi sintetis.

Pi adalah CloudflareOS yang dihubungkan melalui Wisp dengan satu akun bersama milik aplikasi. Pi hanya membaca data yang diizinkan; perubahan aktivitas, pembayaran, penghuni, dan pengingat dilakukan pemilik melalui formulir aplikasi. Tool getQuestionContext mengirim pertanyaan berbahasa Indonesia ke intent classifier, lalu mengembalikan isi dokumen konteks privat yang dipilih model serta passages RAG yang relevan. Pi tidak mempunyai akses baca, pencarian, atau daftar langsung ke penyimpanan dokumen konteks tersebut. RAG memakai generation dari CloudflareOS, embedding Workers AI, dan vector database Vectorize. Riwayat chat memakai percakapan native CloudflareOS; hasil prediksi dan jejak routing disimpan untuk peninjauan.

5. # **Risiko dan Cara Mengatasinya**

| Kendala dan dampak | Cara menangani | Rencana cadangan | Penanggung jawab |
| ----- | ----- | ----- | ----- |
| **Data sintetis belum tentu mencerminkan kejadian di kos. Grade A–C juga bisa disalahartikan sebagai bukti kesalahan tenant.** | Tim akan mencatat cara penyusunan dataset dan memeriksa variasi kasusnya. Grade dijelaskan sebagai prioritas peninjauan catatan terkait tenant, bukan bukti penyebab atau kesalahan tenant. | Perbaiki dataset atau aturan grade menggunakan data training dan validation. Evaluasi akhir memakai test set yang tidak dipakai untuk training atau tuning. | Athaya (DS) |
| **Pi bisa lambat atau salah menjawab saat kuota habis, intent salah dikenali, atau dokumen RAG tidak relevan.** | Tim akan mencocokkan jawaban dengan data dan dokumen sumber serta memastikan Pi meminta penjelasan ketika pertanyaan pengguna belum jelas. Timeout dan pesan error akan diatur untuk menangani kegagalan layanan. | Ganti penyedia API jika diperlukan, atau perbaiki intent classifier dan pencarian dokumen. Selama AI bermasalah, pemilik tetap bisa memakai menu aktivitas dan keuangan. | Hafidh (AE) |
| **Jadwal terlewat atau aktivitas tercatat dua kali. Kesalahan status pembayaran juga bisa membuat rekap keuangan salah.** | Tim akan menguji penjadwalan saat pergantian bulan dan saat proses dijalankan lebih dari sekali untuk periode yang sama. Pengujian juga akan memeriksa status pekerjaan, status pembayaran, dan tanggal pembayaran. | Setelah memperbaiki bagian yang salah dan data uji yang terdampak, tim akan mengulang pengujian jadwal serta perhitungan rekap. | Josep (FS) |
| **Salah satu modul terlambat, sehingga integrasi dan pengujian ikut mundur.** | Tim akan menyepakati API contract sejak minggu pertama dan mengecek pengerjaan tiap modul secara berkala, termasuk pekerjaan yang dibutuhkan anggota lain. | Bagi ulang tugas dan gunakan waktu cadangan. WhatsApp dan laporan penghuni bisa ditunda agar tim menyelesaikan fitur utama, intent classifier, dan RAG. | Filbert (FS) |
| **Pemilik sulit meluangkan waktu untuk menjawab pertanyaan, mencoba aplikasi, atau mengikuti demo.** | Tim akan menghubungi pemilik lebih awal untuk menyepakati jadwal dan perangkat yang akan dipakai, lalu menyiapkan pertanyaan serta skenario uji sebelum pertemuan. | Gunakan pesan tertulis untuk klarifikasi dan panduan penggunaan yang disiapkan tim. Jadwal demo akan disepakati ulang bersama pemilik. | Filbert (FS) |
| **Data, file, riwayat chat, atau API key bisa diakses orang yang tidak berhak.** | Tim akan memeriksa hak akses di backend dan tools Pi serta menyimpan API key di server. Repo dan bahan demo juga akan diperiksa agar tidak memuat data pribadi atau credential. | Tutup akses yang bermasalah selama perbaikan. Ganti data yang belum mendapat izin dengan data contoh, lalu ulangi pengujian hak akses. | Josep (FS) |

6. # **Rencana Pengujian**

Tim akan mencatat pengujian dalam dokumen bersama yang ditautkan di README. Catatan berisi langkah, data uji, hasil yang diharapkan, hasil pengujian, status, penanggung jawab, dan bukti pendukung. Eksperimen model juga mencatat konfigurasi serta metriknya. Bug yang menghambat penggunaan fitur utama harus diperbaiki dan diuji ulang sebelum pengumpulan.

| Fitur yang diuji | Cara menguji | Hasil yang diharapkan | Penanggung jawab |
| ----- | ----- | ----- | ----- |
| **Login dan data kamar** | Coba login, tambah atau ubah kamar dan tipe kamar, lalu tentukan penghuninya. Coba memakai kode kamar yang sudah terdaftar, mengosongkan isian, dan mengakses data tanpa izin. | Data tersimpan pada kamar yang benar. Sistem menolak kode kamar yang sudah digunakan, input yang tidak valid, dan akses tanpa izin dengan pesan yang jelas. | Filbert (FS) |
| **Aktivitas, jadwal, dan file** | Uji jadwal sewa setiap bulan dan servis AC setiap empat bulan, termasuk saat pergantian bulan. Jalankan proses penjadwalan dua kali untuk memastikan aktivitas tidak tercatat dua kali, lalu uji perubahan status serta upload file yang valid dan tidak valid. | Setiap kali jadwal jatuh tempo, sistem membuat satu aktivitas dan pengingat sesuai waktunya. Status pekerjaan dan pembayaran tersimpan terpisah. File terhubung dengan aktivitas yang benar. | Josep (FS) |
| **Pencatatan dan rekap keuangan** | Catat pemasukan dan pengeluaran dengan pembayaran pada bulan berbeda, lalu cocokkan rekap dengan hitungan manual. Uji juga draft tanpa nominal, nominal tidak valid, dan tanggal pembayaran yang kosong. | Pembayaran hanya bisa ditandai selesai jika nominalnya positif dan tanggal pembayaran terisi. Rekap dan selisih pemasukan-pengeluaran sesuai dengan pembayaran yang selesai. | Marcelia (DS) |
| **Dashboard, filter, dan denah** | Ubah penghuni kamar, aktivitas, dan pembayaran. Pilih filter, lalu cocokkan angka, grafik, serta denah dengan data sumber. | Denah, jadwal, aktivitas tertunda, grafik, dan rekap mengikuti perubahan data serta filter yang dipilih. | Athaya (DS) |
| **Model anomali dan grade A–C** | Bandingkan baseline dengan dua variasi konfigurasi pada training set dan validation set yang sama. Variasi pertama mengubah features melalui feature engineering dengan parameter baseline tetap, sedangkan variasi kedua menerapkan tuning pada features dari variasi pertama. Setelah konfigurasi dipilih, lakukan evaluasi akhir pada test set terpisah yang mencakup kasus normal dan anomali berlabel. | README memuat perbandingan precision, recall, dan F1 serta alasan memilih konfigurasi. Grade A–C ditampilkan di aplikasi. | Ghani (AE) |
| **Intent classifier** Tambahan | Periksa jumlah contoh pada setiap kelas, kemudian uji sedikitnya empat intent dengan berbagai ungkapan dan pertanyaan ambigu. Gunakan validation set untuk memilih konfigurasi sebelum menilai hasil akhirnya pada test set terpisah. | Macro-F1 dan confusion matrix menunjukkan hasil klasifikasi. Pi memilih tool atau sumber jawaban yang sesuai, atau meminta penjelasan jika pertanyaan belum jelas. | Marcelia (DS) |
| **Pi dan RAG** | Ajukan pertanyaan tentang data dari berbagai bagian aplikasi dan informasi dari dokumen RAG dengan prompt terstruktur. Uji juga sedikitnya 10 pertanyaan di luar konteks usaha, penggunaan dokumen yang tidak relevan, serta respons saat API lambat atau gagal. | Jawaban sesuai dengan data atau dokumen sumber. Pi menolak pertanyaan di luar konteks dengan sopan, meminta penjelasan bila perlu, dan menyampaikan jika informasi tidak tersedia. Riwayat chat dan hasil prediksi dapat dibuka kembali. | Hafidh (AE) |
| **Integrasi dan error handling** | Coba endpoint lewat dokumentasi API interaktif. Uji request/response, input tidak lengkap, koneksi putus, kuota habis, serta penyimpanan dan pembacaan kembali hasil prediksi. | Response dan kode error sesuai API contract. Hasil tersimpan hanya bisa dibaca pengguna yang berhak. Saat AI gagal, pemilik tetap bisa mencatat aktivitas dan transaksi. | Josep (FS) |
| **Alur penggunaan dan tampilan** | Melalui HP, isi data kamar, buat jadwal, perbarui aktivitas, catat pembayaran, buka dashboard, lalu gunakan Pi. Ulangi alur pada tablet dan desktop. Minta pemilik mencoba alur utama dan catat bagian yang membingungkan untuk diperbaiki. | Pemilik bisa menyelesaikan alur dengan panduan yang tersedia. Tombol berfungsi, tampilan tidak terpotong, dan status proses terlihat jelas. | Filbert (FS) |
| **Laporan penghuni dan WhatsApp** Opsional | Jika dikerjakan, kirim laporan masalah kamar dan coba tindak lanjut pemilik. Periksa penerima serta jadwal WhatsApp, termasuk ketika pesan gagal dikirim. | Laporan terkait dengan kamar yang benar. WhatsApp hanya dikirim kepada pemilik. Pengingat di aplikasi tetap muncul jika pengiriman WhatsApp gagal. | Filbert (FS) |

