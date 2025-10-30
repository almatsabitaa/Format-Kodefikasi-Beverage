let currentShelfLife = 0;
let currentKodeProduk = '';
let currentSKU = '';
let currentLine = ''; 
let masterDataProduk = []; 

const skuSelect = document.getElementById('skuProduct'); 
const kemasanSelect = document.getElementById('packagingType'); 
const tglProduksiInput = document.getElementById('productionDate'); 
const form = document.getElementById('calculatorForm'); 

const kodeExpiredFinal = document.getElementById('kodeExpiredFinal');
const kodeKartonFinal = document.getElementById('kodeKartonFinal');
const resultArea = document.getElementById('resultArea');
const errorMessageP = document.getElementById('error_message');

const API_BASE_URL = 'http://localhost:3000/api';


function populateDropdowns(products) {
    const uniqueSKUs = [...new Set(products.map(p => p.sku))]; 
    populateSelect(skuSelect, uniqueSKUs, "Pilih SKU");
    
    const uniqueKemasan = [...new Set(products.map(p => p.jenis_kemasan))];
    populateSelect(kemasanSelect, uniqueKemasan, "Pilih Jenis Kemasan");
}

function populateSelect(selectElement, options, placeholderText) {
    selectElement.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;
    options.sort().forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        selectElement.appendChild(option);
    });
}


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
    
    const isMTSKU = currentSKU.startsWith('MT');
    if (selectedKemasan === 'PET' && !isMTSKU) {
        currentLine = 'B'; 
    } else {
        currentLine = ''; 
    }
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function calculateExpiryData(prodDate, shelfLife) {
    let expDate = new Date(prodDate);
    let akhiran = currentKodeProduk; 
    const isPET = kemasanSelect.value === 'PET'; 
    
    const prodDay = prodDate.getDate();
    const prodMonth = prodDate.getMonth() + 1;
    const prodYear = prodDate.getFullYear();

    let handledBySpecialRule = false;

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
    
    else if (prodMonth === 2 && prodDay === 29) {
        expDate.setFullYear(prodYear + 1);
        
        if (shelfLife === 12) {
            akhiran = currentKodeProduk + 'X'; 
            expDate.setMonth(2); expDate.setDate(1); 
        } 
        
        else if (shelfLife === 13) {
            akhiran = currentKodeProduk + 'C';
            expDate.setMonth(2); 
            expDate.setDate(29); 
        }
        handledBySpecialRule = true;
    }
    
    else if (shelfLife === 13 && (
        (prodMonth === 3 && prodDay === 31) ||
        (prodMonth === 5 && prodDay === 31) ||
        (prodMonth === 8 && prodDay === 31) ||
        (prodMonth === 10 && prodDay === 31)
    )) {
        akhiran = currentKodeProduk + 'X';
        let tempDate = new Date (prodDate);
        expDate.setFullYear(prodYear);
        expDate.setMonth(prodDate.getMonth() + 14); 
        expDate.setDate(1);
        handledBySpecialRule = true;
    }

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
    
    let kodeKartonPart = '';
    let lineKarton = isPET ? 'B' : 'A';

    if (shelfLife === 13) {
        kodeKartonPart = 'C';
    } else if (shelfLife === 12 && prodMonth === 2 && prodDay === 29) {
        kodeKartonPart = 'X'; 
    } 
    
    if (shelfLife === 13 && prodMonth === 1 && (prodDay >= 29 && prodDay <= 31)) {
        kodeKartonPart = 'X'; 
    }
    
    const kodeKartonFinalCode = lineKarton + kodeKartonPart; 
    
    return {
        tgl: expDate,
        akhiran: akhiran,
        kodeKarton: kodeKartonFinalCode
    };
}


document.addEventListener('DOMContentLoaded', () => {
    fetch(`${API_BASE_URL}/products`) 
        .then(response => {
            if (!response.ok) {
                errorMessageP.style.display = 'block';
                throw new Error('Gagal mengambil data produk dari server. Status Code: ' + response.status);
            }
            errorMessageP.style.display = 'none'; 
            return response.json(); 
        })
        .then(data => {
            masterDataProduk = data; 
            populateDropdowns(masterDataProduk); 
        })
        .catch(error => {
            console.error('Inisialisasi Gagal:', error);
            errorMessageP.textContent = 'Gagal memuat data produk. Pastikan server Node.js berjalan di http://localhost:3000.';
            errorMessageP.style.display = 'block';
        });


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
            const linePartProduk = currentLine ? ` ${currentLine} ` : ' '; 
            

            const kodeExpiredFinalProduk = `EXP ${expiredDateCode}${linePartProduk}${result.akhiran}`;
            
            const kodeExpiredFinalKarton = `EXP ${expiredDateCode} ${result.kodeKarton}`;
            
            kodeExpiredFinal.textContent = kodeExpiredFinalProduk;
            kodeKartonFinal.textContent = kodeExpiredFinalKarton;
            
            resultArea.style.display = 'block';
        });
    }
});