// DATABASE
const ORDERS_KEY = 'fiddlaundry_orders';

function getOrders() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

//  NAVIGASI HALAMAN 
function showPage(page) {
  // Sembunyikan semua page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Reset semua nav link
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  // Tampilkan page yang dipilih
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-' + page).classList.add('active');

  // Scroll ke atas
  window.scrollTo(0, 0);

  // Jika admin: reset ke login view dulu jika belum login
  if (page === 'admin') {
    if (!sessionStorage.getItem('admin_logged_in')) {
      document.getElementById('admin-login').classList.remove('hidden');
      document.getElementById('admin-dashboard').classList.add('hidden');
    } else {
      document.getElementById('admin-login').classList.add('hidden');
      document.getElementById('admin-dashboard').classList.remove('hidden');
      renderOrders();
    }
  }
}

// GENERATE NOMOR RESI
function generateResi() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return 'LND-' + num;
}

// HITUNG ESTIMASI HARGA
function hitungHarga(layanan, jumlah) {
  const harga = {
    'Kiloan (Kg)': 8000,
    'Satuan Premium (Pcs)': 15000,
    'Cuci Sepatu (Pasang)': 35000,
    'Cuci Karpet (Meter)': 15000,
    'Dry Clean (Pcs)': 25000,
  };
  const qty = parseFloat(jumlah) || 1;
  const rate = harga[layanan] || 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(rate * qty);
}

// FORMAT TANGGAL 
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ===== KIRIM PESANAN =====
function kirimPesanan() {
  const nama = document.getElementById('input-nama').value.trim();
  const wa = document.getElementById('input-wa').value.trim();
  const alamat = document.getElementById('input-alamat').value.trim();
  const layanan = document.getElementById('input-layanan').value;
  const jumlah = document.getElementById('input-jumlah').value.trim();

  if (!nama || !wa || !alamat || !layanan || !jumlah) {
    alert('❗ Mohon lengkapi semua data!');
    return;
  }

  const resi = generateResi();
  const order = {
    resi,
    nama,
    wa,
    alamat,
    layanan,
    jumlah,
    harga: hitungHarga(layanan, jumlah),
    status: 'Antre',
    tanggal: new Date().toISOString(),
  };

  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);

  // Tampilkan resi
  document.getElementById('resi-number').textContent = resi;
  document.getElementById('resi-result').classList.remove('hidden');

  // Reset form
  document.getElementById('input-nama').value = '';
  document.getElementById('input-wa').value = '';
  document.getElementById('input-alamat').value = '';
  document.getElementById('input-layanan').value = '';
  document.getElementById('input-jumlah').value = '';
}

