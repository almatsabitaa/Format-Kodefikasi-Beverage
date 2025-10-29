// script.js - Final Version with API Fetch, Full Calculation Logic, MT/Paper Pack Exception, dan Koreksi Spasi

let currentShelfLife = 0;
let currentKodeProduk = '';
let currentSKU = '';
// currentLine akan menyimpan 'B' atau '' (kosong)
let currentLine = ''; 

// Variabel global yang diisi oleh data dari API (MySQL)
let masterDataProduk = []; 

// KOREKSI: Sesuaikan dengan ID di HTML terbaru (index.html)
const skuSelect = document.getElementById('skuProduct'); // Ganti dari 'sku'
const kemasanSelect = document.getElementById('packagingType'); // Ganti dari 'kemasan'
const tglProduksiInput = document.getElementById('productionDate'); // Ganti dari 'tglProduksi'
const form = document.getElementById('calculatorForm'); // Ganti dari 'expiredCodeForm'

const kodeExpiredFinal = document.getElementById('kodeExpiredFinal');
const kodeKartonFinal = document.getElementById('kodeKartonFinal');
const resultArea = document.getElementById('resultArea');
const errorMessageP = document.getElementById('error_message');

const API_BASE_URL = 'https://qa-beverage-api.onrender.com/api';


// --- FUNGSI UTAMA UNTUK MENGISI DROPDOWN DARI DATA API ---
function populateDropdowns(products) {
    // 1. Isi Dropdown SKU
    const uniqueSKUs = [...new Set(products.map(p => p.sku))]; 
    populateSelect(skuSelect, uniqueSKUs, "Pilih SKU");
    
    // 2. Isi Dropdown Kemasan
    const uniqueKemasan = [...new Set(products.map(p => p.jenis_kemasan))];
    populateSelect(kemasanSelect, uniqueKemasan, "Pilih Jenis Kemasan");
}

function populateSelect(selectElement, options, placeholderText) {
    // Kosongkan, lalu tambahkan placeholder
    selectElement.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;

    options.sort().forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        selectElement.appendChild(option);
    });
}


// --- FUNGSI UNTUK MEMPERBARUI SHELF LIFE & KODE PRODUK + PENGECUALIAN MT/PAPER PACK ---
function updateDetails() {
    currentSKU = skuSelect.value;
    const selectedKemasan = kemasanSelect.value;
    
    const selectedProduct = masterDataProduk.find(
        p => p.sku === currentSKU && p.jenis_kemasan === selectedKemasan
    );

    if (selectedProduct) {
        currentShelfLife = selectedProduct.shelf_life_bulan;
        currentKodeProduk = selectedProduct.kode_produk;
    } else {
        currentShelfLife = 0;
        currentKodeProduk = '';
    }
    
    // --------------------------------------------------------------------
    // *** LOGIKA KHUSUS PENENTUAN LINE (B) UNTUK TAMPILAN KODE SATUAN ***
    // Aturan: Hanya PET (bukan SKU MT) yang mendapat kode Line 'B'. Lainnya kosong.
    // --------------------------------------------------------------------
    const isMTSKU = currentSKU.startsWith('MT');

    if (selectedKemasan === 'PET' && !isMTSKU) {
        currentLine = 'B'; // Hanya PET (non-MT) yang mendapat kode Line 'B'
    } else {
        currentLine = ''; // Paper Pack (dan semua SKU MT) tidak mendapat kode Line
    }
}


// --- FUNGSI CEK TAHUN KABISAT ---
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}


