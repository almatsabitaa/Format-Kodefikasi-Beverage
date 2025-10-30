const productTableBody = document.getElementById('productTableBody');
const addProductForm = document.getElementById('addProductForm');
const loginForm = document.getElementById('loginForm');
const logoutButton = document.getElementById('logoutButton');
const loginContainer = document.getElementById('loginContainer');
const adminContent = document.getElementById('adminContent');
const loginMessage = document.getElementById('loginMessage');

const editContainer = document.getElementById('editContainer');
const editProductForm = document.getElementById('editProductForm');
const editIdInput = document.getElementById('editId');
const editProductIdSpan = document.getElementById('editProductId');
const cancelEditButton = document.getElementById('cancelEditButton');

const API_BASE_URL = 'http://localhost:3000/api';

function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        showAdminContent();
        fetchAndRenderProducts(); 
    } else {
        showLoginForm();
    }
}

function showAdminContent() {
    loginContainer.style.display = 'none';
    adminContent.style.display = 'block';
}

function showLoginForm() {
    loginContainer.style.display = 'block';
    adminContent.style.display = 'none';
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMessage.textContent = '';
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token); 
            showAdminContent();
            fetchAndRenderProducts();
        } else {
            loginMessage.textContent = data.message;
        }

    } catch (error) {
        console.error('Login Error:', error);
        loginMessage.textContent = 'Koneksi ke server gagal.';
    }
});

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    alert('Anda telah logout.');
    showLoginForm();
});

function renderProducts(products) {
    productTableBody.innerHTML = '';
    products.forEach(product => {
        const row = productTableBody.insertRow();
        
        row.insertCell().textContent = product.id; 
        row.insertCell().textContent = product.sku; 
        row.insertCell().textContent = product.jenis_kemasan; 
        row.insertCell().textContent = product.shelf_life_bulan;
        row.insertCell().textContent = product.kode_produk;
        
        const actionCell = row.insertCell();
        actionCell.classList.add('action-cell');
        
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-button');
        editButton.onclick = () => showEditForm(product);
        actionCell.appendChild(editButton);
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Hapus';
        deleteButton.style.backgroundColor = 'salmon';
        deleteButton.style.color = 'white';
        deleteButton.onclick = () => deleteProduct(product.id, product.sku);
        actionCell.appendChild(deleteButton);
    });
}

async function fetchAndRenderProducts() {
    editContainer.style.display = 'none'; 
    
    try {
        const token = localStorage.getItem('authToken'); 
        if (!token) return; 

        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                showLoginForm();
                alert('Sesi kadaluarsa. Silakan login kembali.');
                return;
            }
            throw new Error('Gagal memuat data produk.');
        }
        const data = await response.json();
        renderProducts(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        productTableBody.innerHTML = `<tr><td colspan="6">Gagal memuat data: ${error.message}.</td></tr>`;
    }
}

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newSku = document.getElementById('newSku').value.toUpperCase();
    const newKemasan = document.getElementById('newKemasan').value.toUpperCase();
    const newShelfLife = parseInt(document.getElementById('newShelfLife').value);
    const newKodeProduk = document.getElementById('newKodeProduk').value.toUpperCase();

    const newProduct = { sku: newSku, jenis_kemasan: newKemasan, shelf_life_bulan: newShelfLife, kode_produk: newKodeProduk };
    
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct)
        });

        if (!response.ok) {
            const errorText = await response.text(); 
            if (response.status === 409) { 
                 alert('Gagal: Kombinasi SKU dan Jenis Kemasan sudah ada (Duplikat).');
            } else {
                 throw new Error('Gagal menambahkan data: ' + errorText);
            }
        } else {
            alert('Produk berhasil ditambahkan!');
            addProductForm.reset(); 
            fetchAndRenderProducts(); 
        }
    } catch (error) {
        console.error('Error saat menambah produk:', error);
        alert(error.message);
    }
});

async function deleteProduct(id, sku) {
    if (!confirm(`Yakin ingin menghapus produk SKU ${sku} (ID: ${id})?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Gagal menghapus produk.');
        }

        alert(`Produk SKU ${sku} berhasil dihapus.`);
        fetchAndRenderProducts(); 
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(error.message);
    }
}

function showEditForm(product) {
    editIdInput.value = product.id;
    editProductIdSpan.textContent = product.id;
    document.getElementById('editSku').value = product.sku;
    document.getElementById('editKemasan').value = product.jenis_kemasan;
    document.getElementById('editShelfLife').value = product.shelf_life_bulan;
    document.getElementById('editKodeProduk').value = product.kode_produk;
    
    editContainer.style.display = 'block';
    window.scrollTo(0, 0);
}

cancelEditButton.addEventListener('click', () => {
    editContainer.style.display = 'none';
});

editProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editIdInput.value;
    const updatedProduct = {
        sku: document.getElementById('editSku').value.toUpperCase(),
        jenis_kemasan: document.getElementById('editKemasan').value.toUpperCase(),
        shelf_life_bulan: parseInt(document.getElementById('editShelfLife').value),
        kode_produk: document.getElementById('editKodeProduk').value.toUpperCase()
    };

    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
        });

        if (!response.ok) {
            const errorText = await response.text(); 
            if (response.status === 409) { 
                 alert('Gagal: Kombinasi SKU dan Jenis Kemasan sudah ada (Duplikat).');
            } else {
                 throw new Error('Gagal memperbarui data: ' + errorText);
            }
        } else {
            alert(`Produk ID ${id} berhasil diperbarui!`);
            editContainer.style.display = 'none';
            fetchAndRenderProducts();
        }
    } catch (error) {
        console.error('Error saat memperbarui produk:', error);
        alert(error.message);
    }
});


document.addEventListener('DOMContentLoaded', checkLoginStatus);