// CARI RESI 
function cariResi() {
  const input = document.getElementById('input-resi').value.trim().toUpperCase();
  const orders = getOrders();
  const order = orders.find(o => o.resi === input);
  const resultEl = document.getElementById('lacak-result');

  if (!order) {
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `
      <div style="text-align:center;padding:24px;color:#ef4444;">
        <div style="font-size:2.5rem;margin-bottom:8px">❌</div>
        <strong>Resi tidak ditemukan.</strong>
        <p style="color:#64748b;font-size:.88rem;margin-top:4px">Pastikan nomor resi sudah benar.</p>
      </div>
    `;
    return;
  }

  const statusList = ['Antre', 'Dicuci', 'Disetrika', 'Selesai'];
  const currentIdx = statusList.indexOf(order.status);

  const steps = statusList.map((s, i) => {
    let cls = '';
    if (i < currentIdx) cls = 'done';
    else if (i === currentIdx) cls = 'active';

    const subLabel = [
      'Menunggu diproses',
      'Sedang proses cuci',
      'Finishing & Packing',
      'Siap Diantarkan/Diambil',
    ][i];

    const icon = i < currentIdx ? '✓' : (i + 1);

    return `<div class="step ${cls}">
      <div class="step-circle">${icon}</div>
      <div class="step-label">${s}</div>
      <div class="step-sub">${subLabel}</div>
    </div>`;
  });

  // Insert lines between steps
  const stepperHtml = steps.reduce((acc, step, i) => {
    acc += step;
    if (i < steps.length - 1) {
      const filled = i < currentIdx ? 'filled' : '';
      acc += `<div class="step-line ${filled}"></div>`;
    }
    return acc;
  }, '');

  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <div class="lacak-meta">
      <div>
        <div class="lacak-resi">${order.resi}</div>
        <div class="lacak-nama">Tanggal: ${formatDate(order.tanggal)}</div>
      </div>
      <div style="text-align:right">
        <div class="lacak-nama">Pelanggan</div>
        <strong>${order.nama}</strong>
      </div>
    </div>
    <div class="stepper">${stepperHtml}</div>
    <div class="lacak-layanan">Layanan yang dipilih: <span>${order.layanan}</span> &nbsp;|&nbsp; Jumlah: <span>${order.jumlah}</span> &nbsp;|&nbsp; Est. Harga: <span>${order.harga}</span></div>
  `;
}

// Enter key untuk cari resi
document.getElementById('input-resi').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') cariResi();
});

//  ADMIN LOGIN 
const ADMIN_PASSWORD = 'admin123'; // password kominfo

function adminLogin() {
  const pw = document.getElementById('admin-password').value;
  const errEl = document.getElementById('login-error');

  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('admin_logged_in', '1');
    document.getElementById('admin-login').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    errEl.classList.add('hidden');
    renderOrders();
  } else {
    errEl.classList.remove('hidden');
    document.getElementById('admin-password').value = '';
  }
}

// Enter key untuk login
document.getElementById('admin-password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') adminLogin();
});

function adminLogout() {
  sessionStorage.removeItem('admin_logged_in');
  document.getElementById('admin-login').classList.remove('hidden');
  document.getElementById('admin-dashboard').classList.add('hidden');
  document.getElementById('admin-password').value = '';
}

function refreshDashboard() {
  renderOrders();
}

// RENDER TABEL PESANAN 
function renderOrders() {
  const orders = getOrders();
  const tbody = document.getElementById('orders-tbody');
  const emptyEl = document.getElementById('empty-orders');
  const tableEl = document.getElementById('orders-table');

  if (orders.length === 0) {
    tableEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  tableEl.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  // Urutkan terbaru dulu
  const sorted = [...orders].reverse();

  tbody.innerHTML = sorted.map(order => {
    const badgeClass = {
      'Antre': 'badge-antre',
      'Dicuci': 'badge-dicuci',
      'Disetrika': 'badge-disetrika',
      'Selesai': 'badge-selesai',
    }[order.status] || 'badge-antre';

    return `
      <tr>
        <td>
          <span class="resi-code">${order.resi}</span>
          <span class="order-date">${formatDate(order.tanggal)}</span>
        </td>
        <td>
          <div class="customer-name">${order.nama}</div>
          <div class="customer-wa">📱 ${order.wa}</div>
        </td>
        <td>
          <div class="order-layanan">${order.layanan} (${order.jumlah})</div>
          <div class="order-price">${order.harga}</div>
        </td>
        <td><span class="badge ${badgeClass}">${order.status}</span></td>
        <td>
          <select class="status-select" onchange="updateStatus('${order.resi}', this.value)">
            <option ${order.status === 'Antre' ? 'selected' : ''}>Antre</option>
            <option ${order.status === 'Dicuci' ? 'selected' : ''}>Dicuci</option>
            <option ${order.status === 'Disetrika' ? 'selected' : ''}>Disetrika</option>
            <option ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// UPDATE STATUS PESANAN =
function updateStatus(resi, newStatus) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.resi === resi);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    saveOrders(orders);
    renderOrders(); // Re-render untuk update pesanan di dashboard atmin
  }
}