// --- FUNGSI PERHITUNGAN TANGGAL EXPIRED (Inti Logika Asli Anda) ---
function calculateExpiryData(prodDate, shelfLife) {
    let expDate = new Date(prodDate);
    let akhiran = currentKodeProduk; 
    const isPET = kemasanSelect.value === 'PET'; 
    
    const prodDay = prodDate.getDate();
    const prodMonth = prodDate.getMonth() + 1;
    const prodYear = prodDate.getFullYear();

    let handledBySpecialRule = false;

    // Logika 13 bulan, Akhir Januari (29, 30, 31)
    if (shelfLife === 13 && prodMonth === 1 && (prodDay >= 29 && prodDay <= 31)) {
        akhiran = currentKodeProduk + 'X';
        expDate.setFullYear(prodYear + 1); 
        if (prodDay === 29) {
            if (isLeapYear(expDate.getFullYear())) {expDate.setMonth(1); expDate.setDate(29);} 
            else {expDate.setMonth(2); expDate.setDate(1);} 
        } else if (prodDay === 30) {
            expDate.setMonth(2); expDate.setDate(2);
        } else if (prodDay === 31) {
            expDate.setMonth(2); expDate.setDate(3);
        }
        handledBySpecialRule = true;
    }
    
    // Logika Produksi 29 Februari (LEAP DAY)
    else if (prodMonth === 2 && prodDay === 29) {
        expDate.setFullYear(prodYear + 1);
        
        if (shelfLife === 12) {
            akhiran = currentKodeProduk + 'X'; 
            expDate.setMonth(2); expDate.setDate(1); 
        } 
        
        else if (shelfLife === 13) {
            akhiran = currentKodeProduk + 'C';
            expDate.setMonth(1); 
            expDate.setDate(29); 
        }
        handledBySpecialRule = true;
    }
    
    // Logika 13 bulan, Akhir bulan (31) lainnya
    else if (shelfLife === 13 && (
        (prodMonth === 3 && prodDay === 31) ||
        (prodMonth === 5 && prodDay === 31) ||
        (prodMonth === 8 && prodDay === 31) ||
        (prodMonth === 10 && prodDay === 31)
    )) {
        akhiran = currentKodeProduk + 'X';
        expDate.setFullYear(prodYear + 1);
        expDate.setMonth(prodDate.getMonth() + 1 + 12); 
        expDate.setDate(1);
        handledBySpecialRule = true;
    }

    // Logika Umum (Regular)
    if (!handledBySpecialRule) {
        const originalProdDay = prodDate.getDate();
        expDate.setDate(1);
        expDate.setMonth(prodDate.getMonth() + shelfLife);
        
        const lastDayOfMonth = new Date(expDate.getFullYear(), expDate.getMonth() + 1, 0).getDate();
        expDate.setDate(Math.min(originalProdDay, lastDayOfMonth));
        
        if (shelfLife === 13) {
            akhiran = currentKodeProduk + 'C';
        } 
    }
    
    // --- LOGIKA KODE KARTON (B/A, BX/AX, BC/AC) ---
    let kodeKartonPart = '';
    
    // Line Karton: B untuk semua PET, A untuk PAPER PACK (TIDAK ADA PENGECUALIAN MT DI KODE KARTON)
    let lineKarton = isPET ? 'B' : 'A';

    if (shelfLife === 13) {
        kodeKartonPart = 'C';
    } else if (shelfLife === 12 && prodMonth === 2 && prodDay === 29) {
        kodeKartonPart = 'X'; 
    } 
    
    const kodeKartonFinalCode = lineKarton + kodeKartonPart; 
    
    return {
        tgl: expDate,
        akhiran: akhiran,
        kodeKarton: kodeKartonFinalCode
    };
}


// --- EVENT LISTENER UTAMA ---
document.addEventListener('DOMContentLoaded', () => {
    // --- AMBIL DATA DARI API ---
    fetch(API_URL) 
        .then(response => {
            if (!response.ok) {
                // Sembunyikan pesan error di HTML jika server mati
                errorMessageP.style.display = 'block';
                throw new Error('Gagal mengambil data produk dari server. Status Code: ' + response.status);
            }
            errorMessageP.style.display = 'none'; // Sembunyikan error jika sukses
            return response.json(); 
        })
        .then(data => {
            masterDataProduk = data; 
            populateDropdowns(masterDataProduk); 
        })
        .catch(error => {
            console.error('Inisialisasi Gagal:', error);
            // Tampilkan pesan error di HTML jika gagal
            errorMessageP.textContent = 'Gagal memuat data produk. Pastikan server Node.js berjalan di http://localhost:3000.';
            errorMessageP.style.display = 'block';
        });


    // Atur Event Listeners
    if (skuSelect && kemasanSelect) {
        skuSelect.addEventListener('change', updateDetails);
        kemasanSelect.addEventListener('change', updateDetails);
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            updateDetails(); 
            
            if (currentShelfLife === 0 || !tglProduksiInput.value) {
                alert('Pilih kombinasi SKU dan Jenis Kemasan yang valid, serta Tanggal Produksi.');
                return;
            }

            const prodDate = new Date(tglProduksiInput.value + 'T00:00:00'); 
            const result = calculateExpiryData(prodDate, currentShelfLife);
            
            const expYear = result.tgl.getFullYear().toString().slice(-2);
            const expMonth = ('0' + (result.tgl.getMonth() + 1)).slice(-2);
            const expDay = ('0' + result.tgl.getDate()).slice(-2);

            const expiredDateCode = `${expDay}${expMonth}${expYear}`;
            
            // *** PERBAIKAN SPASI FINAL DI SINI ***
            // Jika ada Line (B): Hasilnya adalah " B " (spasi-B-spasi)
            // Jika TIDAK ada Line (MT atau Paper Pack): Hasilnya adalah " " (spasi)
            const linePartProduk = currentLine ? ` ${currentLine} ` : ' '; 
            
            // Kode Akhir Satuan: EXP DDMMYY [B] KODEPESAN
            const kodeExpiredFinalProduk = `EXP ${expiredDateCode}${linePartProduk}${result.akhiran}`;
            
            // Kode Akhir Karton: EXP DDMMYY KODEKARTON
            const kodeExpiredFinalKarton = `EXP ${expiredDateCode} ${result.kodeKarton}`;
            
            kodeExpiredFinal.textContent = kodeExpiredFinalProduk;
            kodeKartonFinal.textContent = kodeExpiredFinalKarton;
            
            resultArea.style.display = 'block';
        });
    }
});