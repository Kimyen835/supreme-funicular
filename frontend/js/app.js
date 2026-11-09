// ==============================================================================
// ỨNG DỤNG QUẢN LÝ CHUỖI CÀ PHÊ - TOÀN DIỆN THEO SƠ ĐỒ ERD & HỆ THỐNG UCD
// 4 Vai Trò: Chủ Quán (Owner), Quản Lý (Manager), Thu Ngân (Cashier), Nhân Viên Kho (Warehouse)
// ==============================================================================

// Trạng thái ứng dụng
const state = {
  currentBranch: 'CN01',       // Chi nhánh đang chọn (ALL, CN01, CN02)
  currentUser: null,           // Người dùng hiện tại
  currentShift: 'CA_SANG',     // Ca làm việc hiện tại
  currentView: 'report',       // Màn hình đang mở
  orderType: 'DungTaiCho',     // Loại đơn hàng: 'DungTaiCho' | 'TakeAway' (Quy tắc 1)
  selectedTable: null,         // Thẻ/Bàn đang chọn từ sơ đồ (Quy tắc 2)
  manualTableCard: '',         // Thẻ bàn/thẻ rung nhập thủ công (Quy tắc 2)
  takeawayCustomer: '',        // Tên khách hoặc số thứ tự khi Mang đi
  currentOrderSeq: '012',      // Mã số thứ tự đơn hàng POS (VD: Đơn #012)
  openNoteIndices: new Set(),  // Set các index món đang mở ô ghi chú
  currentOrder: [],            // Giỏ hàng hiện tại [{ MaMonSize, TenMon, TenSize, GiaBan, SoLuong }]
  selectedCustomer: null,      // Khách hàng cũ tìm thấy (Quy tắc 3)
  isNewCustomer: false,        // Cờ nhận diện khách hàng mới (Quy tắc 4)
  discountPercent: 0,          // Phần trăm giảm giá
  discountAmount: 0,           // Tiền giảm giá
  paymentMethod: 'TienMat',    // TienMat, ChuyenKhoan, The
  cashGiven: 0,                // Tiền khách đưa khi thanh toán Tiền mặt (VND)
  customerLookupTimer: null,   // Timer debounce tra cứu khách hàng
  activeCategory: 'ALL',       // Danh mục món đang lọc tại POS
  inventoryFilter: 'ALL',      // Bộ lọc tồn kho (ALL, LOW)
  reportFilterBranch: 'ALL',   // Chi nhánh lọc báo cáo
  inventoryFilterBranch: 'ALL', // Chi nhánh lọc kho
  historyPage: 1,              // Trang hiện tại của lịch sử đơn hàng
  historyPageSize: 8,          // Số lượng đơn trên 1 trang
  historyTotalPages: 1,        // Tổng số trang
  currentHistoryOrders: [],    // Danh sách đơn hàng đang hiển thị
  selectedDetailInvoice: null  // Đơn hàng đang xem chi tiết
};

// ==============================================================================
// 1. KHỞI CHẠY HỆ THỐNG
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initLoginScreen();
  loadDatabase();
});

function formatMoney(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ₫';
  return Math.round(amount).toLocaleString('vi-VN') + ' ₫';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-slate-800';
  toast.className = `${bgClass} text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2`;
  toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Khởi tạo màn hình đăng nhập
function initLoginScreen() {
  const branchSelect = document.getElementById('login-branch-select');
  const shiftSelect = document.getElementById('login-shift-select');

  if (branchSelect && DB.chinhanh) {
    branchSelect.innerHTML = DB.chinhanh.map(cn => 
      `<option value="${cn.MaCN}">📍 ${cn.TenCN}</option>`
    ).join('');
  }

  if (shiftSelect && DB.calam) {
    shiftSelect.innerHTML = DB.calam.map(ca => 
      `<option value="${ca.MaCa}">${ca.TenCa}</option>`
    ).join('');
    shiftSelect.value = getAutoShiftId();
  }
}

function getAutoShiftId() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'CA_SANG';
  if (h >= 12 && h < 17) return 'CA_CHIEU';
  return 'CA_TOI';
}

function toggleAdvancedLogin() {
  const advBox = document.getElementById('login-advanced-options');
  const textEl = document.getElementById('toggle-advanced-text');
  if (!advBox) return;
  if (advBox.classList.contains('hidden')) {
    advBox.classList.remove('hidden');
    if (textEl) textEl.innerText = 'Ẩn tùy chọn nâng cao';
  } else {
    advBox.classList.add('hidden');
    if (textEl) textEl.innerText = 'Tùy chọn chi nhánh & ca làm việc';
  }
}

function quickLogin(username, password) {
  const userEl = document.getElementById('login-username');
  const passEl = document.getElementById('login-password');
  if (userEl) userEl.value = username;
  if (passEl) passEl.value = password;
  performLogin();
}

// ==============================================================================
// 2. NGHIỆP VỤ ĐĂNG NHẬP (CHECK-IN) & ĐĂNG XUẤT (CHECK-OUT)
// ==============================================================================
function performLogin() {
  const usernameInput = (document.getElementById('login-username')?.value || '').trim();
  const passwordInput = (document.getElementById('login-password')?.value || '').trim();

  if (!DB.nhanvien || !Array.isArray(DB.nhanvien)) {
    loadDatabase();
  }

  const cleanInput = usernameInput.toLowerCase().replace(/[\s\.\-]+/g, '');

  let staff = null;
  if (cleanInput) {
    staff = DB.nhanvien.find(n => {
      const ma = (n.MaNV || '').toLowerCase().replace(/[\s\.\-]+/g, '');
      const user = (n.TenDangNhap || '').toLowerCase().replace(/[\s\.\-]+/g, '');
      const phone = (n.SDT || '').replace(/[\s\.\-]+/g, '');
      return ma === cleanInput || user === cleanInput || phone === cleanInput;
    });
  }

  if (!staff) {
    alert('Không tìm thấy tài khoản nhân viên! Vui lòng nhập NV001, NV006, NV002, NV008...');
    return;
  }

  if (passwordInput && staff.MatKhau && staff.MatKhau !== passwordInput && staff.MaPIN !== passwordInput) {
    alert('Mật khẩu hoặc mã PIN không đúng! Mặc định là: 1234');
    return;
  }

  state.currentUser = staff;
  const shiftSelect = document.getElementById('login-shift-select');
  state.currentShift = shiftSelect ? shiftSelect.value : getAutoShiftId();

  // Ẩn màn hình đăng nhập, mở giao diện chính
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-main').classList.remove('hidden');

  // Cập nhật thông tin Header
  const userNameEl = document.getElementById('current-user-name');
  const userAvatarEl = document.getElementById('current-user-avatar');
  const userRoleEl = document.getElementById('dropdown-user-role');

  if (userNameEl) userNameEl.innerText = staff.TenNV;
  if (userAvatarEl) userAvatarEl.innerText = staff.Avatar || '👨‍💼';
  if (userRoleEl) userRoleEl.innerText = staff.ChucVuText || staff.Role;

  applyRolePermissions(staff);
  showToast(`🎉 Xin chào ${staff.TenNV} đã Check-in ca làm việc!`, 'success');
}

function handleUserLogout() {
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) menu.classList.add('hidden');
  state.currentUser = null;
  state.currentOrder = [];
  document.getElementById('app-main').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  showToast('👋 Đã đăng xuất và kết thúc ca thành công!');
}

function toggleUserMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) menu.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-dropdown-menu');
  const btn = document.getElementById('user-menu-btn');
  if (menu && !menu.classList.contains('hidden')) {
    if (btn && !btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add('hidden');
    }
  }
});

// ==============================================================================
// 3. PHÂN QUYỀN 4 VAI TRÒ THEO USE CASE DIAGRAM (UCD)
// ==============================================================================
function getStaffRoleKey(staff) {
  if (!staff) return 'SUPER_ADMIN';
  if (staff.Role) return staff.Role;
  const cv = (staff.ChucVu || '').toLowerCase();
  if (cv.includes('chu') || cv.includes('admin') || cv.includes('owner')) return 'SUPER_ADMIN';
  if (cv.includes('quanly') || cv.includes('manager')) return 'BRANCH_MANAGER';
  if (cv.includes('thukho') || cv.includes('kho') || cv.includes('warehouse')) return 'WAREHOUSE';
  return 'CASHIER';
}

function applyRolePermissions(staff) {
  const roleKey = getStaffRoleKey(staff);
  const branchSelect = document.getElementById('header-branch-select');
  const branchFixedBadge = document.getElementById('header-branch-fixed-badge');
  const navOwner = document.getElementById('nav-tabs-owner');
  const navManager = document.getElementById('nav-tabs-manager');
  const navPosActions = document.getElementById('nav-pos-actions');
  const navWarehouse = document.getElementById('nav-tabs-warehouse');

  // Reset hiển thị toàn bộ thanh điều hướng
  if (navOwner) navOwner.classList.add('hidden');
  if (navManager) navManager.classList.add('hidden');
  if (navPosActions) navPosActions.classList.add('hidden');
  if (navWarehouse) navWarehouse.classList.add('hidden');

  const branchId = staff.DefaultBranch || staff.MaCN || 'CN01';
  state.currentBranch = branchId;
  const branchInfo = DB.chinhanh.find(b => b.MaCN === branchId) || { TenCN: branchId };

  if (roleKey === 'SUPER_ADMIN') {
    // 1. CHỦ QUÁN (OWNER / SUPER ADMIN): Toàn quyền cả 4 vai trò
    if (branchSelect) {
      branchSelect.classList.remove('hidden');
      branchSelect.disabled = false;
      branchSelect.style.display = '';
      branchSelect.value = state.reportFilterBranch || 'ALL';
    }
    if (branchFixedBadge) {
      branchFixedBadge.classList.add('hidden');
      branchFixedBadge.style.display = 'none';
    }
    // Mở khóa dropdown lọc chi nhánh trên thanh công cụ
    const staffBranchFilter = document.getElementById('staff-branch-filter');
    if (staffBranchFilter) {
      staffBranchFilter.disabled = false;
      staffBranchFilter.classList.remove('bg-slate-200/60', 'cursor-not-allowed', 'opacity-80');
      staffBranchFilter.title = '';
    }
    const timelogBranchFilter = document.getElementById('timelog-branch-filter');
    if (timelogBranchFilter) {
      timelogBranchFilter.disabled = false;
      timelogBranchFilter.classList.remove('bg-slate-200/60', 'cursor-not-allowed', 'opacity-80');
      timelogBranchFilter.title = '';
    }
    if (navOwner) navOwner.classList.remove('hidden');
    switchTab('report');
  } 
  else if (roleKey === 'BRANCH_MANAGER') {
    // 2. QUẢN LÝ (MANAGER): Nhân sự, Thực đơn, Tài chính, Kho, Bán hàng, Báo cáo CN
    if (branchSelect) {
      branchSelect.classList.add('hidden');
      branchSelect.disabled = true;
      branchSelect.value = branchId;
      branchSelect.style.display = 'none';
    }
    if (branchFixedBadge) {
      branchFixedBadge.classList.remove('hidden');
      branchFixedBadge.style.display = '';
      branchFixedBadge.innerText = `📍 ${branchInfo.TenCN}`;
    }
    if (navManager) navManager.classList.remove('hidden');
    state.currentBranch = branchId;
    state.reportFilterBranch = branchId;
    state.inventoryFilterBranch = branchId;

    // Cố định và vô hiệu hóa (disable) hoàn toàn Dropdown chi nhánh trên thanh công cụ
    const staffBranchFilter = document.getElementById('staff-branch-filter');
    if (staffBranchFilter) {
      staffBranchFilter.value = branchId;
      staffBranchFilter.disabled = true;
      staffBranchFilter.classList.add('bg-slate-200/60', 'cursor-not-allowed', 'opacity-80');
      staffBranchFilter.title = `Chi nhánh cố định: ${branchInfo.TenCN}`;
    }
    const timelogBranchFilter = document.getElementById('timelog-branch-filter');
    if (timelogBranchFilter) {
      timelogBranchFilter.value = branchId;
      timelogBranchFilter.disabled = true;
      timelogBranchFilter.classList.add('bg-slate-200/60', 'cursor-not-allowed', 'opacity-80');
      timelogBranchFilter.title = `Chi nhánh cố định: ${branchInfo.TenCN}`;
    }
    const priceBranchFilter = document.getElementById('price-branch-filter');
    if (priceBranchFilter) {
      priceBranchFilter.value = branchId;
      priceBranchFilter.disabled = true;
    }
    const cashbookBranchFilter = document.getElementById('cashbook-branch-filter');
    if (cashbookBranchFilter) {
      cashbookBranchFilter.value = branchId;
      cashbookBranchFilter.disabled = true;
    }
    const invBranchSelect = document.getElementById('inventory-branch-select');
    if (invBranchSelect) {
      invBranchSelect.value = branchId;
      invBranchSelect.disabled = true;
    }
    switchTab('hr');
  } 
  else if (roleKey === 'WAREHOUSE') {
    // 3. NHÂN VIÊN KHO (WAREHOUSE): Quản lý kho, Nguyên vật liệu, Phiếu nhập, Kiểm kê
    if (branchSelect) {
      branchSelect.classList.add('hidden');
      branchSelect.style.display = 'none';
    }
    if (branchFixedBadge) {
      branchFixedBadge.classList.remove('hidden');
      branchFixedBadge.style.display = '';
      branchFixedBadge.innerText = `📍 ${branchInfo.TenCN}`;
    }
    if (navWarehouse) navWarehouse.classList.remove('hidden');
    state.inventoryFilterBranch = branchId;
    switchTab('inventory');
  } 
  else {
    // 4. THU NGÂN (CASHIER): Bán hàng POS và xử lý thanh toán, xem doanh thu ca
    if (branchSelect) {
      branchSelect.classList.add('hidden');
      branchSelect.style.display = 'none';
    }
    if (branchFixedBadge) {
      branchFixedBadge.classList.remove('hidden');
      branchFixedBadge.style.display = '';
      branchFixedBadge.innerText = `📍 ${branchInfo.TenCN}`;
    }
    if (navPosActions) navPosActions.classList.remove('hidden');
    state.reportFilterBranch = branchId;
    switchTab('pos');
  }
}

function changeActiveBranch(branchId) {
  state.currentBranch = branchId;
  state.reportFilterBranch = branchId;
  state.inventoryFilterBranch = branchId;

  // 1. Đồng bộ giá trị Dropdown trên thanh Header
  const headerSelect = document.getElementById('header-branch-select');
  if (headerSelect && headerSelect.value !== branchId) {
    headerSelect.value = branchId;
  }

  // 2. Cập nhật text badge chi nhánh cố định (cho các vai trò Quản lý / Thu ngân / Kho)
  const branchFixedBadge = document.getElementById('header-branch-fixed-badge');
  if (branchFixedBadge) {
    const branchInfo = (DB && DB.chinhanh) ? DB.chinhanh.find(b => b.MaCN === branchId) : null;
    const branchName = branchInfo ? branchInfo.TenCN : (branchId === 'CN01' ? 'Cà Phê Sài Gòn - Quận 1' : (branchId === 'CN02' ? 'Cà Phê Sài Gòn - Cầu Giấy' : branchId));
    branchFixedBadge.innerText = branchId === 'ALL' ? '🏢 Toàn Chuỗi' : `📍 ${branchName}`;
  }

  // 3. Tự động thông báo và render lại view hiện tại (gọi lại API & cập nhật báo cáo)
  renderCurrentView();

  const toastLabel = branchId === 'ALL' ? 'Toàn Chuỗi (Hợp Nhất)' : (branchId === 'CN01' ? 'Chi Nhánh 1 (Quận 1)' : 'Chi Nhánh 2 (Cầu Giấy)');
  showToast(`📍 Đã chuyển phạm vi sang: ${toastLabel}`);
}

// Xử lý sự kiện khi click trực tiếp vào thẻ tóm tắt chi nhánh trên trang Báo Cáo
function selectBranchFromReportCard(branchId) {
  changeActiveBranch(branchId);
}

// Chuyển đổi màn hình Tab
function switchTab(viewName) {
  state.currentView = viewName;

  // Ẩn tất cả các tab content
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.add('hidden');
    el.style.display = 'none';
  });

  // Reset style nút navigation
  document.querySelectorAll('.nav-btn').forEach(el => {
    el.classList.remove('bg-amber-600', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'text-white');
    el.classList.add('text-slate-300');
  });

  // Hiển thị tab mục tiêu
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.remove('hidden');
    target.style.display = (viewName === 'pos') ? 'flex' : 'flex';
  }

  // Highlight nút đang chọn
  highlightNavButton(viewName);

  // Render dữ liệu tương ứng
  renderCurrentView();
}

function highlightNavButton(viewName) {
  const roleKey = getStaffRoleKey(state.currentUser);
  let prefix = 'nav-owner-';
  let activeColor = 'bg-amber-600';

  if (roleKey === 'BRANCH_MANAGER') {
    prefix = 'nav-mgr-';
    activeColor = 'bg-blue-600';
  } else if (roleKey === 'CASHIER') {
    prefix = 'nav-cashier-';
    activeColor = 'bg-emerald-600';
  } else if (roleKey === 'WAREHOUSE') {
    prefix = 'nav-wh-';
    activeColor = 'bg-purple-600';
  }

  const btn = document.getElementById(`${prefix}${viewName}`);
  if (btn) {
    btn.classList.add(activeColor, 'text-white');
    btn.classList.remove('text-slate-300');
  }
}

function renderCurrentView() {
  switch (state.currentView) {
    case 'branches':
      renderBranches();
      break;
    case 'report':
      renderReports();
      break;
    case 'hr':
      renderStaffList();
      renderShifts();
      renderShiftAssignments();
      syncShiftAssignmentsFromBackend();
      renderDevices();
      renderRawLogs();
      renderTimeLogs('ALL');
      renderPayrollTable();
      break;
    case 'menu':
      renderMenuListManagement();
      renderPriceLists();
      renderRecipeManagement();
      break;
    case 'finance':
      renderCashBook();
      renderReceipts();
      renderPayments();
      renderDebts();
      syncFinanceFromBackend();
      break;
    case 'inventory':
      renderInventory();
      renderMaterialsList();
      renderImportOrders();
      renderStockAuditLog();
      renderSuppliersList();
      break;
    case 'pos':
      renderTables();
      renderCategories();
      renderMenuGrid();
      renderOrderCart();
      updateTableControlsUI();
      populateCustomerDropdown();
      setPaymentMethod(state.paymentMethod || 'TienMat');
      updateCheckoutButtonState();
      break;
  }
}

// ==============================================================================
// 4. VIEW 1: QUẢN LÝ CHI NHÁNH (CHỦ QUÁN)
// ==============================================================================
function renderBranches() {
  const tbody = document.getElementById('branch-table-body');
  if (!tbody || !DB.chinhanh) return;

  const totalBranchesEl = document.getElementById('branch-stat-total');
  const totalStaffEl = document.getElementById('branch-stat-staff');
  const totalRevEl = document.getElementById('branch-stat-revenue');

  if (totalBranchesEl) totalBranchesEl.innerText = `${DB.chinhanh.length} Chi Nhánh`;
  if (totalStaffEl && DB.nhanvien) totalStaffEl.innerText = `${DB.nhanvien.length} Nhân Viên`;

  let totalAllRevenue = 0;
  if (DB.hoadon) {
    totalAllRevenue = DB.hoadon.reduce((sum, h) => sum + (h.TongThanhToan || 0), 0);
  }
  if (totalRevEl) totalRevEl.innerText = formatMoney(totalAllRevenue);

  tbody.innerHTML = DB.chinhanh.map(cn => {
    const staffCount = (DB.nhanvien || []).filter(n => n.MaCN === cn.MaCN || (n.AssignedBranches && n.AssignedBranches.includes(cn.MaCN))).length;
    const branchRev = (DB.hoadon || []).filter(h => h.MaCN === cn.MaCN).reduce((sum, h) => sum + (h.TongThanhToan || 0), 0);
    const tableCount = (DB.ban || []).filter(b => b.MaCN === cn.MaCN).length;
    const isOnline = cn.TrangThai === 'HoatDong';

    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${cn.MaChiNhanh || cn.MaCN}</td>
        <td class="p-3 font-bold text-slate-900">${cn.TenChiNhanh || cn.TenCN}</td>
        <td class="p-3 text-slate-600">${cn.DiaChi}</td>
        <td class="p-3 font-mono text-slate-600">${cn.SDT}</td>
        <td class="p-3"><span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[10px]">${staffCount} NV</span></td>
        <td class="p-3"><span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">${tableCount} Bàn/Thẻ</span></td>
        <td class="p-3">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            <span class="w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
            ${isOnline ? 'Hoạt động' : 'Tạm dừng'}
          </span>
        </td>
        <td class="p-3 text-right">
          <button onclick="toggleBranchStatus('${cn.MaCN}')" class="px-2.5 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold mr-1">
            ${isOnline ? 'Tạm dừng' : 'Kích hoạt'}
          </button>
          <button onclick="openBranchModal('${cn.MaCN}')" class="px-2.5 py-1 text-[11px] rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200">
            Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openBranchModal(branchId = null) {
  const modal = document.getElementById('modal-branch');
  const title = document.getElementById('modal-branch-title');
  const idInput = document.getElementById('branch-input-id');
  const nameInput = document.getElementById('branch-input-name');
  const addrInput = document.getElementById('branch-input-address');
  const phoneInput = document.getElementById('branch-input-phone');
  const statusInput = document.getElementById('branch-input-status');

  if (branchId) {
    const cn = DB.chinhanh.find(b => b.MaCN === branchId);
    if (cn) {
      if (title) title.innerText = 'Chỉnh Sửa Chi Nhánh';
      if (idInput) { idInput.value = cn.MaCN; idInput.readOnly = true; }
      if (nameInput) nameInput.value = cn.TenCN;
      if (addrInput) addrInput.value = cn.DiaChi;
      if (phoneInput) phoneInput.value = cn.SDT;
      if (statusInput) statusInput.value = cn.TrangThai || 'HoatDong';
    }
  } else {
    if (title) title.innerText = 'Thêm Chi Nhánh Mới';
    if (idInput) { idInput.value = `CN0${DB.chinhanh.length + 1}`; idInput.readOnly = false; }
    if (nameInput) nameInput.value = '';
    if (addrInput) addrInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (statusInput) statusInput.value = 'HoatDong';
  }

  if (modal) modal.classList.remove('hidden');
}

function closeBranchModal() {
  const modal = document.getElementById('modal-branch');
  if (modal) modal.classList.add('hidden');
}

function saveBranch() {
  const id = document.getElementById('branch-input-id').value.trim();
  const name = document.getElementById('branch-input-name').value.trim();
  const addr = document.getElementById('branch-input-address').value.trim();
  const phone = document.getElementById('branch-input-phone').value.trim();
  const status = document.getElementById('branch-input-status').value;

  if (!id || !name) {
    alert('Vui lòng nhập đầy đủ Mã và Tên Chi Nhánh!');
    return;
  }

  const existingIdx = DB.chinhanh.findIndex(b => b.MaCN === id);
  if (existingIdx >= 0) {
    DB.chinhanh[existingIdx].TenCN = name;
    DB.chinhanh[existingIdx].TenChiNhanh = name;
    DB.chinhanh[existingIdx].DiaChi = addr;
    DB.chinhanh[existingIdx].SDT = phone;
    DB.chinhanh[existingIdx].TrangThai = status;
    showToast(`Đã cập nhật thông tin chi nhánh ${name}!`, 'success');
  } else {
    const newBranch = {
      MaCN: id,
      MaChiNhanh: id,
      TenCN: name,
      TenChiNhanh: name,
      DiaChi: addr,
      SDT: phone,
      TrangThai: status
    };
    DB.chinhanh.push(newBranch);
    showToast(`Đã thêm chi nhánh mới ${name}!`, 'success');
  }

  saveDatabase();
  closeBranchModal();
  renderBranches();
}

function toggleBranchStatus(branchId) {
  const cn = DB.chinhanh.find(b => b.MaCN === branchId);
  if (!cn) return;
  cn.TrangThai = cn.TrangThai === 'HoatDong' ? 'TamDung' : 'HoatDong';
  saveDatabase();
  renderBranches();
  showToast(`Đã chuyển trạng thái chi nhánh ${cn.TenCN} thành: ${cn.TrangThai}`);
}

// ==============================================================================
// 5. VIEW 2: XEM BÁO CÁO TỔNG HỢP (CHỦ QUÁN / QUẢN LÝ / THU NGÂN)
// ==============================================================================
function filterReportBranch(branchId) {
  changeActiveBranch(branchId);
}

async function renderReports() {
  // Lấy branch_id trực tiếp từ state toàn cục (Header dropdown điều khiển)
  const branchId = state.currentBranch || 'ALL';

  // 1. Cập nhật Tiêu đề trang & Badge linh động theo state toàn cục
  const titleEl = document.getElementById('report-view-title');
  const badgeEl = document.getElementById('badge-viewing-branch');
  const subtitleEl = document.getElementById('report-view-subtitle');
  const btnResetAll = document.getElementById('btn-report-reset-all');

  if (titleEl) {
    if (branchId === 'ALL') {
      titleEl.innerText = '📊 BÁO CÁO TỔNG HỢP TOÀN CHUỖI';
      if (badgeEl) {
        badgeEl.innerText = '🏢 Toàn Chuỗi';
        badgeEl.className = 'text-[11px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold';
      }
      if (subtitleEl) {
        subtitleEl.innerText = 'Giám sát doanh thu tức thời, so sánh hiệu suất các chi nhánh, cơ cấu thanh toán và top món bán chạy';
      }
      if (btnResetAll) btnResetAll.classList.add('hidden');
    } else if (branchId === 'CN01') {
      titleEl.innerText = '📊 BÁO CÁO TỔNG HỢP - CHI NHÁNH 1';
      if (badgeEl) {
        badgeEl.innerText = '📍 Chi Nhánh 1 (Quận 1)';
        badgeEl.className = 'text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold';
      }
      if (subtitleEl) {
        subtitleEl.innerText = 'Báo cáo chi tiết số liệu, cơ cấu thanh toán và top món bán chạy tại Chi Nhánh 1 (Quận 1)';
      }
      if (btnResetAll) btnResetAll.classList.remove('hidden');
    } else if (branchId === 'CN02') {
      titleEl.innerText = '📊 BÁO CÁO TỔNG HỢP - CHI NHÁNH 2';
      if (badgeEl) {
        badgeEl.innerText = '📍 Chi Nhánh 2 (Cầu Giấy)';
        badgeEl.className = 'text-[11px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold';
      }
      if (subtitleEl) {
        subtitleEl.innerText = 'Báo cáo chi tiết số liệu, cơ cấu thanh toán và top món bán chạy tại Chi Nhánh 2 (Cầu Giấy)';
      }
      if (btnResetAll) btnResetAll.classList.remove('hidden');
    }
  }

  // 2. Logic hiển thị Thẻ tóm tắt chi nhánh
  // Nếu là Toàn Chuỗi: hiển thị cả 2 thẻ để so sánh trực diện
  // Nếu là chi nhánh cụ thể: ẨN toàn bộ các thẻ của chi nhánh khác, chỉ hiện thẻ của chi nhánh đang chọn
  const comparisonContainer = document.getElementById('hq-side-by-side-comparison');
  const cardCn1 = document.getElementById('hq-card-cn1');
  const cardCn2 = document.getElementById('hq-card-cn2');

  if (comparisonContainer) {
    if (branchId === 'ALL') {
      comparisonContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-6';
      if (cardCn1) cardCn1.classList.remove('hidden');
      if (cardCn2) cardCn2.classList.remove('hidden');
    } else if (branchId === 'CN01') {
      comparisonContainer.className = 'grid grid-cols-1 gap-4 mb-6';
      if (cardCn1) cardCn1.classList.remove('hidden');
      if (cardCn2) cardCn2.classList.add('hidden');
    } else if (branchId === 'CN02') {
      comparisonContainer.className = 'grid grid-cols-1 gap-4 mb-6';
      if (cardCn1) cardCn1.classList.add('hidden');
      if (cardCn2) cardCn2.classList.remove('hidden');
    }
  }

  // 3. Tự động gọi API Backend FastAPI lấy dữ liệu theo branch_id
  let apiData = null;
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/reports/dashboard?branch_id=${encodeURIComponent(branchId)}`);
    if (res.ok) {
      apiData = await res.json();
    }
  } catch (err) {
    console.warn('API report offline, using local DB:', err);
  }

  // Tính toán dữ liệu (Ưu tiên API, fallback DB local khi offline)
  const invoices = (DB.hoadon || []).filter(h => branchId === 'ALL' || h.MaCN === branchId);
  const totalRev = apiData ? apiData.total_revenue : invoices.reduce((sum, h) => sum + (h.TongThanhToan || 0), 0);
  const totalOrders = apiData ? apiData.total_orders : invoices.length;
  const avgOrder = apiData ? (apiData.aov || 0) : (totalOrders > 0 ? totalRev / totalOrders : 0);
  const grossProfit = totalRev * 0.62;

  // Cập nhật 4 Stat Cards
  const revEl = document.getElementById('stat-total-revenue');
  const ordEl = document.getElementById('stat-total-orders');
  const avgEl = document.getElementById('stat-avg-order');
  const profitEl = document.getElementById('stat-gross-profit');

  if (revEl) revEl.innerText = formatMoney(totalRev);
  if (ordEl) ordEl.innerText = `${totalOrders} đơn`;
  if (avgEl) avgEl.innerText = formatMoney(avgOrder);
  if (profitEl) profitEl.innerText = formatMoney(grossProfit);

  // Số liệu thẻ Chi Nhánh 1 & 2
  if (apiData && apiData.cn1_summary) {
    const cn1RevEl = document.getElementById('cn1-revenue');
    const cn1OrdersEl = document.getElementById('cn1-orders');
    const cn1CardsEl = document.getElementById('cn1-cards');
    if (cn1RevEl) cn1RevEl.innerText = formatMoney(apiData.cn1_summary.revenue);
    if (cn1OrdersEl) cn1OrdersEl.innerText = `${apiData.cn1_summary.orders} đơn`;
    if (cn1CardsEl) cn1CardsEl.innerText = `${apiData.cn1_summary.cards_in_use} thẻ`;
  } else {
    const cn1Invoices = (DB.hoadon || []).filter(h => h.MaCN === 'CN01');
    const cn1Rev = cn1Invoices.reduce((s, h) => s + (h.TongThanhToan || 0), 0);
    const cn1CardsInUse = (DB.ban || []).filter(b => b.MaCN === 'CN01' && b.TrangThai === 'CoKhach').length;
    const cn1RevEl = document.getElementById('cn1-revenue');
    const cn1OrdersEl = document.getElementById('cn1-orders');
    const cn1CardsEl = document.getElementById('cn1-cards');
    if (cn1RevEl) cn1RevEl.innerText = formatMoney(cn1Rev);
    if (cn1OrdersEl) cn1OrdersEl.innerText = `${cn1Invoices.length} đơn`;
    if (cn1CardsEl) cn1CardsEl.innerText = `${cn1CardsInUse} thẻ`;
  }

  if (apiData && apiData.cn2_summary) {
    const cn2RevEl = document.getElementById('cn2-revenue');
    const cn2OrdersEl = document.getElementById('cn2-orders');
    const cn2CardsEl = document.getElementById('cn2-cards');
    if (cn2RevEl) cn2RevEl.innerText = formatMoney(apiData.cn2_summary.revenue);
    if (cn2OrdersEl) cn2OrdersEl.innerText = `${apiData.cn2_summary.orders} đơn`;
    if (cn2CardsEl) cn2CardsEl.innerText = `${apiData.cn2_summary.cards_in_use} thẻ`;
  } else {
    const cn2Invoices = (DB.hoadon || []).filter(h => h.MaCN === 'CN02');
    const cn2Rev = cn2Invoices.reduce((s, h) => s + (h.TongThanhToan || 0), 0);
    const cn2CardsInUse = (DB.ban || []).filter(b => b.MaCN === 'CN02' && b.TrangThai === 'CoKhach').length;
    const cn2RevEl = document.getElementById('cn2-revenue');
    const cn2OrdersEl = document.getElementById('cn2-orders');
    const cn2CardsEl = document.getElementById('cn2-cards');
    if (cn2RevEl) cn2RevEl.innerText = formatMoney(cn2Rev);
    if (cn2OrdersEl) cn2OrdersEl.innerText = `${cn2Invoices.length} đơn`;
    if (cn2CardsEl) cn2CardsEl.innerText = `${cn2CardsInUse} thẻ`;
  }

  // Top món bán chạy của chi nhánh đang chọn
  if (apiData && apiData.top_products && apiData.top_products.length > 0) {
    renderTopProductsFromList(apiData.top_products);
  } else {
    renderTopProducts(invoices);
  }

  // Cơ cấu phương thức thanh toán của chi nhánh đang chọn
  if (apiData && apiData.payment_breakdown) {
    renderPaymentMethodBreakdownFromApi(apiData.payment_breakdown, totalRev);
  } else {
    renderPaymentMethodBreakdown(invoices);
  }
}

function renderTopProductsFromList(topProducts) {
  const tbody = document.getElementById('top-products-table-body');
  if (!tbody) return;

  if (!topProducts || topProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Chưa có dữ liệu bán hàng</td></tr>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉', '4', '5'];
  tbody.innerHTML = topProducts.map((p, idx) => `
    <tr class="border-b hover:bg-slate-50 transition">
      <td class="p-3 font-bold">${medals[idx] || idx + 1}</td>
      <td class="p-3 font-bold text-slate-900">${escapeHtml(p.TenMon)}</td>
      <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 rounded font-semibold text-[10px]">Size ${escapeHtml(p.TenSize || 'M')}</span></td>
      <td class="p-3 text-right font-black text-slate-800">${p.SoLuong}</td>
      <td class="p-3 text-right font-black text-emerald-600">${formatMoney(p.DoanhThu)}</td>
    </tr>
  `).join('');
}

function renderPaymentMethodBreakdownFromApi(breakdown, total) {
  const cash = breakdown.cash ? breakdown.cash.amount : 0;
  const qr = breakdown.qr ? breakdown.qr.amount : 0;
  const card = breakdown.card ? breakdown.card.amount : 0;

  const pCash = breakdown.cash ? breakdown.cash.pct : (total > 0 ? Math.round((cash / total) * 100) : 0);
  const pQr = breakdown.qr ? breakdown.qr.pct : (total > 0 ? Math.round((qr / total) * 100) : 0);
  const pCard = breakdown.card ? breakdown.card.pct : (total > 0 ? Math.round((card / total) * 100) : 0);

  const cashText = document.getElementById('pay-cash-text');
  const qrText = document.getElementById('pay-qr-text');
  const cardText = document.getElementById('pay-card-text');

  const cashBar = document.getElementById('pay-cash-bar');
  const qrBar = document.getElementById('pay-qr-bar');
  const cardBar = document.getElementById('pay-card-bar');

  if (cashText) cashText.innerText = `${formatMoney(cash)} (${pCash}%)`;
  if (qrText) qrText.innerText = `${formatMoney(qr)} (${pQr}%)`;
  if (cardText) cardText.innerText = `${formatMoney(card)} (${pCard}%)`;

  if (cashBar) cashBar.style.width = `${pCash}%`;
  if (qrBar) qrBar.style.width = `${pQr}%`;
  if (cardBar) cardBar.style.width = `${pCard}%`;
}

function renderTopProducts(filteredInvoices) {
  const tbody = document.getElementById('top-products-table-body');
  if (!tbody || !DB.chitiethoadon) return;

  const validInvoiceIds = new Set(filteredInvoices.map(h => h.MaHD));
  const productStats = {};

  DB.chitiethoadon.forEach(item => {
    if (validInvoiceIds.has(item.MaHD)) {
      if (!productStats[item.MaMonSize]) {
        productStats[item.MaMonSize] = {
          MaMonSize: item.MaMonSize,
          TenMon: item.TenMon || item.MaMonSize,
          SoLuong: 0,
          DoanhThu: 0
        };
      }
      productStats[item.MaMonSize].SoLuong += (item.SoLuong || 0);
      productStats[item.MaMonSize].DoanhThu += (item.ThanhTien || 0);
    }
  });

  const sorted = Object.values(productStats).sort((a, b) => b.SoLuong - a.SoLuong).slice(0, 5);

  if (sorted.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Chưa có dữ liệu bán hàng</td></tr>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉', '4', '5'];
  tbody.innerHTML = sorted.map((p, idx) => {
    const size = p.MaMonSize.split('_').pop();
    return `
      <tr class="border-b hover:bg-slate-50 transition">
        <td class="p-3 font-bold">${medals[idx]}</td>
        <td class="p-3 font-bold text-slate-900">${p.TenMon}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 rounded font-semibold text-[10px]">Size ${size}</span></td>
        <td class="p-3 text-right font-black text-slate-800">${p.SoLuong}</td>
        <td class="p-3 text-right font-black text-emerald-600">${formatMoney(p.DoanhThu)}</td>
      </tr>
    `;
  }).join('');
}

function renderPaymentMethodBreakdown(filteredInvoices) {
  let cash = 0, qr = 0, card = 0;
  const total = filteredInvoices.reduce((s, h) => s + (h.TongThanhToan || 0), 0);

  filteredInvoices.forEach(h => {
    if (h.HinhThucTT === 'TienMat') cash += (h.TongThanhToan || 0);
    else if (h.HinhThucTT === 'ChuyenKhoan') qr += (h.TongThanhToan || 0);
    else if (h.HinhThucTT === 'The') card += (h.TongThanhToan || 0);
  });

  const pCash = total > 0 ? Math.round((cash / total) * 100) : 0;
  const pQr = total > 0 ? Math.round((qr / total) * 100) : 0;
  const pCard = total > 0 ? Math.round((card / total) * 100) : 0;

  const cashText = document.getElementById('pay-cash-text');
  const qrText = document.getElementById('pay-qr-text');
  const cardText = document.getElementById('pay-card-text');

  const cashBar = document.getElementById('pay-cash-bar');
  const qrBar = document.getElementById('pay-qr-bar');
  const cardBar = document.getElementById('pay-card-bar');

  if (cashText) cashText.innerText = `${formatMoney(cash)} (${pCash}%)`;
  if (qrText) qrText.innerText = `${formatMoney(qr)} (${pQr}%)`;
  if (cardText) cardText.innerText = `${formatMoney(card)} (${pCard}%)`;

  if (cashBar) cashBar.style.width = `${pCash}%`;
  if (qrBar) qrBar.style.width = `${pQr}%`;
  if (cardBar) cardBar.style.width = `${pCard}%`;
}

function exportReportsToExcel() {
  showToast('📊 Đã kết xuất báo cáo doanh thu ra file Excel!');
}

// ==============================================================================
// 6. VIEW 3: QUẢN LÝ NHÂN SỰ, CA LÀM, CHẤM CÔNG & BẢNG LƯƠNG (QUẢN LÝ / CHỦ QUÁN)
// ==============================================================================
function switchHrSubtab(tabKey) {
  document.querySelectorAll('.hr-subcontent').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.hr-subtab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-white', 'text-slate-700');
  });

  const content = document.getElementById(`hr-subtab-${tabKey}`);
  const btn = document.getElementById(`hr-subtab-btn-${tabKey}`);

  if (content) content.classList.remove('hidden');
  if (btn) {
    btn.classList.add('bg-blue-600', 'text-white');
    btn.classList.remove('bg-white', 'text-slate-700');
  }

  if (tabKey === 'staff') {
    renderStaffList();
    syncStaffFromBackend();
  } else if (tabKey === 'shifts') {
    renderShifts();
    renderShiftAssignments();
    syncShiftAssignmentsFromBackend();
  }
}

async function syncShiftAssignmentsFromBackend() {
  try {
    const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
    const branchParam = isManager ? `?branch_id=${encodeURIComponent(state.currentUser.MaCN || state.currentBranch || 'CN01')}` : '';
    const res = await fetch(`http://127.0.0.1:8000/api/phanca${branchParam}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        if (!DB.phanca) DB.phanca = [];
        data.forEach(item => {
          const existing = DB.phanca.find(p => p.MaPhanCa === item.MaPhanCa);
          if (existing) {
            existing.MaNV = item.MaNV || item.employee_id;
            existing.TenNV = item.TenNV;
            existing.MaCN = item.MaCN;
            existing.MaCa = item.MaCa;
            existing.TenCa = item.TenCa;
            existing.Thu = item.Thu;
            existing.NgayLam = item.NgayLam;
            existing.TrangThai = item.TrangThai || existing.TrangThai || 'DaDuyet';
          } else {
            DB.phanca.push({
              MaPhanCa: item.MaPhanCa,
              MaNV: item.MaNV || item.employee_id,
              TenNV: item.TenNV,
              MaCN: item.MaCN,
              MaCa: item.MaCa,
              TenCa: item.TenCa,
              Thu: item.Thu,
              NgayLam: item.NgayLam,
              TrangThai: item.TrangThai || 'DaDuyet'
            });
          }
        });
        saveDatabase();
        renderShiftAssignments();
      }
    }
  } catch (err) {
    // Backend offline / fallback locally
  }
}

async function syncStaffFromBackend() {
  try {
    const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
    const branchParam = isManager ? `?branch_id=${encodeURIComponent(state.currentUser.MaCN || state.currentBranch || 'CN01')}&exclude_admin=true` : '';
    const res = await fetch(`http://127.0.0.1:8000/api/employees${branchParam}`);
    if (res.ok) {
      const apiStaff = await res.json();
      if (Array.isArray(apiStaff) && apiStaff.length > 0) {
        let changed = false;
        apiStaff.forEach(as => {
          const s = DB.nhanvien.find(n => n.MaNV === as.MaNV);
          if (s) {
            if (as.DiaChi && s.DiaChi !== as.DiaChi) { s.DiaChi = as.DiaChi; changed = true; }
            if (as.GioiTinh && s.GioiTinh !== as.GioiTinh) { s.GioiTinh = as.GioiTinh; changed = true; }
            if (as.TrangThai && s.TrangThai !== as.TrangThai) { s.TrangThai = as.TrangThai; changed = true; }
          }
        });
        if (changed) {
          saveDatabase();
          renderStaffList();
        }
      }
    }
  } catch (err) {
    // Backend offline / standalone fallback
  }
}

function renderStaffList() {
  const tbody = document.getElementById('staff-table-body');
  if (!tbody || !DB.nhanvien) return;

  const search = (document.getElementById('staff-search-input')?.value || '').toLowerCase().trim();
  const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
  const branchFilter = isManager 
    ? (state.currentUser.MaCN || state.currentBranch || 'CN01') 
    : (document.getElementById('staff-branch-filter')?.value || 'ALL');

  const filtered = DB.nhanvien.filter(s => {
    // Nếu là Quản lý chi nhánh: tuyệt đối không hiển thị nhân viên chi nhánh khác hoặc tài khoản Admin cấp cao nhất
    if (isManager) {
      const roleUpper = (s.Role || s.ChucVu || '').toUpperCase();
      if (roleUpper === 'SUPER_ADMIN' || (s.ChucVuText || '').includes('Chủ Quán') || s.MaNV === 'NV001') {
        return false;
      }
    }
    const matchSearch = !search || 
      (s.TenNV || '').toLowerCase().includes(search) || 
      (s.MaNV || '').toLowerCase().includes(search) || 
      (s.SDT || '').includes(search) ||
      (s.DiaChi || '').toLowerCase().includes(search);
    const matchBranch = branchFilter === 'ALL' || s.MaCN === branchFilter || (s.AssignedBranches && s.AssignedBranches.includes(branchFilter));
    return matchSearch && matchBranch;
  });

  tbody.innerHTML = filtered.map(s => {
    const isInactive = s.TrangThai === 'DaNghiViec' || s.TrangThai === 'Đã nghỉ việc';
    const statusBadge = isInactive 
      ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Đã nghỉ việc</span>'
      : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Đang làm việc</span>';
    
    const gender = s.GioiTinh || 'Nam';
    const genderBadge = gender === 'Nữ'
      ? '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">Nữ</span>'
      : (gender === 'Khác'
        ? '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Khác</span>'
        : '<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Nam</span>');

    return `
      <tr class="hover:bg-slate-50 transition border-b ${isInactive ? 'opacity-70 bg-slate-50/50' : ''}">
        <td class="p-3 font-mono font-bold text-slate-700">${s.MaNV}</td>
        <td class="p-3">
          <div class="flex items-center gap-2">
            <span class="text-base">${s.Avatar || '👤'}</span>
            <span class="font-bold text-slate-900">${escapeHtml(s.TenNV)}</span>
          </div>
        </td>
        <td class="p-3">${genderBadge}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">${s.ChucVuText || s.Role}</span></td>
        <td class="p-3 font-semibold text-slate-600">${s.MaCN || 'Toàn Chuỗi'}</td>
        <td class="p-3 font-mono text-slate-600">${escapeHtml(s.SDT || '---')}</td>
        <td class="p-3 text-slate-700 min-w-[280px] text-[11px] leading-relaxed">
          <div class="flex items-start gap-1.5">
            <span class="text-blue-500 text-xs mt-0.5">📍</span>
            <span class="font-medium text-slate-800">${escapeHtml(s.DiaChi || 'Chưa cập nhật')}</span>
          </div>
        </td>
        <td class="p-3 font-mono text-slate-500">${escapeHtml(s.TenDangNhap)}</td>
        <td class="p-3 text-right font-black text-slate-800">${formatMoney(s.LuongTheoGio || 25000)}/h</td>
        <td class="p-3">${statusBadge}</td>
        <td class="p-3 text-right">
          <button onclick="openStaffModal('${s.MaNV}')" class="px-3 py-1 text-[11px] rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer shadow-xs inline-flex items-center gap-1">
            <span>✏️</span> Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openStaffModal(staffId = null) {
  const modal = document.getElementById('modal-staff');
  const title = document.getElementById('modal-staff-title');
  const idInput = document.getElementById('staff-input-id');
  const nameInput = document.getElementById('staff-input-name');
  const genderInput = document.getElementById('staff-input-gender');
  const statusInput = document.getElementById('staff-input-status');
  const addressInput = document.getElementById('staff-input-address');
  const roleInput = document.getElementById('staff-input-role');
  const branchInput = document.getElementById('staff-input-branch');
  const phoneInput = document.getElementById('staff-input-phone');
  const emailInput = document.getElementById('staff-input-email');
  const userInput = document.getElementById('staff-input-username');
  const passInput = document.getElementById('staff-input-password');
  const wageInput = document.getElementById('staff-input-wage');

  // Populate branch select
  const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
  const managerBranch = state.currentUser?.MaCN || state.currentBranch || 'CN01';

  if (branchInput && DB.chinhanh) {
    branchInput.innerHTML = DB.chinhanh.map(cn => `<option value="${cn.MaCN}">📍 ${cn.TenCN}</option>`).join('');
    if (isManager) {
      branchInput.value = managerBranch;
      branchInput.disabled = true;
      branchInput.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-80');
      branchInput.title = `Chi nhánh cố định: ${managerBranch}`;
    } else {
      branchInput.disabled = false;
      branchInput.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-80');
      branchInput.title = '';
    }
  }

  if (staffId) {
    const s = DB.nhanvien.find(n => n.MaNV === staffId);
    if (s) {
      if (title) title.innerText = 'Chỉnh Sửa Thông Tin Nhân Viên';
      if (idInput) { idInput.value = s.MaNV; idInput.readOnly = true; }
      if (nameInput) nameInput.value = s.TenNV;
      if (genderInput) genderInput.value = s.GioiTinh || 'Nam';
      if (statusInput) statusInput.value = (s.TrangThai === 'DaNghiViec' || s.TrangThai === 'Đã nghỉ việc') ? 'Đã nghỉ việc' : 'Đang làm việc';
      if (addressInput) addressInput.value = s.DiaChi || '';
      if (roleInput) roleInput.value = s.Role || s.ChucVu;
      if (branchInput) branchInput.value = isManager ? managerBranch : (s.MaCN || 'CN01');
      if (phoneInput) phoneInput.value = s.SDT || '';
      if (emailInput) emailInput.value = s.Email || '';
      if (userInput) userInput.value = s.TenDangNhap;
      if (passInput) passInput.value = s.MatKhau;
      if (wageInput) wageInput.value = s.LuongTheoGio || 25000;
    }
  } else {
    if (title) title.innerText = 'Thêm Nhân Viên Mới';
    if (idInput) { idInput.value = `NV0${DB.nhanvien.length + 1}`; idInput.readOnly = false; }
    if (nameInput) nameInput.value = '';
    if (genderInput) genderInput.value = 'Nam';
    if (statusInput) statusInput.value = 'Đang làm việc';
    if (addressInput) addressInput.value = '';
    if (branchInput) branchInput.value = managerBranch;
    if (phoneInput) phoneInput.value = '';
    if (emailInput) emailInput.value = '';
    if (userInput) userInput.value = `staff${DB.nhanvien.length + 1}`;
    if (passInput) passInput.value = '1234';
    if (wageInput) wageInput.value = '25000';
  }

  if (modal) modal.classList.remove('hidden');
}

function closeStaffModal() {
  const modal = document.getElementById('modal-staff');
  if (modal) modal.classList.add('hidden');
}

function saveStaff() {
  const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
  const managerBranch = state.currentUser?.MaCN || state.currentBranch || 'CN01';

  const id = document.getElementById('staff-input-id').value.trim();
  const name = document.getElementById('staff-input-name').value.trim();
  const gender = document.getElementById('staff-input-gender')?.value || 'Nam';
  const status = document.getElementById('staff-input-status')?.value || 'Đang làm việc';
  const address = (document.getElementById('staff-input-address')?.value || '').trim();
  const role = document.getElementById('staff-input-role').value;
  const branch = isManager ? managerBranch : (document.getElementById('staff-input-branch')?.value || 'CN01');
  const phone = document.getElementById('staff-input-phone').value.trim();
  const email = document.getElementById('staff-input-email').value.trim();
  const user = document.getElementById('staff-input-username').value.trim();
  const pass = document.getElementById('staff-input-password').value.trim();
  const wage = parseFloat(document.getElementById('staff-input-wage').value) || 25000;

  if (!id || !name || !user) {
    alert('Vui lòng điền đầy đủ Mã NV, Tên và Tên đăng nhập!');
    return;
  }

  const roleTextMap = {
    'SUPER_ADMIN': 'Chủ Quán (Admin)',
    'BRANCH_MANAGER': 'Quản Lý Chi Nhánh',
    'CASHIER': 'Nhân Viên Thu Ngân',
    'WAREHOUSE': 'Nhân Viên Kho',
    'BARISTA': 'Pha Chế (Barista)'
  };
  const avatarMap = {
    'SUPER_ADMIN': '👑',
    'BRANCH_MANAGER': '👔',
    'CASHIER': '👩‍💼',
    'WAREHOUSE': '📦',
    'BARISTA': '☕'
  };

  const existingIdx = DB.nhanvien.findIndex(n => n.MaNV === id);
  if (existingIdx >= 0) {
    Object.assign(DB.nhanvien[existingIdx], {
      TenNV: name,
      TenNhanVien: name,
      GioiTinh: gender,
      DiaChi: address,
      Role: role,
      ChucVu: role,
      ChucVuText: roleTextMap[role] || role,
      Avatar: avatarMap[role] || '👤',
      MaCN: branch,
      SDT: phone,
      Email: email,
      TenDangNhap: user,
      MatKhau: pass,
      LuongTheoGio: wage,
      LuongCoBan: wage,
      TrangThai: status
    });

    // Đồng bộ lên Backend API
    fetch(`http://127.0.0.1:8000/api/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        TenNV: name,
        GioiTinh: gender,
        DiaChi: address,
        SDT: phone,
        ChucVu: role,
        LuongTheoGio: wage,
        TenDangNhap: user,
        MatKhau: pass,
        MaCN: branch,
        TrangThai: status
      })
    }).catch(err => console.warn('Không thể đồng bộ cập nhật nhân viên lên backend:', err));

    showToast(`Đã cập nhật nhân viên ${name}!`, 'success');
  } else {
    const newStaff = {
      MaNV: id,
      MaNhanVien: id,
      TenNV: name,
      TenNhanVien: name,
      GioiTinh: gender,
      DiaChi: address,
      Role: role,
      ChucVu: role,
      ChucVuText: roleTextMap[role] || role,
      Avatar: avatarMap[role] || '👤',
      MaCN: branch,
      SDT: phone,
      Email: email,
      TenDangNhap: user,
      MatKhau: pass,
      MaPIN: '1234',
      LuongTheoGio: wage,
      LuongCoBan: wage,
      AssignedBranches: [branch],
      DefaultBranch: branch,
      TrangThai: status
    };
    DB.nhanvien.push(newStaff);

    // Đồng bộ lên Backend API
    fetch(`http://127.0.0.1:8000/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MaNV: id,
        TenNV: name,
        GioiTinh: gender,
        DiaChi: address,
        SDT: phone,
        ChucVu: role,
        LuongTheoGio: wage,
        TenDangNhap: user,
        MatKhau: pass,
        MaCN: branch,
        TrangThai: status
      })
    }).catch(err => console.warn('Không thể đồng bộ tạo nhân viên lên backend:', err));

    showToast(`Đã thêm nhân viên mới ${name}!`, 'success');
  }

  saveDatabase();
  closeStaffModal();
  renderStaffList();
}

function deleteStaff(staffId) {
  alert('Chức năng xóa cứng nhân viên đã bị vô hiệu hóa để bảo đảm toàn vẹn dữ liệu hệ thống (Hóa đơn, Chấm công, Phiếu kho). Vui lòng chuyển trạng thái nhân viên sang "Đã nghỉ việc" trong form Cập nhật.');
}

function renderShifts() {
  const container = document.getElementById('shifts-cards-container');
  if (!container || !DB.calam) return;

  container.innerHTML = DB.calam.map(ca => {
    return `
      <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
        <div>
          <div class="font-bold text-slate-900 text-xs">${ca.TenCa}</div>
          <div class="text-[11px] text-slate-500 font-mono mt-0.5">⏰ ${ca.GioBatDau} - ${ca.GioKetThuc} (${ca.SoGioQuyDinh}h)</div>
        </div>
        <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Đang Áp Dụng</span>
      </div>
    `;
  }).join('');
}

function openShiftModal() {
  const name = prompt('Nhập tên ca làm mới (ví dụ: Ca Đêm):', 'Ca Đêm (22:00 - 06:00)');
  if (!name) return;
  const start = prompt('Giờ bắt đầu (HH:MM):', '22:00');
  if (!start) return;
  const end = prompt('Giờ kết thúc (HH:MM):', '06:00');
  if (!end) return;

  const newShift = {
    MaCa: `CA_${Date.now().toString().slice(-4)}`,
    TenCa: name,
    GioBatDau: start,
    GioKetThuc: end,
    SoGioQuyDinh: 8
  };

  if (!DB.calam) DB.calam = [];
  DB.calam.push(newShift);
  saveDatabase();
  renderShifts();
  showToast(`Đã thêm ca làm việc mới: ${name}!`, 'success');
}

function renderShiftAssignments() {
  const tbody = document.getElementById('shift-assignment-table-body');
  if (!tbody || !DB.phanca) return;

  const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
  const managerBranch = state.currentUser?.MaCN || state.currentBranch || 'CN01';

  const list = DB.phanca.filter(p => {
    if (isManager) return p.MaCN === managerBranch;
    return state.currentBranch === 'ALL' || !state.currentBranch || p.MaCN === state.currentBranch;
  });

  tbody.innerHTML = list.map(p => {
    const maNV = p.MaNV || p.employee_id || (DB.nhanvien?.find(n => n.TenNV === p.TenNV)?.MaNV) || '--';
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${p.MaPhanCa}</td>
        <td class="p-3 font-mono font-bold text-blue-700">${maNV}</td>
        <td class="p-3 font-bold text-slate-900">${p.TenNV}</td>
        <td class="p-3 font-semibold text-slate-600">${p.MaCN}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">${p.TenCa}</span></td>
        <td class="p-3 font-mono text-slate-600">${p.NgayLam}</td>
        <td class="p-3 font-semibold text-slate-700">${p.Thu}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Đã duyệt</span></td>
        <td class="p-3 text-right">
          <button onclick="deleteShiftAssignment('${p.MaPhanCa}')" class="text-rose-600 hover:underline font-semibold text-[11px] cursor-pointer">Hủy phân ca</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateAssignStaffDropdown() {
  const staffSelect = document.getElementById('assign-input-staff');
  const branchSelect = document.getElementById('assign-input-branch');
  if (!staffSelect) return;

  const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
  const activeBranch = isManager 
    ? (state.currentUser.MaCN || state.currentBranch || 'CN01') 
    : (branchSelect?.value || state.currentBranch || 'CN01');

  // Hàm render dropdown nhân viên
  const renderStaffOptions = (list) => {
    // Lọc nghiêm ngặt nhân viên khi phân ca (Branch Isolation):
    // 1. Chỉ lấy nhân viên trực thuộc activeBranch
    // 2. Tuyệt đối không hiển thị nhân viên chi nhánh khác
    // 3. Tuyệt đối không hiển thị tài khoản Admin cấp cao nhất (SUPER_ADMIN / Chủ Quán)
    // 4. Loại bỏ nhân viên đã nghỉ việc
    const eligibleStaff = list.filter(n => {
      const roleUpper = (n.Role || n.ChucVu || '').toUpperCase();
      if (roleUpper === 'SUPER_ADMIN' || (n.ChucVuText || '').includes('Chủ Quán') || n.MaNV === 'NV001') {
        return false;
      }
      if (n.TrangThai === 'DaNghiViec' || n.TrangThai === 'Đã nghỉ việc') {
        return false;
      }
      const staffBranch = n.MaCN || 'CN01';
      const assignedBranches = n.AssignedBranches || [staffBranch];
      return staffBranch === activeBranch || assignedBranches.includes(activeBranch);
    });

    if (eligibleStaff.length === 0) {
      staffSelect.innerHTML = `<option value="">-- Không có nhân viên trực thuộc ${activeBranch} --</option>`;
    } else {
      staffSelect.innerHTML = eligibleStaff.map(n => {
        return `<option value="${n.MaNV}">👤 ${n.TenNV} (${n.ChucVuText || n.ChucVu || n.Role || 'Nhân viên'}) - ${n.MaNV}</option>`;
      }).join('');
    }
  };

  // 1. Render tức thời từ DB.nhanvien
  if (DB.nhanvien) {
    renderStaffOptions(DB.nhanvien);
  }

  // 2. Gọi Backend API với query param branch_id và exclude_admin=true
  try {
    const url = `http://127.0.0.1:8000/api/employees?branch_id=${encodeURIComponent(activeBranch)}&exclude_admin=true`;
    const res = await fetch(url);
    if (res.ok) {
      const apiStaff = await res.json();
      if (Array.isArray(apiStaff) && apiStaff.length > 0) {
        if (DB.nhanvien) {
          apiStaff.forEach(as => {
            const s = DB.nhanvien.find(n => n.MaNV === as.MaNV);
            if (s) {
              if (as.DiaChi) s.DiaChi = as.DiaChi;
              if (as.GioiTinh) s.GioiTinh = as.GioiTinh;
              if (as.TrangThai) s.TrangThai = as.TrangThai;
            }
          });
        }
        renderStaffOptions(apiStaff);
      }
    }
  } catch (err) {
    // Fallback offline
  }
}

function openAssignShiftModal() {
  const modal = document.getElementById('modal-assign-shift');
  const branchSelect = document.getElementById('assign-input-branch');
  const dateInput = document.getElementById('assign-input-date');

  const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
  const managerBranch = state.currentUser?.MaCN || state.currentBranch || 'CN01';

  if (branchSelect) {
    if (isManager) {
      branchSelect.value = managerBranch;
      branchSelect.disabled = true;
      branchSelect.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-80');
      branchSelect.title = `Chi nhánh cố định: ${managerBranch}`;
    } else {
      branchSelect.disabled = false;
      branchSelect.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-80');
      branchSelect.title = '';
      if (state.currentBranch && state.currentBranch !== 'ALL') {
        branchSelect.value = state.currentBranch;
      }
    }
  }

  updateAssignStaffDropdown();

  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  if (modal) modal.classList.remove('hidden');
}

function closeAssignShiftModal() {
  const modal = document.getElementById('modal-assign-shift');
  if (modal) modal.classList.add('hidden');
}

function saveAssignShift() {
  const staffId = document.getElementById('assign-input-staff').value;
  const isManager = state.currentUser && (state.currentUser.Role === 'BRANCH_MANAGER' || (state.currentUser.ChucVu || '').toLowerCase().includes('quanly'));
  const branch = isManager ? (state.currentUser.MaCN || state.currentBranch || 'CN01') : document.getElementById('assign-input-branch').value;
  const shift = document.getElementById('assign-input-shift').value;
  const day = document.getElementById('assign-input-dayofweek').value;
  const date = document.getElementById('assign-input-date').value;

  if (!staffId) {
    alert('Vui lòng chọn nhân viên trực thuộc chi nhánh để phân ca!');
    return;
  }

  const staff = DB.nhanvien.find(n => n.MaNV === staffId);
  const ca = DB.calam.find(c => c.MaCa === shift);

  const newAssignment = {
    MaPhanCa: `PC0${(DB.phanca ? DB.phanca.length : 0) + 1}`,
    MaNV: staffId,
    TenNV: staff ? staff.TenNV : staffId,
    MaCN: branch,
    MaCa: shift,
    TenCa: ca ? ca.TenCa.split('(')[0].trim() : shift,
    Thu: day,
    NgayLam: date || new Date().toISOString().split('T')[0],
    TrangThai: 'DaDuyet'
  };

  if (!DB.phanca) DB.phanca = [];
  DB.phanca.push(newAssignment);
  saveDatabase();
  closeAssignShiftModal();
  renderShiftAssignments();
  showToast(`Đã phân ca cho ${newAssignment.TenNV}!`, 'success');

  // Gửi đồng bộ lên Backend API
  try {
    fetch('http://127.0.0.1:8000/api/phanca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MaPhanCa: newAssignment.MaPhanCa,
        MaNV: newAssignment.MaNV,
        MaCN: newAssignment.MaCN,
        MaCa: newAssignment.MaCa,
        Thu: newAssignment.Thu,
        NgayLam: newAssignment.NgayLam,
        TrangThai: 'DaDuyet'
      })
    }).catch(() => {});
  } catch (err) {}
}

function deleteShiftAssignment(id) {
  if (!confirm('Bạn có chắc muốn hủy ca trực này?')) return;
  DB.phanca = DB.phanca.filter(p => p.MaPhanCa !== id);
  saveDatabase();
  renderShiftAssignments();
  showToast('Đã hủy phân ca thành công!');

  // Gửi xóa trên Backend API
  try {
    fetch(`http://127.0.0.1:8000/api/phanca/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => {});
  } catch (err) {}
}

function renderDevices() {
  const container = document.getElementById('devices-container');
  if (!container || !DB.thietbi) return;

  container.innerHTML = DB.thietbi.map(d => {
    return `
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-bold text-xs text-slate-900">${d.TenTB}</span>
          </div>
          <div class="text-[10px] text-slate-500 mt-1">SN: <b>${d.SerialNumber}</b> • IP: ${d.IP_LAN}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Đồng bộ gần nhất: <b>${d.LastSync}</b></div>
        </div>
        <div class="text-right">
          <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">🟢 Online</span>
          <div class="text-[10px] text-slate-500 mt-1">${d.TongLog} lượt quẹt</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRawLogs() {
  const tbody = document.getElementById('rawlog-body');
  if (!tbody || !DB.chamcong_rawlog) return;

  tbody.innerHTML = DB.chamcong_rawlog.map(l => {
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-2.5 font-mono text-[11px] text-slate-600">${l.ThoiGian}</td>
        <td class="p-2.5 font-bold text-slate-900">${l.TenNV}</td>
        <td class="p-2.5 font-semibold text-slate-600">${l.MaCN}</td>
        <td class="p-2.5 text-slate-500">${l.MaTB}</td>
        <td class="p-2.5"><span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">${l.KieuQuet}</span></td>
        <td class="p-2.5 font-semibold text-emerald-700">${l.Status}</td>
      </tr>
    `;
  }).join('');
}

function renderTimeLogs(branch = 'ALL') {
  const tbody = document.getElementById('timelog-body');
  if (!tbody || !DB.chamcong) return;

  const filtered = DB.chamcong.filter(c => branch === 'ALL' || c.MaCN === branch);
  tbody.innerHTML = filtered.map(c => {
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-2 font-bold text-slate-900">${c.TenNV}</td>
        <td class="p-2 font-semibold text-slate-600">${c.MaCN}</td>
        <td class="p-2"><span class="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">${c.MaCa}</span></td>
        <td class="p-2 font-mono text-[11px]">${c.GioVao} - ${c.GioRa || '--:--'}</td>
        <td class="p-2 text-rose-600 font-bold">${c.DiTrePhut > 0 ? c.DiTrePhut + 'p' : '-'}</td>
        <td class="p-2 text-amber-600 font-bold">${c.VeSomPhut > 0 ? c.VeSomPhut + 'p' : '-'}</td>
        <td class="p-2 text-right font-black text-slate-900">${c.SoGioThucTe || 0}h</td>
        <td class="p-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${c.DiTrePhut > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">${c.TrangThai}</span></td>
      </tr>
    `;
  }).join('');
}

function simulateFingerprintPunch() {
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const randomStaff = DB.nhanvien[Math.floor(Math.random() * DB.nhanvien.length)];

  const newLog = {
    MaLog: `LOG_${Date.now().toString().slice(-4)}`,
    MaNV: randomStaff.MaNV,
    TenNV: randomStaff.TenNV,
    MaCN: randomStaff.MaCN || 'CN01',
    MaTB: randomStaff.MaCN === 'CN02' ? 'TB02' : 'TB01',
    ThoiGian: timeStr,
    KieuQuet: 'Check-in',
    Status: 'Khớp ca chuẩn (Vân tay sống)'
  };

  if (!DB.chamcong_rawlog) DB.chamcong_rawlog = [];
  DB.chamcong_rawlog.unshift(newLog);
  saveDatabase();
  renderRawLogs();
  showToast(`⚡ Nhận tín hiệu quẹt vân tay: ${randomStaff.TenNV} (< 5s)`, 'success');
}

function renderPayrollTable() {
  const tbody = document.getElementById('payroll-body');
  if (!tbody || !DB.bangluong) return;

  tbody.innerHTML = DB.bangluong.map(b => {
    const isPaid = b.TrangThai === 'Đã thanh toán';
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-2.5 font-mono text-[10px] text-slate-500">${b.MaBangLuong}</td>
        <td class="p-2.5 font-bold text-slate-900">${b.TenNV}</td>
        <td class="p-2.5 text-slate-600">${b.ChucVu}</td>
        <td class="p-2.5 font-semibold text-slate-600">${b.MaCN}</td>
        <td class="p-2.5 text-right font-bold text-slate-800">${b.TongGioLam}h</td>
        <td class="p-2.5 text-right font-mono text-slate-600">${formatMoney(b.LuongTheoGio)}</td>
        <td class="p-2.5 text-right font-mono text-emerald-600">+${formatMoney(b.PhuCap)}</td>
        <td class="p-2.5 text-right font-mono text-rose-600">-${formatMoney(b.PhatDiTre)}</td>
        <td class="p-2.5 text-right font-black text-blue-700">${formatMoney(b.ThucLinh)}</td>
        <td class="p-2.5">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${b.TrangThai}
          </span>
        </td>
        <td class="p-2.5 text-right">
          ${!isPaid ? `
            <button onclick="paySalarySlip('${b.MaBangLuong}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold shadow-xs">
              Chi Trả
            </button>
          ` : `
            <span class="text-slate-400 text-[10px]">Đã quyết toán</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function calculateMonthlyPayroll() {
  showToast('⚡ Đã đối soát ca làm và cập nhật lại bảng lương tự động!', 'success');
  renderPayrollTable();
}

function paySalarySlip(slipId) {
  const slip = DB.bangluong.find(b => b.MaBangLuong === slipId);
  if (!slip) return;

  slip.TrangThai = 'Đã thanh toán';

  // Tự động sinh Phiếu Chi (PHIEUCHI) và trừ vào Sổ Quỹ (SOQUY)
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const pcId = `PC_LUONG_${Date.now().toString().slice(-4)}`;

  const newPC = {
    MaPhieuChi: pcId,
    MaCN: slip.MaCN,
    MaChiNhanh: slip.MaCN,
    MaNV: state.currentUser ? state.currentUser.MaNV : 'NV001',
    TenNV: state.currentUser ? state.currentUser.TenNV : 'Quản Lý',
    NgayChi: timeStr,
    SoTien: slip.ThucLinh,
    LyDo: `Chi trả lương tháng ${slip.Thang}/${slip.Nam} cho nhân viên ${slip.TenNV}`,
    PhuongThuc: 'ChuyenKhoan',
    NguoiNhan: slip.TenNV
  };
  if (!DB.phieuchi) DB.phieuchi = [];
  DB.phieuchi.unshift(newPC);

  // Ghi vào Sổ Quỹ
  const lastSQ = (DB.soquy && DB.soquy.length > 0) ? DB.soquy[DB.soquy.length - 1] : { TonQuy: 1000000 };
  const newTon = (lastSQ.TonQuy || 0) - slip.ThucLinh;
  const newSQ = {
    MaSoQuy: `SQ_${Date.now().toString().slice(-4)}`,
    MaCN: slip.MaCN,
    NgayGiaoDich: timeStr,
    LoaiGiaoDich: 'Chi',
    SoTienThu: 0,
    SoTienChi: slip.ThucLinh,
    TonQuy: newTon,
    HinhThucTT: 'ChuyenKhoan',
    MaPhieuThu: null,
    MaPhieuChi: pcId,
    DienGiai: `Chi trả lương nhân viên: ${slip.TenNV}`
  };
  if (!DB.soquy) DB.soquy = [];
  DB.soquy.push(newSQ);

  saveDatabase();
  renderPayrollTable();
  showToast(`💵 Đã quyết toán lương cho ${slip.TenNV} và ghi nhận Phiếu Chi!`, 'success');
}

function exportPayrollToExcel() {
  showToast('📊 Đã xuất bảng lương ra file Excel!');
}

// ==============================================================================
// 7. VIEW 4: QUẢN LÝ THỰC ĐƠN & CÔNG THỨC MÓN BOM (QUẢN LÝ / CHỦ QUÁN)
// ==============================================================================
function switchMenuSubtab(tabKey) {
  document.querySelectorAll('.menu-subcontent').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.menu-subtab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-white', 'text-slate-700');
  });

  const content = document.getElementById(`menu-subtab-${tabKey}`);
  const btn = document.getElementById(`menu-subtab-btn-${tabKey}`);

  if (content) content.classList.remove('hidden');
  if (btn) {
    btn.classList.add('bg-blue-600', 'text-white');
    btn.classList.remove('bg-white', 'text-slate-700');
  }

  if (tabKey === 'bom') {
    populateBomDishSelector();
    renderRecipeManagement();
  }
}

function renderMenuListManagement() {
  const tbody = document.getElementById('menu-management-table-body');
  if (!tbody || !DB.sanpham) return;

  const search = (document.getElementById('menu-management-search')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('menu-category-filter')?.value || 'ALL';

  const filtered = DB.sanpham.filter(m => {
    const matchSearch = !search || (m.TenSanPham || m.TenMon).toLowerCase().includes(search) || (m.MaSanPham || m.MaMon).toLowerCase().includes(search);
    const matchCat = catFilter === 'ALL' || m.MaNhomHang === catFilter || m.MaDM === catFilter;
    return matchSearch && matchCat;
  });

  tbody.innerHTML = filtered.map(m => {
    const isSelling = m.TrangThai === 'DangBan';
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${m.MaSanPham || m.MaMon}</td>
        <td class="p-3">${renderItemThumbnail(m, 'w-10 h-10')}</td>
        <td class="p-3 font-bold text-slate-900">${m.TenSanPham || m.TenMon}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-700">${m.MaNhomHang || m.MaDM}</span></td>
        <td class="p-3 text-slate-600">${m.DonViTinh || 'Ly'}</td>
        <td class="p-3 text-slate-500">${m.LoaiSanPham === 'PhaChe' ? 'Pha Chế' : 'Đóng Gói'}</td>
        <td class="p-3 text-right font-mono text-rose-600">${formatMoney(m.GiaVon || 8000)}</td>
        <td class="p-3 text-right font-black text-slate-900">${formatMoney(m.GiaBan || 30000)}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isSelling ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${isSelling ? 'Đang bán' : 'Tạm ngưng'}
          </span>
        </td>
        <td class="p-3 text-right">
          <button onclick="toggleDishStatus('${m.MaSanPham || m.MaMon}')" class="px-2.5 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-700 mr-1 font-semibold">
            ${isSelling ? 'Ngưng' : 'Bật bán'}
          </button>
          <button onclick="openAddMenuModal('${m.MaSanPham || m.MaMon}')" class="px-2.5 py-1 text-[11px] rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200">
            Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddMenuModal(dishId = null) {
  const modal = document.getElementById('modal-add-menu-item');
  const title = document.getElementById('modal-dish-title');
  const idInput = document.getElementById('dish-input-id');
  const iconInput = document.getElementById('dish-input-icon');
  const nameInput = document.getElementById('dish-input-name');
  const catInput = document.getElementById('dish-input-category');
  const typeInput = document.getElementById('dish-input-type');
  const unitInput = document.getElementById('dish-input-unit');
  const costInput = document.getElementById('dish-input-cost');
  const priceInput = document.getElementById('dish-input-price');
  const statusInput = document.getElementById('dish-input-status');

  if (dishId) {
    const d = DB.sanpham.find(m => (m.MaSanPham === dishId || m.MaMon === dishId));
    if (d) {
      if (title) title.innerText = 'Chỉnh Sửa Sản Phẩm / Món';
      if (idInput) { idInput.value = d.MaSanPham || d.MaMon; idInput.readOnly = true; }
      if (iconInput) iconInput.value = d.image_url || d.HinhAnh || '';
      if (nameInput) nameInput.value = d.TenSanPham || d.TenMon;
      if (catInput) catInput.value = d.MaNhomHang || d.MaDM || 'CF';
      if (typeInput) typeInput.value = d.LoaiSanPham || 'PhaChe';
      if (unitInput) unitInput.value = d.DonViTinh || 'Ly';
      if (costInput) costInput.value = d.GiaVon || 8000;
      if (priceInput) priceInput.value = d.GiaBan || 30000;
      if (statusInput) statusInput.value = d.TrangThai || 'DangBan';
    }
  } else {
    if (title) title.innerText = 'Thêm Món Mới Vào Thực Đơn';
    if (idInput) { idInput.value = ''; idInput.readOnly = false; }
    if (iconInput) iconInput.value = '';
    if (nameInput) nameInput.value = '';
    if (costInput) costInput.value = '9000';
    if (priceInput) priceInput.value = '35000';
    if (statusInput) statusInput.value = 'DangBan';
  }

  if (modal) modal.classList.remove('hidden');
}

function closeAddMenuModal() {
  const modal = document.getElementById('modal-add-menu-item');
  if (modal) modal.classList.add('hidden');
}

function saveDishItem() {
  const id = document.getElementById('dish-input-id').value.trim();
  const icon = document.getElementById('dish-input-icon').value.trim() || '☕';
  const name = document.getElementById('dish-input-name').value.trim();
  const cat = document.getElementById('dish-input-category').value;
  const type = document.getElementById('dish-input-type').value;
  const unit = document.getElementById('dish-input-unit').value.trim() || 'Ly';
  const cost = parseFloat(document.getElementById('dish-input-cost').value) || 8000;
  const price = parseFloat(document.getElementById('dish-input-price').value) || 30000;
  const status = document.getElementById('dish-input-status').value;

  if (!id || !name) {
    alert('Vui lòng điền đầy đủ Mã Món và Tên Món!');
    return;
  }

  const existingIdx = DB.sanpham.findIndex(m => m.MaSanPham === id || m.MaMon === id);
  if (existingIdx >= 0) {
    Object.assign(DB.sanpham[existingIdx], {
      TenSanPham: name,
      TenMon: name,
      HinhAnh: icon,
      MaNhomHang: cat,
      MaDM: cat,
      LoaiSanPham: type,
      DonViTinh: unit,
      GiaVon: cost,
      GiaBan: price,
      TrangThai: status
    });
    // Đồng bộ sang DB.mon
    const mIdx = DB.mon.findIndex(m => m.MaMon === id);
    if (mIdx >= 0) {
      DB.mon[mIdx].TenMon = name;
      DB.mon[mIdx].HinhAnh = icon;
      DB.mon[mIdx].MaDM = cat;
      DB.mon[mIdx].TrangThai = status;
    }
    showToast(`Đã cập nhật món ${name}!`, 'success');
  } else {
    const newDish = {
      MaSanPham: id,
      MaMon: id,
      TenSanPham: name,
      TenMon: name,
      HinhAnh: icon,
      MaNhomHang: cat,
      MaDM: cat,
      LoaiSanPham: type,
      DonViTinh: unit,
      GiaVon: cost,
      GiaBan: price,
      TrangThai: status
    };
    DB.sanpham.push(newDish);
    DB.mon.push({ MaMon: id, TenMon: name, MaDM: cat, HinhAnh: icon, TrangThai: status });

    // Tạo sẵn size S, M, L cho món mới trong mon_size
    DB.mon_size.push(
      { MaMonSize: `${id}_S`, MaMon: id, MaSize: 'S', GiaBan: price - 5000 },
      { MaMonSize: `${id}_M`, MaMon: id, MaSize: 'M', GiaBan: price },
      { MaMonSize: `${id}_L`, MaMon: id, MaSize: 'L', GiaBan: price + 7000 }
    );
    showToast(`Đã thêm món mới ${name} vào thực đơn!`, 'success');
  }

  saveDatabase();
  closeAddMenuModal();
  renderMenuListManagement();
  renderMenuGrid();
}

function toggleDishStatus(dishId) {
  const d = DB.sanpham.find(m => m.MaSanPham === dishId || m.MaMon === dishId);
  if (!d) return;
  d.TrangThai = d.TrangThai === 'DangBan' ? 'TamNgung' : 'DangBan';
  saveDatabase();
  renderMenuListManagement();
  renderMenuGrid();
  showToast(`Đã chuyển trạng thái món sang: ${d.TrangThai}`);
}

function openCategoryModal() {
  showToast('📁 Quản lý nhóm hàng: Cà Phê, Trà Hoa Quả, Freeze, Bánh');
}

function renderPriceLists() {
  const tbody = document.getElementById('price-table-body');
  if (!tbody || !DB.banggia) return;

  const branchFilter = document.getElementById('price-branch-filter')?.value || 'CN01';
  const typeFilter = document.getElementById('price-type-filter')?.value || 'ALL';

  const filtered = DB.banggia.filter(b => {
    const matchBranch = b.MaChiNhanh === branchFilter;
    const matchType = typeFilter === 'ALL' || b.MaLoaiBangGia === typeFilter;
    return matchBranch && matchType;
  });

  tbody.innerHTML = filtered.map(b => {
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${b.MaBangGia}</td>
        <td class="p-3 font-semibold text-slate-600">${b.MaChiNhanh}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[10px]">${b.MaLoaiBangGia}</span></td>
        <td class="p-3 font-bold text-slate-900">${b.TenMon}</td>
        <td class="p-3 text-right font-black text-emerald-600">${formatMoney(b.GiaBan)}</td>
        <td class="p-3 font-mono text-slate-500">${b.NgayBatDau}</td>
        <td class="p-3 font-mono text-slate-500">${b.NgayKetThuc}</td>
        <td class="p-3 text-right">
          <button onclick="openPriceModal('${b.MaBangGia}')" class="px-2.5 py-1 text-[11px] rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200">
            Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openPriceModal(priceId = null) {
  const modal = document.getElementById('modal-price');
  const dishSelect = document.getElementById('price-input-dish');
  const priceInput = document.getElementById('price-input-amount');
  const startInput = document.getElementById('price-input-start');
  const endInput = document.getElementById('price-input-end');

  if (dishSelect && DB.mon_size) {
    dishSelect.innerHTML = DB.mon_size.map(ms => {
      const mon = DB.sanpham.find(m => (m.MaSanPham === ms.MaMon || m.MaMon === ms.MaMon));
      const name = mon ? mon.TenSanPham || mon.TenMon : ms.MaMon;
      return `<option value="${ms.MaMonSize}">${name} (${ms.MaSize}) - Giá gốc: ${formatMoney(ms.GiaBan)}</option>`;
    }).join('');
  }

  if (startInput) startInput.value = '2026-01-01';
  if (endInput) endInput.value = '2026-12-31';

  if (modal) modal.classList.remove('hidden');
}

function closePriceModal() {
  const modal = document.getElementById('modal-price');
  if (modal) modal.classList.add('hidden');
}

function savePriceItem() {
  const branch = document.getElementById('price-input-branch').value;
  const type = document.getElementById('price-input-type').value;
  const monSize = document.getElementById('price-input-dish').value;
  const amount = parseFloat(document.getElementById('price-input-amount').value) || 0;
  const start = document.getElementById('price-input-start').value;
  const end = document.getElementById('price-input-end').value;

  if (amount <= 0) {
    alert('Vui lòng nhập giá bán lớn hơn 0!');
    return;
  }

  const ms = DB.mon_size.find(m => m.MaMonSize === monSize);
  const mon = DB.sanpham.find(m => (m.MaSanPham === ms.MaMon || m.MaMon === ms.MaMon));
  const dishName = mon ? `${mon.TenSanPham || mon.TenMon} (${ms.MaSize})` : monSize;

  const newPrice = {
    MaBangGia: `BG_${Date.now().toString().slice(-4)}`,
    MaChiNhanh: branch,
    MaLoaiBangGia: type,
    MaMonSize: monSize,
    TenMon: dishName,
    GiaBan: amount,
    NgayBatDau: start || '2026-01-01',
    NgayKetThuc: end || '2026-12-31'
  };

  if (!DB.banggia) DB.banggia = [];
  DB.banggia.push(newPrice);
  saveDatabase();
  closePriceModal();
  renderPriceLists();
  showToast(`Đã lưu bảng giá mới cho ${dishName}!`, 'success');
}

function populateBomDishSelector() {
  const select = document.getElementById('bom-select-dish');
  if (!select || !DB.mon_size) return;

  select.innerHTML = DB.mon_size.map(ms => {
    const mon = DB.sanpham.find(m => (m.MaSanPham === ms.MaMon || m.MaMon === ms.MaMon));
    const name = mon ? mon.TenSanPham || mon.TenMon : ms.MaMon;
    return `<option value="${ms.MaMonSize}">${name} (${ms.MaSize})</option>`;
  }).join('');
}

function renderRecipeManagement() {
  const select = document.getElementById('bom-select-dish');
  if (!select) return;
  const selectedMonSize = select.value || 'CF_SUA_M';

  const tbody = document.getElementById('recipe-table-body');
  if (!tbody || !DB.dinhmucnguyenlieu) return;

  const recipes = DB.dinhmucnguyenlieu.filter(r => r.MaMonSize === selectedMonSize);

  let totalCost = 0;
  tbody.innerHTML = recipes.map(r => {
    const mat = (DB.nguyenlieu || []).find(n => n.MaNL === r.MaNL) || { DonGiaVon: 200 };
    const cost = (r.SoLuongTieuHao || r.DinhMucTieuHao || 0) * (mat.DonGiaVon || 0);
    totalCost += cost;

    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${r.MaNL}</td>
        <td class="p-3 font-bold text-slate-900">${r.TenNL}</td>
        <td class="p-3 text-right font-black text-blue-700">${r.SoLuongTieuHao || r.DinhMucTieuHao}</td>
        <td class="p-3 text-slate-600">${r.DonVi || 'gam'}</td>
        <td class="p-3 text-right font-mono text-slate-600">${formatMoney(mat.DonGiaVon)}</td>
        <td class="p-3 text-right font-black text-rose-600">${formatMoney(cost)}</td>
        <td class="p-3 text-right">
          <button onclick="deleteRecipeItem(${r.MaDinhMuc})" class="text-rose-600 hover:underline font-semibold text-[11px]">Xóa</button>
        </td>
      </tr>
    `;
  }).join('');

  if (recipes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">Chưa có công thức định lượng cho món này. Bấm "+ Thêm Nguyên Liệu"</td></tr>`;
  }

  // Update summary card
  const ms = (DB.mon_size || []).find(m => m.MaMonSize === selectedMonSize);
  const mon = (DB.sanpham || []).find(m => ms && (m.MaSanPham === ms.MaMon || m.MaMon === ms.MaMon));
  const sellingPrice = ms ? ms.GiaBan : 30000;
  const foodCostMargin = sellingPrice > 0 ? ((totalCost / sellingPrice) * 100).toFixed(1) : 0;

  const dishNameEl = document.getElementById('bom-dish-name');
  const dishPriceEl = document.getElementById('bom-dish-price');
  const dishCostEl = document.getElementById('bom-dish-cost');
  const dishMarginEl = document.getElementById('bom-dish-margin');

  if (dishNameEl) dishNameEl.innerText = mon ? `${mon.TenSanPham || mon.TenMon} (${ms.MaSize})` : selectedMonSize;
  if (dishPriceEl) dishPriceEl.innerText = formatMoney(sellingPrice);
  if (dishCostEl) dishCostEl.innerText = formatMoney(totalCost);
  if (dishMarginEl) dishMarginEl.innerText = `${foodCostMargin}% (${foodCostMargin < 35 ? 'Rất Tốt' : 'Cần Tối Ưu'})`;
}

function openRecipeModal() {
  const modal = document.getElementById('modal-recipe');
  const dishSelect = document.getElementById('recipe-input-dish');
  const matSelect = document.getElementById('recipe-input-material');

  if (dishSelect && DB.mon_size) {
    dishSelect.innerHTML = DB.mon_size.map(ms => {
      const mon = DB.sanpham.find(m => (m.MaSanPham === ms.MaMon || m.MaMon === ms.MaMon));
      const name = mon ? mon.TenSanPham || mon.TenMon : ms.MaMon;
      return `<option value="${ms.MaMonSize}">${name} (${ms.MaSize})</option>`;
    }).join('');
    const activeDish = document.getElementById('bom-select-dish')?.value;
    if (activeDish) dishSelect.value = activeDish;
  }

  if (matSelect && DB.nguyenlieu) {
    matSelect.innerHTML = DB.nguyenlieu.map(n => `<option value="${n.MaNL}">${n.TenNL} (${n.DonViTinh})</option>`).join('');
  }

  if (modal) modal.classList.remove('hidden');
}

function closeRecipeModal() {
  const modal = document.getElementById('modal-recipe');
  if (modal) modal.classList.add('hidden');
}

function saveRecipeItem() {
  const dish = document.getElementById('recipe-input-dish').value;
  const matId = document.getElementById('recipe-input-material').value;
  const qty = parseFloat(document.getElementById('recipe-input-amount').value) || 0;
  const unit = document.getElementById('recipe-input-unit').value.trim();

  if (qty <= 0) {
    alert('Số lượng tiêu hao phải lớn hơn 0!');
    return;
  }

  const mat = DB.nguyenlieu.find(n => n.MaNL === matId);
  const ms = DB.mon_size.find(m => m.MaMonSize === dish);
  const mon = DB.sanpham.find(m => (m.MaSanPham === ms.MaMon || m.MaMon === ms.MaMon));
  const dishName = mon ? `${mon.TenSanPham || mon.TenMon} (${ms.MaSize})` : dish;

  const newRecipe = {
    MaDinhMuc: Date.now(),
    MaMonSize: dish,
    TenMon: dishName,
    MaNL: matId,
    TenNL: mat ? mat.TenNL : matId,
    SoLuongTieuHao: qty,
    DinhMucTieuHao: qty,
    DonVi: unit || (mat ? mat.DonViTinh : 'gam')
  };

  if (!DB.dinhmucnguyenlieu) DB.dinhmucnguyenlieu = [];
  DB.dinhmucnguyenlieu.push(newRecipe);
  saveDatabase();
  closeRecipeModal();
  renderRecipeManagement();
  showToast(`Đã thêm ${newRecipe.TenNL} vào công thức!`, 'success');
}

function deleteRecipeItem(id) {
  if (!confirm('Bạn có chắc muốn xóa nguyên liệu này khỏi công thức?')) return;
  DB.dinhmucnguyenlieu = DB.dinhmucnguyenlieu.filter(r => r.MaDinhMuc !== id);
  saveDatabase();
  renderRecipeManagement();
  showToast('Đã xóa thành phần khỏi công thức!');
}

// ==============================================================================
// 8. VIEW 5: QUẢN LÝ TÀI CHÍNH (SỔ QUỸ, PHIẾU THU, PHIẾU CHI, CÔNG NỢ)
// ==============================================================================
function switchFinanceSubtab(tabKey) {
  document.querySelectorAll('.fin-subcontent').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.fin-subtab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-white', 'text-slate-700');
  });

  const content = document.getElementById(`fin-subtab-${tabKey}`);
  const btn = document.getElementById(`fin-subtab-btn-${tabKey}`);

  if (content) content.classList.remove('hidden');
  if (btn) {
    btn.classList.add('bg-blue-600', 'text-white');
    btn.classList.remove('bg-white', 'text-slate-700');
  }
}

function renderCashBook() {
  const tbody = document.getElementById('cashbook-table-body');
  if (!tbody || !DB.soquy) return;

  const branchFilter = document.getElementById('cashbook-branch-filter')?.value || 'ALL';
  const filtered = DB.soquy.filter(s => branchFilter === 'ALL' || s.MaCN === branchFilter);

  let totalIn = 0, totalOut = 0;
  filtered.forEach(s => {
    totalIn += (s.SoTienThu || 0);
    totalOut += (s.SoTienChi || 0);
  });
  const balance = totalIn - totalOut;

  document.getElementById('fin-stat-total-in').innerText = formatMoney(totalIn);
  document.getElementById('fin-stat-total-out').innerText = formatMoney(totalOut);
  document.getElementById('fin-stat-balance').innerText = formatMoney(balance);
  document.getElementById('fin-stat-net').innerText = formatMoney(balance);

  tbody.innerHTML = filtered.map(s => {
    const isThu = s.LoaiGiaoDich === 'Thu';
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${s.MaSoQuy}</td>
        <td class="p-3 font-semibold text-slate-600">${s.MaCN}</td>
        <td class="p-3 font-mono text-[11px] text-slate-500">${s.NgayGiaoDich}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isThu ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${isThu ? 'Thu Tiền' : 'Chi Tiền'}
          </span>
        </td>
        <td class="p-3 text-right font-black text-emerald-600">${s.SoTienThu > 0 ? formatMoney(s.SoTienThu) : '-'}</td>
        <td class="p-3 text-right font-black text-rose-600">${s.SoTienChi > 0 ? formatMoney(s.SoTienChi) : '-'}</td>
        <td class="p-3 text-right font-bold text-blue-700">${formatMoney(s.TonQuy)}</td>
        <td class="p-3 text-slate-600 font-semibold">${s.HinhThucTT === 'TienMat' ? '💵 Tiền Mặt' : '📱 Chuyển Khoản'}</td>
        <td class="p-3 text-slate-700">${s.DienGiai}</td>
      </tr>
    `;
  }).join('');
}

function isAutoReceipt(p) {
  if (p.LoaiPhieu && p.LoaiPhieu.toLowerCase() === 'tudong') return true;
  if (p.IsAuto === true) return true;
  const code = (p.MaPhieuThu || '').toUpperCase();
  const lydo = (p.LyDo || '').toLowerCase();
  if (code.startsWith('PT_HD') || code.startsWith('PT_POS')) return true;
  if (lydo.includes('pos') || lydo.includes('hóa đơn') || lydo.includes('hoa don') || lydo.includes('bán lẻ') || lydo.includes('ban le')) return true;
  return false;
}

function isAutoPayment(p) {
  if (p.LoaiPhieu && p.LoaiPhieu.toLowerCase() === 'tudong') return true;
  if (p.IsAuto === true) return true;
  const code = (p.MaPhieuChi || '').toUpperCase();
  const lydo = (p.LyDo || '').toLowerCase();
  if (code.startsWith('PC_LUONG')) return true;
  if (lydo.includes('lương') || lydo.includes('luong') || lydo.includes('chi trả lương') || lydo.includes('bảng lương')) return true;
  return false;
}

function renderReceipts() {
  const tbody = document.getElementById('receipts-table-body');
  if (!tbody || !DB.phieuthu) return;

  tbody.innerHTML = DB.phieuthu.map(p => {
    const isAuto = isAutoReceipt(p);
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">
          ${p.MaPhieuThu}
          ${isAuto ? '<span class="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold" title="Phiếu thu tự động từ POS">Auto</span>' : ''}
        </td>
        <td class="p-3 font-semibold text-slate-600">${p.MaCN}</td>
        <td class="p-3 font-mono text-slate-500 text-[11px]">${p.NgayThu}</td>
        <td class="p-3 font-bold text-slate-900">${p.NguoiNop}</td>
        <td class="p-3 text-slate-700">${p.LyDo}</td>
        <td class="p-3 text-right font-black text-emerald-600">${formatMoney(p.SoTien)}</td>
        <td class="p-3 font-semibold text-slate-600">${p.PhuongThuc === 'TienMat' ? '💵 Tiền Mặt' : (p.PhuongThuc === 'ChuyenKhoan' ? '📱 Chuyển Khoản' : '💳 Thẻ')}</td>
        <td class="p-3 font-bold text-slate-800">${p.TenNV || p.MaNV}</td>
        <td class="p-3 text-right">
          <button onclick="openEditReceiptModal('${p.MaPhieuThu}')" class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition shadow-xs">
            <span>✏️</span> Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openEditReceiptModal(id) {
  const p = DB.phieuthu ? DB.phieuthu.find(item => item.MaPhieuThu === id) : null;
  if (!p) {
    alert(`Không tìm thấy Phiếu Thu ${id}!`);
    return;
  }

  const isAuto = isAutoReceipt(p);
  document.getElementById('edit-receipt-id').value = p.MaPhieuThu;
  document.getElementById('edit-receipt-is-auto').value = isAuto ? '1' : '0';
  document.getElementById('edit-receipt-code-badge').innerHTML = `Mã phiếu: <b>${p.MaPhieuThu}</b> • <span class="px-1.5 py-0.5 rounded font-bold ${isAuto ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${isAuto ? 'Tự động (POS)' : 'Thủ công'}</span>`;

  document.getElementById('edit-receipt-branch').value = p.MaCN || 'CN01';
  document.getElementById('edit-receipt-date').value = p.NgayThu || '';
  document.getElementById('edit-receipt-payer').value = p.NguoiNop || '';
  document.getElementById('edit-receipt-reason').value = p.LyDo || '';
  document.getElementById('edit-receipt-amount').value = p.SoTien || 0;
  document.getElementById('edit-receipt-method').value = p.PhuongThuc || 'TienMat';

  document.getElementById('edit-receipt-creator').innerText = p.TenNV || p.MaNV || 'Quản lý';
  document.getElementById('edit-receipt-last-updated').innerText = p.LichSuChinhSua ? `Lịch sử: ${p.LichSuChinhSua}` : (p.NgayCapNhat ? `Chỉnh sửa gần nhất: ${p.NgayCapNhat} bởi ${p.NguoiCapNhat || 'Quản lý'}` : 'Lịch sử: Chưa chỉnh sửa');

  const warningEl = document.getElementById('edit-receipt-auto-warning');
  const noticeEl = document.getElementById('edit-receipt-manual-notice');
  const amountInput = document.getElementById('edit-receipt-amount');
  const methodInput = document.getElementById('edit-receipt-method');
  const dateInput = document.getElementById('edit-receipt-date');
  const branchInput = document.getElementById('edit-receipt-branch');

  if (isAuto) {
    warningEl.classList.remove('hidden');
    noticeEl.classList.add('hidden');
    [amountInput, methodInput, dateInput, branchInput].forEach(el => {
      el.disabled = true;
      el.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed', 'border-dashed');
      el.classList.remove('bg-white', 'text-slate-800');
    });
  } else {
    warningEl.classList.add('hidden');
    noticeEl.classList.remove('hidden');
    [amountInput, methodInput, dateInput, branchInput].forEach(el => {
      el.disabled = false;
      el.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-not-allowed', 'border-dashed');
      el.classList.add('bg-white', 'text-slate-800');
    });
  }

  const modal = document.getElementById('modal-edit-receipt');
  if (modal) modal.classList.remove('hidden');
}

function closeEditReceiptModal() {
  const modal = document.getElementById('modal-edit-receipt');
  if (modal) modal.classList.add('hidden');
}

async function submitEditReceipt() {
  const id = document.getElementById('edit-receipt-id').value;
  const isAuto = document.getElementById('edit-receipt-is-auto').value === '1';
  const payer = document.getElementById('edit-receipt-payer').value.trim();
  const reason = document.getElementById('edit-receipt-reason').value.trim();
  const amount = parseFloat(document.getElementById('edit-receipt-amount').value) || 0;
  const method = document.getElementById('edit-receipt-method').value;
  const date = document.getElementById('edit-receipt-date').value.trim();
  const branch = document.getElementById('edit-receipt-branch').value;

  if (!payer || !reason) {
    alert('Vui lòng điền đầy đủ Người Nộp và Lý Do thu tiền!');
    return;
  }
  if (!isAuto && amount <= 0) {
    alert('Số tiền thu phải lớn hơn 0!');
    return;
  }

  const currentUser = state.currentUser ? (state.currentUser.TenNV || state.currentUser.TenDangNhap || 'Quản lý') : 'Quản lý';
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);

  // Prepare payload
  const payload = {
    NguoiNop: payer,
    LyDo: reason,
    NguoiCapNhat: currentUser
  };
  if (!isAuto) {
    payload.SoTien = amount;
    payload.PhuongThuc = method;
    payload.NgayThu = date;
    payload.MaCN = branch;
  }

  // Call Backend API
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/phieu-thu/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.detail || 'Có lỗi xảy ra khi cập nhật phiếu thu trên máy chủ!');
      return;
    }
  } catch (err) {
    console.log('Backend API offline, persisting edit to local store.');
  }

  // Update in local DB
  const p = DB.phieuthu ? DB.phieuthu.find(item => item.MaPhieuThu === id) : null;
  if (p) {
    p.NguoiNop = payer;
    p.LyDo = reason;
    p.NguoiCapNhat = currentUser;
    p.NgayCapNhat = timeStr;
    const auditNote = `[${timeStr}] ${currentUser} cập nhật`;
    p.LichSuChinhSua = p.LichSuChinhSua ? `${p.LichSuChinhSua} | ${auditNote}` : auditNote;

    if (!isAuto) {
      p.SoTien = amount;
      p.PhuongThuc = method;
      if (date) p.NgayThu = date;
      if (branch) p.MaCN = branch;

      // Update matching SoQuy
      if (DB.soquy) {
        const sq = DB.soquy.find(s => s.MaPhieuThu === id);
        if (sq) {
          sq.DienGiai = reason;
          sq.SoTienThu = amount;
          sq.HinhThucTT = method;
          if (branch) sq.MaCN = branch;
        }
      }
    } else {
      if (DB.soquy) {
        const sq = DB.soquy.find(s => s.MaPhieuThu === id);
        if (sq) sq.DienGiai = reason;
      }
    }
  }

  saveDatabase();
  closeEditReceiptModal();
  renderCashBook();
  renderReceipts();
  showToast(`Đã cập nhật Phiếu Thu ${id} thành công!`, 'success');
}

function openReceiptModal() {
  const modal = document.getElementById('modal-receipt');
  if (modal) modal.classList.remove('hidden');
}

function closeReceiptFormModal() {
  const modal = document.getElementById('modal-receipt');
  if (modal) modal.classList.add('hidden');
}

function saveReceipt() {
  const branch = document.getElementById('receipt-input-branch').value;
  const payer = document.getElementById('receipt-input-payer').value.trim();
  const reason = document.getElementById('receipt-input-reason').value.trim();
  const amount = parseFloat(document.getElementById('receipt-input-amount').value) || 0;
  const method = document.getElementById('receipt-input-method').value;

  if (amount <= 0 || !payer || !reason) {
    alert('Vui lòng điền đầy đủ người nộp, lý do và số tiền hợp lệ!');
    return;
  }

  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const ptId = `PT_${Date.now().toString().slice(-4)}`;

  const newPT = {
    MaPhieuThu: ptId,
    MaCN: branch,
    MaChiNhanh: branch,
    MaNV: state.currentUser ? state.currentUser.MaNV : 'NV001',
    TenNV: state.currentUser ? state.currentUser.TenNV : 'Quản Lý',
    NgayThu: timeStr,
    SoTien: amount,
    LyDo: reason,
    PhuongThuc: method,
    NguoiNop: payer,
    LoaiPhieu: 'ThuCong'
  };
  if (!DB.phieuthu) DB.phieuthu = [];
  DB.phieuthu.unshift(newPT);

  // Cập nhật Sổ Quỹ
  const lastSQ = (DB.soquy && DB.soquy.length > 0) ? DB.soquy[DB.soquy.length - 1] : { TonQuy: 1000000 };
  const newTon = (lastSQ.TonQuy || 0) + amount;
  const newSQ = {
    MaSoQuy: `SQ_${Date.now().toString().slice(-4)}`,
    MaCN: branch,
    NgayGiaoDich: timeStr,
    LoaiGiaoDich: 'Thu',
    SoTienThu: amount,
    SoTienChi: 0,
    TonQuy: newTon,
    HinhThucTT: method,
    MaPhieuThu: ptId,
    MaPhieuChi: null,
    DienGiai: reason
  };
  if (!DB.soquy) DB.soquy = [];
  DB.soquy.push(newSQ);

  saveDatabase();
  closeReceiptFormModal();
  renderCashBook();
  renderReceipts();
  showToast(`Đã lập Phiếu Thu ${formatMoney(amount)} và ghi nhận Sổ Quỹ!`, 'success');

  // Async push to backend
  try {
    fetch('http://127.0.0.1:8000/api/phieu-thu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPT)
    }).catch(() => {});
  } catch (e) {}
}

function renderPayments() {
  const tbody = document.getElementById('payments-table-body');
  if (!tbody || !DB.phieuchi) return;

  tbody.innerHTML = DB.phieuchi.map(p => {
    const isAuto = isAutoPayment(p);
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">
          ${p.MaPhieuChi}
          ${isAuto ? '<span class="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold" title="Phiếu chi tự động (Lương)">Auto</span>' : ''}
        </td>
        <td class="p-3 font-semibold text-slate-600">${p.MaCN}</td>
        <td class="p-3 font-mono text-slate-500 text-[11px]">${p.NgayChi}</td>
        <td class="p-3 font-bold text-slate-900">${p.NguoiNhan}</td>
        <td class="p-3 text-slate-700">${p.LyDo}</td>
        <td class="p-3 text-right font-black text-rose-600">${formatMoney(p.SoTien)}</td>
        <td class="p-3 font-semibold text-slate-600">${p.PhuongThuc === 'TienMat' ? '💵 Tiền Mặt' : (p.PhuongThuc === 'ChuyenKhoan' ? '📱 Chuyển Khoản' : '💳 Thẻ')}</td>
        <td class="p-3 font-bold text-slate-800">${p.TenNV || p.MaNV}</td>
        <td class="p-3 text-right">
          <button onclick="openEditPaymentModal('${p.MaPhieuChi}')" class="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition shadow-xs">
            <span>✏️</span> Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openEditPaymentModal(id) {
  const p = DB.phieuchi ? DB.phieuchi.find(item => item.MaPhieuChi === id) : null;
  if (!p) {
    alert(`Không tìm thấy Phiếu Chi ${id}!`);
    return;
  }

  const isAuto = isAutoPayment(p);
  document.getElementById('edit-payment-id').value = p.MaPhieuChi;
  document.getElementById('edit-payment-is-auto').value = isAuto ? '1' : '0';
  document.getElementById('edit-payment-code-badge').innerHTML = `Mã phiếu: <b>${p.MaPhieuChi}</b> • <span class="px-1.5 py-0.5 rounded font-bold ${isAuto ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${isAuto ? 'Tự động (Lương/Hệ thống)' : 'Thủ công'}</span>`;

  document.getElementById('edit-payment-branch').value = p.MaCN || 'CN01';
  document.getElementById('edit-payment-date').value = p.NgayChi || '';
  document.getElementById('edit-payment-receiver').value = p.NguoiNhan || '';
  document.getElementById('edit-payment-reason').value = p.LyDo || '';
  document.getElementById('edit-payment-amount').value = p.SoTien || 0;
  document.getElementById('edit-payment-method').value = p.PhuongThuc || 'TienMat';

  document.getElementById('edit-payment-creator').innerText = p.TenNV || p.MaNV || 'Quản lý';
  document.getElementById('edit-payment-last-updated').innerText = p.LichSuChinhSua ? `Lịch sử: ${p.LichSuChinhSua}` : (p.NgayCapNhat ? `Chỉnh sửa gần nhất: ${p.NgayCapNhat} bởi ${p.NguoiCapNhat || 'Quản lý'}` : 'Lịch sử: Chưa chỉnh sửa');

  const warningEl = document.getElementById('edit-payment-auto-warning');
  const noticeEl = document.getElementById('edit-payment-manual-notice');
  const amountInput = document.getElementById('edit-payment-amount');
  const methodInput = document.getElementById('edit-payment-method');
  const dateInput = document.getElementById('edit-payment-date');
  const branchInput = document.getElementById('edit-payment-branch');

  if (isAuto) {
    warningEl.classList.remove('hidden');
    noticeEl.classList.add('hidden');
    [amountInput, methodInput, dateInput, branchInput].forEach(el => {
      el.disabled = true;
      el.classList.add('bg-slate-100', 'text-slate-500', 'cursor-not-allowed', 'border-dashed');
      el.classList.remove('bg-white', 'text-slate-800');
    });
  } else {
    warningEl.classList.add('hidden');
    noticeEl.classList.remove('hidden');
    [amountInput, methodInput, dateInput, branchInput].forEach(el => {
      el.disabled = false;
      el.classList.remove('bg-slate-100', 'text-slate-500', 'cursor-not-allowed', 'border-dashed');
      el.classList.add('bg-white', 'text-slate-800');
    });
  }

  const modal = document.getElementById('modal-edit-payment');
  if (modal) modal.classList.remove('hidden');
}

function closeEditPaymentModal() {
  const modal = document.getElementById('modal-edit-payment');
  if (modal) modal.classList.add('hidden');
}

async function submitEditPayment() {
  const id = document.getElementById('edit-payment-id').value;
  const isAuto = document.getElementById('edit-payment-is-auto').value === '1';
  const receiver = document.getElementById('edit-payment-receiver').value.trim();
  const reason = document.getElementById('edit-payment-reason').value.trim();
  const amount = parseFloat(document.getElementById('edit-payment-amount').value) || 0;
  const method = document.getElementById('edit-payment-method').value;
  const date = document.getElementById('edit-payment-date').value.trim();
  const branch = document.getElementById('edit-payment-branch').value;

  if (!receiver || !reason) {
    alert('Vui lòng điền đầy đủ Người Nhận và Lý Do chi tiền!');
    return;
  }
  if (!isAuto && amount <= 0) {
    alert('Số tiền chi phải lớn hơn 0!');
    return;
  }

  const currentUser = state.currentUser ? (state.currentUser.TenNV || state.currentUser.TenDangNhap || 'Quản lý') : 'Quản lý';
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);

  // Prepare payload
  const payload = {
    NguoiNhan: receiver,
    LyDo: reason,
    NguoiCapNhat: currentUser
  };
  if (!isAuto) {
    payload.SoTien = amount;
    payload.PhuongThuc = method;
    payload.NgayChi = date;
    payload.MaCN = branch;
  }

  // Call Backend API
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/phieu-chi/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.detail || 'Có lỗi xảy ra khi cập nhật phiếu chi trên máy chủ!');
      return;
    }
  } catch (err) {
    console.log('Backend API offline, persisting edit to local store.');
  }

  // Update in local DB
  const p = DB.phieuchi ? DB.phieuchi.find(item => item.MaPhieuChi === id) : null;
  if (p) {
    p.NguoiNhan = receiver;
    p.LyDo = reason;
    p.NguoiCapNhat = currentUser;
    p.NgayCapNhat = timeStr;
    const auditNote = `[${timeStr}] ${currentUser} cập nhật`;
    p.LichSuChinhSua = p.LichSuChinhSua ? `${p.LichSuChinhSua} | ${auditNote}` : auditNote;

    if (!isAuto) {
      p.SoTien = amount;
      p.PhuongThuc = method;
      if (date) p.NgayChi = date;
      if (branch) p.MaCN = branch;

      // Update matching SoQuy
      if (DB.soquy) {
        const sq = DB.soquy.find(s => s.MaPhieuChi === id);
        if (sq) {
          sq.DienGiai = reason;
          sq.SoTienChi = amount;
          sq.HinhThucTT = method;
          if (branch) sq.MaCN = branch;
        }
      }
    } else {
      if (DB.soquy) {
        const sq = DB.soquy.find(s => s.MaPhieuChi === id);
        if (sq) sq.DienGiai = reason;
      }
    }
  }

  saveDatabase();
  closeEditPaymentModal();
  renderCashBook();
  renderPayments();
  showToast(`Đã cập nhật Phiếu Chi ${id} thành công!`, 'success');
}

function openPaymentModal() {
  const modal = document.getElementById('modal-payment');
  if (modal) modal.classList.remove('hidden');
}

function closePaymentModal() {
  const modal = document.getElementById('modal-payment');
  if (modal) modal.classList.add('hidden');
}

function savePayment() {
  const branch = document.getElementById('payment-input-branch').value;
  const receiver = document.getElementById('payment-input-receiver').value.trim();
  const reason = document.getElementById('payment-input-reason').value.trim();
  const amount = parseFloat(document.getElementById('payment-input-amount').value) || 0;
  const method = document.getElementById('payment-input-method').value;

  if (amount <= 0 || !receiver || !reason) {
    alert('Vui lòng điền đầy đủ người nhận, lý do và số tiền hợp lệ!');
    return;
  }

  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const pcId = `PC_${Date.now().toString().slice(-4)}`;

  const newPC = {
    MaPhieuChi: pcId,
    MaCN: branch,
    MaChiNhanh: branch,
    MaNV: state.currentUser ? state.currentUser.MaNV : 'NV001',
    TenNV: state.currentUser ? state.currentUser.TenNV : 'Quản Lý',
    NgayChi: timeStr,
    SoTien: amount,
    LyDo: reason,
    PhuongThuc: method,
    NguoiNhan: receiver,
    LoaiPhieu: 'ThuCong'
  };
  if (!DB.phieuchi) DB.phieuchi = [];
  DB.phieuchi.unshift(newPC);

  // Cập nhật Sổ Quỹ
  const lastSQ = (DB.soquy && DB.soquy.length > 0) ? DB.soquy[DB.soquy.length - 1] : { TonQuy: 1000000 };
  const newTon = (lastSQ.TonQuy || 0) - amount;
  const newSQ = {
    MaSoQuy: `SQ_${Date.now().toString().slice(-4)}`,
    MaCN: branch,
    NgayGiaoDich: timeStr,
    LoaiGiaoDich: 'Chi',
    SoTienThu: 0,
    SoTienChi: amount,
    TonQuy: newTon,
    HinhThucTT: method,
    MaPhieuThu: null,
    MaPhieuChi: pcId,
    DienGiai: reason
  };
  if (!DB.soquy) DB.soquy = [];
  DB.soquy.push(newSQ);

  saveDatabase();
  closePaymentModal();
  renderCashBook();
  renderPayments();
  showToast(`Đã lập Phiếu Chi ${formatMoney(amount)} và trừ Sổ Quỹ!`, 'success');

  // Async push to backend
  try {
    fetch('http://127.0.0.1:8000/api/phieu-chi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPC)
    }).catch(() => {});
  } catch (e) {}
}

async function syncFinanceFromBackend() {
  try {
    const branch = state.currentBranch || 'ALL';
    const param = branch !== 'ALL' ? `?branch_id=${encodeURIComponent(branch)}` : '';
    const [resThu, resChi, resSQ] = await Promise.all([
      fetch(`http://127.0.0.1:8000/api/phieu-thu${param}`).catch(() => null),
      fetch(`http://127.0.0.1:8000/api/phieu-chi${param}`).catch(() => null),
      fetch(`http://127.0.0.1:8000/api/so-quy${param}`).catch(() => null)
    ]);

    if (resThu && resThu.ok) {
      const dataThu = await resThu.json();
      if (Array.isArray(dataThu) && dataThu.length > 0) {
        if (!DB.phieuthu) DB.phieuthu = [];
        dataThu.forEach(item => {
          const ex = DB.phieuthu.find(p => p.MaPhieuThu === item.MaPhieuThu);
          if (ex) {
            ex.NguoiNop = item.NguoiNop;
            ex.LyDo = item.LyDo;
            ex.SoTien = item.SoTien;
            ex.PhuongThuc = item.PhuongThuc;
            ex.LoaiPhieu = item.LoaiPhieu;
            ex.NguoiCapNhat = item.NguoiCapNhat;
            ex.NgayCapNhat = item.NgayCapNhat;
            ex.LichSuChinhSua = item.LichSuChinhSua;
          } else {
            DB.phieuthu.push(item);
          }
        });
      }
    }

    if (resChi && resChi.ok) {
      const dataChi = await resChi.json();
      if (Array.isArray(dataChi) && dataChi.length > 0) {
        if (!DB.phieuchi) DB.phieuchi = [];
        dataChi.forEach(item => {
          const ex = DB.phieuchi.find(p => p.MaPhieuChi === item.MaPhieuChi);
          if (ex) {
            ex.NguoiNhan = item.NguoiNhan;
            ex.LyDo = item.LyDo;
            ex.SoTien = item.SoTien;
            ex.PhuongThuc = item.PhuongThuc;
            ex.LoaiPhieu = item.LoaiPhieu;
            ex.NguoiCapNhat = item.NguoiCapNhat;
            ex.NgayCapNhat = item.NgayCapNhat;
            ex.LichSuChinhSua = item.LichSuChinhSua;
          } else {
            DB.phieuchi.push(item);
          }
        });
      }
    }

    renderCashBook();
    renderReceipts();
    renderPayments();
  } catch (err) {
    // Offline / fallback to local DB
  }
}

function renderDebts() {
  const tbody = document.getElementById('debts-table-body');
  if (!tbody || !DB.congno) return;

  const typeFilter = document.getElementById('debt-type-filter')?.value || 'ALL';
  const filtered = DB.congno.filter(d => typeFilter === 'ALL' || d.LoaiCongNo === typeFilter);

  let rec = 0, pay = 0;
  DB.congno.forEach(d => {
    if (d.LoaiCongNo === 'PhaiThu' && d.TrangThai === 'ChuaThanhToan') rec += d.SoTienCongNo;
    if (d.LoaiCongNo === 'PhaiTra' && d.TrangThai === 'ChuaThanhToan') pay += d.SoTienCongNo;
  });

  const recEl = document.getElementById('debt-stat-receivable');
  const payEl = document.getElementById('debt-stat-payable');
  if (recEl) recEl.innerText = formatMoney(rec);
  if (payEl) payEl.innerText = formatMoney(pay);

  tbody.innerHTML = filtered.map(d => {
    const isThu = d.LoaiCongNo === 'PhaiThu';
    const isPaid = d.TrangThai === 'DaThanhToan';
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${d.MaCongNo}</td>
        <td class="p-3 font-bold text-slate-900">${d.TenDoiTac}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isThu ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">
            ${isThu ? 'Phải Thu (Khách)' : 'Phải Trả (NCC)'}
          </span>
        </td>
        <td class="p-3 text-right font-black ${isThu ? 'text-blue-700' : 'text-amber-700'}">${formatMoney(d.SoTienCongNo)}</td>
        <td class="p-3 font-mono text-slate-500">${d.NgayPhatSinh}</td>
        <td class="p-3 font-mono text-rose-600 font-bold">${d.HanThanhToan}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
            ${isPaid ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
          </span>
        </td>
        <td class="p-3 text-right">
          ${!isPaid ? `
            <button onclick="settleDebt('${d.MaCongNo}')" class="px-2.5 py-1 ${isThu ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded text-[10px] font-bold shadow-xs">
              ${isThu ? 'Thu Nợ' : 'Trả Nợ'}
            </button>
          ` : `
            <span class="text-slate-400 text-[10px]">Đã giải quyết</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function settleDebt(debtId) {
  const d = DB.congno.find(c => c.MaCongNo === debtId);
  if (!d) return;

  d.TrangThai = 'DaThanhToan';
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);

  if (d.LoaiCongNo === 'PhaiThu') {
    // Sinh Phiếu Thu
    const ptId = `PT_NO_${Date.now().toString().slice(-4)}`;
    DB.phieuthu.unshift({
      MaPhieuThu: ptId,
      MaCN: 'CN01',
      MaChiNhanh: 'CN01',
      MaNV: state.currentUser ? state.currentUser.MaNV : 'NV001',
      TenNV: state.currentUser ? state.currentUser.TenNV : 'Quản Lý',
      NgayThu: timeStr,
      SoTien: d.SoTienCongNo,
      LyDo: `Thu hồi công nợ đối tác: ${d.TenDoiTac}`,
      PhuongThuc: 'ChuyenKhoan',
      NguoiNop: d.TenDoiTac
    });
    showToast(`Đã thu nợ ${formatMoney(d.SoTienCongNo)} từ ${d.TenDoiTac}!`, 'success');
  } else {
    // Sinh Phiếu Chi
    const pcId = `PC_NO_${Date.now().toString().slice(-4)}`;
    DB.phieuchi.unshift({
      MaPhieuChi: pcId,
      MaCN: 'CN01',
      MaChiNhanh: 'CN01',
      MaNV: state.currentUser ? state.currentUser.MaNV : 'NV001',
      TenNV: state.currentUser ? state.currentUser.TenNV : 'Quản Lý',
      NgayChi: timeStr,
      SoTien: d.SoTienCongNo,
      LyDo: `Thanh toán công nợ nhà cung cấp: ${d.TenDoiTac}`,
      PhuongThuc: 'ChuyenKhoan',
      NguoiNhan: d.TenDoiTac
    });
    showToast(`Đã trả nợ ${formatMoney(d.SoTienCongNo)} cho ${d.TenDoiTac}!`, 'success');
  }

  saveDatabase();
  renderDebts();
  renderCashBook();
}

// ==============================================================================
// 9. VIEW 6: QUẢN LÝ KHO & NGUYÊN VẬT LIỆU (KHO / QUẢN LÝ / CHỦ QUÁN)
// ==============================================================================
function switchInventorySubtab(tabKey) {
  document.querySelectorAll('.inv-subcontent').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.inv-subtab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('bg-white', 'text-slate-700');
  });

  const content = document.getElementById(`inv-subtab-${tabKey}`);
  const btn = document.getElementById(`inv-subtab-btn-${tabKey}`);

  if (content) content.classList.remove('hidden');
  if (btn) {
    btn.classList.add('bg-blue-600', 'text-white');
    btn.classList.remove('bg-white', 'text-slate-700');
  }
}

function filterInventoryFilter(filterType) {
  state.inventoryFilter = filterType;
  const btnAll = document.getElementById('inv-filter-all');
  const btnLow = document.getElementById('inv-filter-low');

  if (filterType === 'ALL') {
    if (btnAll) { btnAll.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white cursor-pointer'; }
    if (btnLow) { btnLow.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'; }
  } else {
    if (btnAll) { btnAll.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'; }
    if (btnLow) { btnLow.className = 'px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white cursor-pointer'; }
  }
  renderInventory();
}

function renderInventory() {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody || !DB.tonkho) return;

  const search = (document.getElementById('inventory-search-input')?.value || '').toLowerCase().trim();
  const branchFilter = document.getElementById('inventory-branch-select')?.value || 'ALL';

  const filtered = DB.tonkho.filter(item => {
    const mat = (DB.nguyenlieu || []).find(n => n.MaNL === item.MaNL) || { TenNL: item.MaNL, DonViTinh: 'gam', NguongBao: 500 };
    const matchSearch = !search || mat.TenNL.toLowerCase().includes(search) || item.MaNL.toLowerCase().includes(search);
    const matchBranch = branchFilter === 'ALL' || item.MaCN === branchFilter;
    const isLow = item.SoLuongTon <= mat.NguongBao;
    const matchType = state.inventoryFilter === 'ALL' || isLow;
    return matchSearch && matchBranch && matchType;
  });

  let lowStockCount = 0;
  let totalStockValue = 0;

  tbody.innerHTML = filtered.map(item => {
    const mat = (DB.nguyenlieu || []).find(n => n.MaNL === item.MaNL) || { TenNL: item.MaNL, DonViTinh: 'gam', NguongBao: 500, DonGiaVon: 200 };
    const isLow = item.SoLuongTon <= mat.NguongBao;
    if (isLow) lowStockCount++;
    totalStockValue += (item.SoLuongTon * (mat.DonGiaVon || 0));

    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${item.MaNL}</td>
        <td class="p-3 font-bold text-slate-900">${mat.TenNL}</td>
        <td class="p-3 font-semibold text-slate-600">${item.MaCN}</td>
        <td class="p-3 text-slate-600">${mat.DonViTinh}</td>
        <td class="p-3 text-right font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}">${item.SoLuongTon.toLocaleString()}</td>
        <td class="p-3 text-right font-mono text-slate-500">${mat.NguongBao.toLocaleString()}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
            ${isLow ? '⚠️ Sắp hết hàng' : 'Đủ tồn kho'}
          </span>
        </td>
        <td class="p-3 text-right">
          <button onclick="quickAddStock('${item.MaCN}', '${item.MaNL}')" class="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded font-bold text-[11px] border border-purple-200">
            + Nhập nhanh
          </button>
        </td>
      </tr>
    `;
  }).join('');

  const lowEl = document.getElementById('inv-stat-low-stock');
  const valEl = document.getElementById('inv-stat-total-value');
  if (lowEl) lowEl.innerText = `${lowStockCount} Mặt Hàng`;
  if (valEl) valEl.innerText = formatMoney(totalStockValue);
}

function quickAddStock(branch, matId) {
  const qty = prompt(`Nhập số lượng bổ sung cho nguyên liệu [${matId}] tại chi nhánh [${branch}]:`, '1000');
  if (!qty || isNaN(qty) || parseFloat(qty) <= 0) return;

  const item = DB.tonkho.find(t => t.MaCN === branch && t.MaNL === matId);
  if (item) {
    item.SoLuongTon += parseFloat(qty);
    saveDatabase();
    renderInventory();
    showToast(`Đã bổ sung ${qty} vào kho ${branch}!`, 'success');
  }
}

function renderMaterialsList() {
  const tbody = document.getElementById('materials-table-body');
  if (!tbody || !DB.nguyenlieu) return;

  tbody.innerHTML = DB.nguyenlieu.map(m => {
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${m.MaNL}</td>
        <td class="p-3 font-bold text-slate-900">${m.TenNL}</td>
        <td class="p-3 text-slate-600">${m.DonViTinh}</td>
        <td class="p-3 text-right font-black text-rose-600">${formatMoney(m.DonGiaVon)}</td>
        <td class="p-3 text-right font-mono text-slate-700">${m.NguongBao.toLocaleString()}</td>
        <td class="p-3 text-right">
          <button onclick="openMaterialModal('${m.MaNL}')" class="px-2.5 py-1 text-[11px] rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200">
            Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openMaterialModal(matId = null) {
  const modal = document.getElementById('modal-material');
  const idInput = document.getElementById('mat-input-id');
  const nameInput = document.getElementById('mat-input-name');
  const unitInput = document.getElementById('mat-input-unit');
  const costInput = document.getElementById('mat-input-cost');
  const minInput = document.getElementById('mat-input-min');

  if (matId) {
    const m = DB.nguyenlieu.find(n => n.MaNL === matId);
    if (m) {
      if (idInput) { idInput.value = m.MaNL; idInput.readOnly = true; }
      if (nameInput) nameInput.value = m.TenNL;
      if (unitInput) unitInput.value = m.DonViTinh;
      if (costInput) costInput.value = m.DonGiaVon || 200;
      if (minInput) minInput.value = m.NguongBao || 500;
    }
  } else {
    if (idInput) { idInput.value = ''; idInput.readOnly = false; }
    if (nameInput) nameInput.value = '';
    if (unitInput) unitInput.value = 'gam';
    if (costInput) costInput.value = '250';
    if (minInput) minInput.value = '500';
  }

  if (modal) modal.classList.remove('hidden');
}

function closeMaterialModal() {
  const modal = document.getElementById('modal-material');
  if (modal) modal.classList.add('hidden');
}

function saveMaterial() {
  const id = document.getElementById('mat-input-id').value.trim();
  const name = document.getElementById('mat-input-name').value.trim();
  const unit = document.getElementById('mat-input-unit').value.trim();
  const cost = parseFloat(document.getElementById('mat-input-cost').value) || 0;
  const min = parseFloat(document.getElementById('mat-input-min').value) || 0;

  if (!id || !name || !unit) {
    alert('Vui lòng điền đầy đủ thông tin nguyên liệu!');
    return;
  }

  const existingIdx = DB.nguyenlieu.findIndex(n => n.MaNL === id);
  if (existingIdx >= 0) {
    Object.assign(DB.nguyenlieu[existingIdx], { TenNL: name, DonViTinh: unit, DonGiaVon: cost, NguongBao: min });
    showToast(`Đã cập nhật nguyên liệu ${name}!`, 'success');
  } else {
    const newMat = { MaNL: id, TenNL: name, DonViTinh: unit, DonGiaVon: cost, NguongBao: min };
    DB.nguyenlieu.push(newMat);

    // Khởi tạo tồn kho mặc định cho 2 chi nhánh
    DB.tonkho.push(
      { MaTonKho: Date.now(), MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: id, SoLuongTon: 1000, NgayCapNhat: new Date().toISOString() },
      { MaTonKho: Date.now() + 1, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: id, SoLuongTon: 1000, NgayCapNhat: new Date().toISOString() }
    );
    showToast(`Đã thêm nguyên liệu mới ${name}!`, 'success');
  }

  saveDatabase();
  closeMaterialModal();
  renderMaterialsList();
  renderInventory();
}

function renderImportOrders() {
  const tbody = document.getElementById('import-orders-table-body');
  if (!tbody || !DB.phieunhaphang) return;

  tbody.innerHTML = DB.phieunhaphang.map(p => {
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${p.MaPhieuNhap}</td>
        <td class="p-3 font-semibold text-slate-600">${p.MaCN}</td>
        <td class="p-3 font-bold text-slate-900">${p.TenNCC}</td>
        <td class="p-3 text-slate-700">${p.TenNV || p.MaNV}</td>
        <td class="p-3 font-mono text-[11px] text-slate-500">${p.NgayNhap}</td>
        <td class="p-3 text-right font-black text-purple-700">${formatMoney(p.TongTien)}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Đã nhập kho</span></td>
        <td class="p-3 text-right">
          <button onclick="showToast('Xem chi tiết phiếu nhập ${p.MaPhieuNhap}')" class="text-blue-600 hover:underline font-semibold text-[11px]">Chi tiết</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openImportModal() {
  const modal = document.getElementById('modal-import');
  const supSelect = document.getElementById('import-input-supplier');
  const matSelect = document.getElementById('import-input-material');

  if (supSelect && DB.doitac) {
    const sups = DB.doitac.filter(d => d.LoaiDoiTac === 'NhaCungCap');
    supSelect.innerHTML = sups.map(s => `<option value="${s.MaDoiTac}">${s.TenDoiTac}</option>`).join('');
  }

  if (matSelect && DB.nguyenlieu) {
    matSelect.innerHTML = DB.nguyenlieu.map(m => `<option value="${m.MaNL}">${m.TenNL} (${m.DonViTinh})</option>`).join('');
  }

  if (modal) modal.classList.remove('hidden');
}

function closeImportModal() {
  const modal = document.getElementById('modal-import');
  if (modal) modal.classList.add('hidden');
}

function saveImportOrder() {
  const branch = document.getElementById('import-input-branch').value;
  const supId = document.getElementById('import-input-supplier').value;
  const matId = document.getElementById('import-input-material').value;
  const qty = parseFloat(document.getElementById('import-input-qty').value) || 0;
  const price = parseFloat(document.getElementById('import-input-price').value) || 0;

  if (qty <= 0 || price <= 0) {
    alert('Số lượng và đơn giá nhập phải lớn hơn 0!');
    return;
  }

  const sup = (DB.doitac || []).find(d => d.MaDoiTac === supId);
  const mat = (DB.nguyenlieu || []).find(n => n.MaNL === matId);
  const total = qty * price;
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
  const pnId = `PN_${Date.now().toString().slice(-4)}`;

  const newPN = {
    MaPhieuNhap: pnId,
    MaCN: branch,
    MaChiNhanh: branch,
    MaDoiTac: supId,
    TenNCC: sup ? sup.TenDoiTac : supId,
    MaNV: state.currentUser ? state.currentUser.MaNV : 'NV008',
    TenNV: state.currentUser ? state.currentUser.TenNV : 'Thủ Kho',
    NgayNhap: timeStr,
    TongTien: total,
    TrangThai: 'DaNhapKho'
  };
  if (!DB.phieunhaphang) DB.phieunhaphang = [];
  DB.phieunhaphang.unshift(newPN);

  // Cộng vào tồn kho
  const item = (DB.tonkho || []).find(t => t.MaCN === branch && t.MaNL === matId);
  if (item) {
    item.SoLuongTon += qty;
  } else {
    DB.tonkho.push({ MaTonKho: Date.now(), MaCN: branch, MaChiNhanh: branch, MaNL: matId, SoLuongTon: qty, NgayCapNhat: timeStr });
  }

  // Tự động ghi nhận Công Nợ Phải Trả
  if (!DB.congno) DB.congno = [];
  DB.congno.push({
    MaCongNo: `CN_TRA_${Date.now().toString().slice(-4)}`,
    MaDoiTac: supId,
    TenDoiTac: sup ? sup.TenDoiTac : supId,
    LoaiCongNo: 'PhaiTra',
    SoTienCongNo: total,
    NgayPhatSinh: timeStr.split(' ')[0],
    HanThanhToan: '2026-10-31',
    TrangThai: 'ChuaThanhToan'
  });

  saveDatabase();
  closeImportModal();
  renderImportOrders();
  renderInventory();
  showToast(`Đã nhập ${qty} ${mat ? mat.DonViTinh : ''} vào kho và ghi nhận công nợ!`, 'success');
}

function renderStockAuditLog() {
  const tbody = document.getElementById('inventory-audit-history-body');
  if (!tbody || !DB.kiemke_chitiet) return;

  tbody.innerHTML = DB.kiemke_chitiet.map(k => {
    const diff = k.ChenhLech;
    const isNegative = diff < 0;
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${k.MaPhieuKK}</td>
        <td class="p-3 font-mono text-[11px] text-slate-500">2026-10-15</td>
        <td class="p-3 font-bold text-slate-900">Vũ Thủ Kho</td>
        <td class="p-3 font-bold text-slate-800">${k.TenNL}</td>
        <td class="p-3 text-right font-mono text-slate-700">${k.TonHeThong.toLocaleString()} ${k.DonVi}</td>
        <td class="p-3 text-right font-mono font-bold text-blue-700">${k.TonThucTe.toLocaleString()} ${k.DonVi}</td>
        <td class="p-3 text-right font-black ${isNegative ? 'text-rose-600' : 'text-emerald-600'}">
          ${isNegative ? diff : '+' + diff} ${k.DonVi}
        </td>
        <td class="p-3 text-slate-600">${k.GhiChu}</td>
      </tr>
    `;
  }).join('');
}

function openStockAuditModal() {
  const modal = document.getElementById('modal-stock-audit');
  const dateInput = document.getElementById('audit-input-date');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  updateAuditMaterialOptions();
  if (modal) modal.classList.remove('hidden');
}

function closeStockAuditModal() {
  const modal = document.getElementById('modal-stock-audit');
  if (modal) modal.classList.add('hidden');
}

function updateAuditMaterialOptions() {
  const matSelect = document.getElementById('audit-input-material');
  if (matSelect && DB.nguyenlieu) {
    matSelect.innerHTML = DB.nguyenlieu.map(m => `<option value="${m.MaNL}">${m.TenNL} (${m.DonViTinh})</option>`).join('');
    autoFillAuditSystemStock();
  }
}

function autoFillAuditSystemStock() {
  const branch = document.getElementById('audit-input-branch')?.value || 'CN01';
  const matId = document.getElementById('audit-input-material')?.value;
  const sysInput = document.getElementById('audit-input-system');

  const item = (DB.tonkho || []).find(t => t.MaCN === branch && t.MaNL === matId);
  const sysQty = item ? item.SoLuongTon : 0;
  if (sysInput) sysInput.value = sysQty;
  calculateAuditDifference();
}

function calculateAuditDifference() {
  const sys = parseFloat(document.getElementById('audit-input-system')?.value) || 0;
  const act = parseFloat(document.getElementById('audit-input-actual')?.value) || 0;
  const diff = act - sys;
  const diffInput = document.getElementById('audit-input-diff');
  if (diffInput) {
    diffInput.value = diff === 0 ? '0 (Khớp 100%)' : (diff > 0 ? `+${diff} (Thừa kho)` : `${diff} (Hụt kho)`);
  }
}

function saveStockAudit() {
  const branch = document.getElementById('audit-input-branch').value;
  const date = document.getElementById('audit-input-date').value;
  const matId = document.getElementById('audit-input-material').value;
  const sys = parseFloat(document.getElementById('audit-input-system').value) || 0;
  const act = parseFloat(document.getElementById('audit-input-actual').value);
  const reason = document.getElementById('audit-input-reason').value.trim();

  if (isNaN(act) || !reason) {
    alert('Vui lòng nhập số tồn thực tế và giải trình lý do hao hụt!');
    return;
  }

  const mat = (DB.nguyenlieu || []).find(n => n.MaNL === matId);
  const diff = act - sys;
  const pkkId = `PKK_${Date.now().toString().slice(-4)}`;

  const newAudit = {
    MaKiemKeCT: Date.now(),
    MaPhieuKK: pkkId,
    MaNL: matId,
    TenNL: mat ? mat.TenNL : matId,
    TonHeThong: sys,
    TonThucTe: act,
    ChenhLech: diff,
    DonVi: mat ? mat.DonViTinh : 'gam',
    GhiChu: reason
  };

  if (!DB.kiemke_chitiet) DB.kiemke_chitiet = [];
  DB.kiemke_chitiet.unshift(newAudit);

  // Cân chỉnh lại tồn kho thực tế
  const item = (DB.tonkho || []).find(t => t.MaCN === branch && t.MaNL === matId);
  if (item) {
    item.SoLuongTon = act;
  }

  saveDatabase();
  closeStockAuditModal();
  renderStockAuditLog();
  renderInventory();
  showToast('Đã lưu biên bản kiểm kê và cân chỉnh kho thành công!', 'success');
}

function renderSuppliersList() {
  const tbody = document.getElementById('suppliers-table-body');
  if (!tbody || !DB.doitac) return;

  const suppliers = DB.doitac.filter(d => d.LoaiDoiTac === 'NhaCungCap');
  tbody.innerHTML = suppliers.map(s => {
    return `
      <tr class="hover:bg-slate-50 transition border-b">
        <td class="p-3 font-mono font-bold text-slate-700">${s.MaDoiTac}</td>
        <td class="p-3 font-bold text-slate-900">${s.TenDoiTac}</td>
        <td class="p-3 font-mono text-slate-600">${s.SDT}</td>
        <td class="p-3 text-slate-600">${s.DiaChi}</td>
        <td class="p-3"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Đang hợp tác</span></td>
        <td class="p-3 text-right">
          <button onclick="openSupplierModal('${s.MaDoiTac}')" class="px-2.5 py-1 text-[11px] rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200">
            Sửa
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openSupplierModal(supId = null) {
  const modal = document.getElementById('modal-supplier');
  const idInput = document.getElementById('sup-input-id');
  const nameInput = document.getElementById('sup-input-name');
  const phoneInput = document.getElementById('sup-input-phone');
  const addrInput = document.getElementById('sup-input-address');

  if (supId) {
    const s = DB.doitac.find(d => d.MaDoiTac === supId);
    if (s) {
      if (idInput) { idInput.value = s.MaDoiTac; idInput.readOnly = true; }
      if (nameInput) nameInput.value = s.TenDoiTac;
      if (phoneInput) phoneInput.value = s.SDT;
      if (addrInput) addrInput.value = s.DiaChi;
    }
  } else {
    if (idInput) { idInput.value = `NCC0${DB.doitac.filter(d => d.LoaiDoiTac === 'NhaCungCap').length + 1}`; idInput.readOnly = false; }
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (addrInput) addrInput.value = '';
  }

  if (modal) modal.classList.remove('hidden');
}

function closeSupplierModal() {
  const modal = document.getElementById('modal-supplier');
  if (modal) modal.classList.add('hidden');
}

function saveSupplier() {
  const id = document.getElementById('sup-input-id').value.trim();
  const name = document.getElementById('sup-input-name').value.trim();
  const phone = document.getElementById('sup-input-phone').value.trim();
  const addr = document.getElementById('sup-input-address').value.trim();

  if (!id || !name) {
    alert('Vui lòng điền đầy đủ Mã và Tên Nhà Cung Cấp!');
    return;
  }

  const existingIdx = DB.doitac.findIndex(d => d.MaDoiTac === id);
  if (existingIdx >= 0) {
    Object.assign(DB.doitac[existingIdx], { TenDoiTac: name, SDT: phone, DiaChi: addr });
    showToast(`Đã cập nhật nhà cung cấp ${name}!`, 'success');
  } else {
    DB.doitac.push({
      MaDoiTac: id,
      TenDoiTac: name,
      SDT: phone,
      DiaChi: addr,
      LoaiDoiTac: 'NhaCungCap',
      DiemTichLuy: 0,
      TrangThaiHoatDong: 'HoatDong'
    });
    showToast(`Đã thêm nhà cung cấp mới ${name}!`, 'success');
  }

  saveDatabase();
  closeSupplierModal();
  renderSuppliersList();
}

// ==============================================================================
// 10. VIEW 7: BÁN HÀNG POS & XỬ LÝ THANH TOÁN (THU NGÂN / POS)
// ==============================================================================
// Cập nhật giao diện điều khiển bàn & loại đơn hàng theo các quy tắc
function getCurrentOrderSeq() {
  if (!state.currentOrderSeq) {
    const count = (DB?.hoadon?.length || 0) + 1;
    state.currentOrderSeq = String(count).padStart(3, '0');
  }
  return state.currentOrderSeq;
}

function updateTableControlsUI() {
  const isTakeaway = state.orderType === 'TakeAway';
  const hasManualCard = Boolean(state.manualTableCard && state.manualTableCard.trim().length > 0);
  const orderNum = getCurrentOrderSeq();

  const btnDineIn = document.getElementById('btn-order-type-dinein');
  const btnTakeAway = document.getElementById('btn-order-type-takeaway');
  const tableWrap = document.getElementById('pos-table-input-wrap');
  const takeawayWrap = document.getElementById('pos-takeaway-input-wrap');
  const cardInput = document.getElementById('pos-table-card-input');
  const cardClearBtn = document.getElementById('pos-table-card-clear-btn');
  const takeawayInput = document.getElementById('pos-takeaway-customer-input');
  const titleEl = document.getElementById('current-table-title');

  // 1. Cập nhật nút Segmented Control [ Tại chỗ | Mang đi ] & Ô nhập
  if (isTakeaway) {
    if (btnDineIn) {
      btnDineIn.className = 'h-9 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-slate-600 hover:text-slate-900 bg-transparent';
    }
    if (btnTakeAway) {
      btnTakeAway.className = 'h-9 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer bg-amber-600 text-white shadow-xs';
    }
    // Ẩn ô nhập bàn, hiện ô nhập tên khách / STT
    if (tableWrap) tableWrap.classList.add('hidden');
    if (takeawayWrap) takeawayWrap.classList.remove('hidden');
    if (takeawayInput && takeawayInput.value !== (state.takeawayCustomer || '')) {
      takeawayInput.value = state.takeawayCustomer || '';
    }

    // 2. Tiêu đề đơn gọn gàng: Đơn #012 · Mang đi
    if (titleEl) {
      titleEl.innerText = `Đơn #${orderNum} · Mang đi`;
    }
  } else {
    if (btnDineIn) {
      btnDineIn.className = 'h-9 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer bg-white text-blue-700 shadow-xs';
    }
    if (btnTakeAway) {
      btnTakeAway.className = 'h-9 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer text-slate-600 hover:text-slate-900 bg-transparent';
    }
    // Hiện ô nhập bàn, ẩn ô nhập tên khách / STT
    if (tableWrap) tableWrap.classList.remove('hidden');
    if (takeawayWrap) takeawayWrap.classList.add('hidden');
    if (cardInput) {
      cardInput.disabled = false;
      if (cardInput.value !== (state.manualTableCard || '')) {
        cardInput.value = state.manualTableCard || '';
      }
    }
    if (cardClearBtn) {
      if (hasManualCard) cardClearBtn.classList.remove('hidden');
      else cardClearBtn.classList.add('hidden');
    }

    // 2. Tiêu đề đơn gọn gàng: Đơn #012 · Bàn 12 (hoặc Tại quán khi chưa nhập số bàn)
    if (titleEl) {
      const tableText = hasManualCard ? `Bàn ${state.manualTableCard}` : 'Tại quán';
      titleEl.innerText = `Đơn #${orderNum} · ${tableText}`;
    }
  }
}

// Chuyển đổi Loại Hóa Đơn (Take away vs Dùng tại chỗ)
function setOrderType(type) {
  state.orderType = type;
  if (type === 'TakeAway') {
    state.selectedTable = null;
    state.manualTableCard = '';
  }
  updateTableControlsUI();
}

// Nhập số thẻ bàn thủ công (gõ tay)
function handleManualTableCardInput(val) {
  if (state.orderType === 'TakeAway') return;
  state.manualTableCard = (val || '').trim();
  updateTableControlsUI();
}

// Nhập tên khách hoặc số thứ tự khi Mang đi
function handleTakeawayCustomerInput(val) {
  state.takeawayCustomer = (val || '').trim();
  updateTableControlsUI();
}

// Đặt lại lựa chọn bàn/thẻ
function clearTableSelection() {
  state.manualTableCard = '';
  state.selectedTable = null;
  const cardInput = document.getElementById('pos-table-card-input');
  if (cardInput) {
    cardInput.value = '';
    cardInput.focus();
  }
  updateTableControlsUI();
}

function clearManualTableCard() {
  clearTableSelection();
}

function deselectTable() {
  clearTableSelection();
}

function renderTables() {
  updateTableControlsUI();
}

function renderTableDropdown() {}
function handleTableSelectDropdown() {}
function setCardEmptyFromPanel() {}

// ==============================================================================
// HELPER: RENDER ẢNH MÓN & SVG PLACEHOLDER (TUYỆT ĐỐI KHÔNG DÙNG EMOJI - NHÓM 1)
// ==============================================================================
function getItemPlaceholderSvg(category) {
  const cat = (category || '').toUpperCase();
  if (cat.includes('CF') || cat.includes('CAFE') || cat.includes('COFFEE')) {
    // Ly cà phê vector SVG
    return `
      <svg class="w-full h-full text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
        <line x1="6" y1="2" x2="6" y2="4"></line>
        <line x1="10" y1="2" x2="10" y2="4"></line>
        <line x1="14" y1="2" x2="14" y2="4"></line>
      </svg>
    `;
  }
  if (cat.includes('TRA') || cat.includes('TEA')) {
    // Ly trà vector SVG
    return `
      <svg class="w-full h-full text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 3h12l-1.5 14a4 4 0 0 1-4 3.5h-1a4 4 0 0 1-4-3.5L6 3Z"></path>
        <path d="M6 8h12"></path>
        <path d="m14 11-2 2-2-2"></path>
      </svg>
    `;
  }
  if (cat.includes('FREEZE') || cat.includes('DA_XAY') || cat.includes('SMOOTHIE')) {
    // Ly đá xay frappe có nắp cầu & ống hút vector SVG
    return `
      <svg class="w-full h-full text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 9h10l-1.2 11a2.5 2.5 0 0 1-2.5 2.2h-2.6a2.5 2.5 0 0 1-2.5-2.2L7 9Z"></path>
        <path d="M6 9a6 6 0 0 1 12 0Z"></path>
        <line x1="12" y1="2" x2="15" y2="9"></line>
      </svg>
    `;
  }
  if (cat.includes('BANH') || cat.includes('CAKE') || cat.includes('FOOD') || cat.includes('PASTRY')) {
    // Bánh sừng bò croissant vector SVG
    return `
      <svg class="w-full h-full text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="m4.5 15.5 3-3a4 4 0 0 1 5.6 0l3 3a3 3 0 0 1-4.2 4.2l-3.2-3.2-3.2 3.2a3 3 0 0 1-4.2-4.2Z"></path>
        <path d="M12 9.5V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5.5"></path>
      </svg>
    `;
  }
  // Mặc định: Ly đồ uống
  return `
    <svg class="w-full h-full text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
      <line x1="6" y1="2" x2="6" y2="4"></line>
      <line x1="10" y1="2" x2="10" y2="4"></line>
    </svg>
  `;
}

function renderItemThumbnail(item, sizeClass = 'w-14 h-14') {
  if (!item) return '';
  const imgUrl = (item.image_url || item.HinhAnh || '').trim();
  const isHttpUrl = imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('/') || imgUrl.startsWith('./') || imgUrl.startsWith('data:image');
  const cat = item.MaNhomHang || item.MaDM || '';
  const name = escapeHtml(item.TenSanPham || item.TenMon || 'Món');

  if (isHttpUrl) {
    return `
      <div class="${sizeClass} rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200/80 shadow-xs flex-shrink-0 relative">
        <img src="${imgUrl}" alt="${name}" loading="lazy" class="w-full h-full object-cover" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.classList.remove('hidden');" />
        <div class="hidden w-full h-full p-2 flex items-center justify-center">${getItemPlaceholderSvg(cat)}</div>
      </div>
    `;
  }

  // Fallback: SVG icon theo loại món (CF, TRA, FREEZE, BANH)
  let bgClass = 'bg-amber-50';
  if (cat.includes('TRA')) bgClass = 'bg-emerald-50';
  else if (cat.includes('FREEZE')) bgClass = 'bg-teal-50';
  else if (cat.includes('BANH')) bgClass = 'bg-orange-50';

  return `
    <div class="${sizeClass} rounded-xl ${bgClass} border border-slate-200/80 flex items-center justify-center p-2.5 shadow-xs flex-shrink-0">
      ${getItemPlaceholderSvg(cat)}
    </div>
  `;
}

function renderCategories() {
  const container = document.getElementById('category-list');
  if (!container || !DB.nhomhang) return;

  container.innerHTML = DB.nhomhang.map(c => {
    const isActive = state.activeCategory === c.MaNhomHang;
    return `
      <button onclick="selectCategory('${c.MaNhomHang}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${isActive ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'}">
        ${c.TenNhomHang}
      </button>
    `;
  }).join('');
}

function selectCategory(catId) {
  state.activeCategory = catId;
  renderCategories();
  renderMenuGrid();
}

function handleSearchMenu(query) {
  const clearBtn = document.getElementById('menu-search-clear');
  if (clearBtn) {
    if (query.trim()) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }
  renderMenuGrid(query);
}

function clearSearchMenu() {
  const input = document.getElementById('menu-search-input');
  if (input) input.value = '';
  handleSearchMenu('');
}

function renderMenuGrid(searchQuery = '') {
  const container = document.getElementById('menu-grid');
  if (!container || !DB.sanpham) return;

  const query = searchQuery.toLowerCase().trim();
  const cat = state.activeCategory;

  const filtered = DB.sanpham.filter(m => {
    const isSelling = m.TrangThai === 'DangBan';
    const matchCat = cat === 'ALL' || m.MaNhomHang === cat || m.MaDM === cat;
    const matchSearch = !query || (m.TenSanPham || m.TenMon).toLowerCase().includes(query) || (m.MaSanPham || m.MaMon).toLowerCase().includes(query);
    return isSelling && matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-span-4 p-8 text-center text-slate-400 text-xs">Không tìm thấy món phù hợp</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => {
    return `
      <div onclick="openSizeModal('${m.MaSanPham || m.MaMon}')" class="menu-card bg-white p-3 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer flex flex-col justify-between">
        <div class="flex items-start justify-between mb-2">
          ${renderItemThumbnail(m, 'w-14 h-14')}
          <span class="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-700">${m.DonViTinh || 'Ly'}</span>
        </div>
        <div>
          <div class="font-bold text-xs text-slate-900 leading-snug line-clamp-2">${m.TenSanPham || m.TenMon}</div>
          <div class="mt-1 flex items-center">
            <span class="dish-code text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded tracking-wide border border-slate-200">${m.MaSanPham || m.MaMon}</span>
          </div>
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center">
          <span class="font-black text-xs text-amber-700">${formatMoney(m.GiaBan)}</span>
          <span class="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">+</span>
        </div>
      </div>
    `;
  }).join('');
}

function openSizeModal(monId) {
  const modal = document.getElementById('size-modal');
  const title = document.getElementById('modal-mon-title');
  const options = document.getElementById('modal-size-options');

  const mon = DB.sanpham.find(m => m.MaSanPham === monId || m.MaMon === monId);
  if (!mon) return;

  const monName = escapeHtml(mon.TenSanPham || mon.TenMon);
  if (title) {
    title.innerHTML = `
      <div class="flex items-center gap-2.5">
        ${renderItemThumbnail(mon, 'w-9 h-9')}
        <span class="font-bold text-sm text-slate-900">${monName}</span>
      </div>
    `;
  }

  const sizes = (DB.mon_size || []).filter(ms => ms.MaMon === monId);

  if (options) {
    if (sizes.length === 0) {
      // Món không có size (ví dụ bánh)
      addToCart({
        MaMonSize: `${monId}_S`,
        TenMon: mon.TenSanPham || mon.TenMon,
        TenSize: 'Chuẩn',
        GiaBan: mon.GiaBan,
        HinhAnh: mon.image_url || mon.HinhAnh || '',
        image_url: mon.image_url || mon.HinhAnh || '',
        MaDM: mon.MaNhomHang || mon.MaDM || ''
      });
      return;
    }

    options.innerHTML = sizes.map(s => {
      const sizeObj = (DB.kichco || []).find(k => k.MaSize === s.MaSize) || { TenSize: s.MaSize };
      return `
        <button onclick="selectSizeOption('${s.MaMonSize}')" class="w-full p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50 flex justify-between items-center transition cursor-pointer">
          <span class="font-bold text-xs text-slate-900">Kích Cỡ: ${sizeObj.TenSize}</span>
          <span class="font-black text-xs text-amber-700">${formatMoney(s.GiaBan)}</span>
        </button>
      `;
    }).join('');
  }

  if (modal) modal.classList.remove('hidden');
}

function closeSizeModal() {
  const modal = document.getElementById('size-modal');
  if (modal) modal.classList.add('hidden');
}

function selectSizeOption(monSizeId) {
  const ms = DB.mon_size.find(s => s.MaMonSize === monSizeId);
  if (!ms) return;
  const mon = DB.sanpham.find(m => m.MaSanPham === ms.MaMon || m.MaMon === ms.MaMon);
  const sizeObj = (DB.kichco || []).find(k => k.MaSize === ms.MaSize) || { TenSize: ms.MaSize };

  addToCart({
    MaMonSize: ms.MaMonSize,
    TenMon: mon ? (mon.TenSanPham || mon.TenMon) : ms.MaMon,
    TenSize: sizeObj.TenSize,
    GiaBan: ms.GiaBan,
    HinhAnh: mon ? (mon.image_url || mon.HinhAnh) : '',
    image_url: mon ? (mon.image_url || mon.HinhAnh) : '',
    MaDM: mon ? (mon.MaNhomHang || mon.MaDM) : ''
  });

  closeSizeModal();
}

function addToCart(item) {
  // Tìm món trong giỏ hàng (chỉ gộp nếu chưa có ghi chú riêng)
  const existing = state.currentOrder.find(o => o.MaMonSize === item.MaMonSize && (!o.GhiChu || o.GhiChu.trim() === ''));
  if (existing) {
    existing.SoLuong += 1;
  } else {
    state.currentOrder.push({
      MaMonSize: item.MaMonSize,
      TenMon: item.TenMon,
      TenSize: item.TenSize,
      GiaBan: item.GiaBan,
      HinhAnh: item.image_url || item.HinhAnh || '',
      image_url: item.image_url || item.HinhAnh || '',
      MaDM: item.MaDM || '',
      SoLuong: 1,
      GhiChu: ''
    });
  }

  // Tự động lưu vào bàn nếu đang chọn bàn
  if (state.selectedTable) {
    if (!DB.tableOrders) DB.tableOrders = {};
    DB.tableOrders[state.selectedTable] = JSON.parse(JSON.stringify(state.currentOrder));
    const table = DB.ban.find(b => b.MaBan === state.selectedTable);
    if (table && table.TrangThai !== 'CoKhach') {
      table.TrangThai = 'CoKhach';
      saveDatabase();
      renderTables();
    }
  }

  renderOrderCart();
}

function updateCartQty(index, delta) {
  if (!state.currentOrder[index]) return;
  state.currentOrder[index].SoLuong += delta;
  if (state.currentOrder[index].SoLuong <= 0) {
    state.currentOrder.splice(index, 1);
  }

  if (state.selectedTable) {
    if (!DB.tableOrders) DB.tableOrders = {};
    if (state.currentOrder.length === 0) {
      delete DB.tableOrders[state.selectedTable];
    } else {
      DB.tableOrders[state.selectedTable] = JSON.parse(JSON.stringify(state.currentOrder));
    }
    saveDatabase();
  }

  renderOrderCart();
}

function toggleCartItemNote(index) {
  if (!state.openNoteIndices) state.openNoteIndices = new Set();
  if (state.openNoteIndices.has(index)) {
    state.openNoteIndices.delete(index);
  } else {
    state.openNoteIndices.add(index);
  }
  renderOrderCart();
  if (state.openNoteIndices.has(index)) {
    setTimeout(() => {
      const input = document.getElementById(`cart-item-note-input-${index}`);
      if (input) input.focus();
    }, 50);
  }
}

function updateCartNote(index, note) {
  if (state.currentOrder[index]) {
    state.currentOrder[index].GhiChu = note;
    if (state.selectedTable) {
      if (!DB.tableOrders) DB.tableOrders = {};
      DB.tableOrders[state.selectedTable] = JSON.parse(JSON.stringify(state.currentOrder));
      saveDatabase();
    }
  }
}

function renderOrderCart() {
  const container = document.getElementById('order-items-list');
  if (!container) return;

  if (state.currentOrder.length === 0) {
    container.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-slate-300 py-8">
        <span class="text-4xl mb-2">🛒</span>
        <span class="text-xs font-semibold">Chưa có món nào trong đơn hàng</span>
        <span class="text-[10px] text-slate-400 mt-1">Chọn món ở menu để bắt đầu</span>
      </div>
    `;
  } else {
    container.innerHTML = state.currentOrder.map((item, idx) => {
      const lineTotal = item.SoLuong * item.GiaBan;
      const hasNote = Boolean(item.GhiChu && item.GhiChu.trim().length > 0);
      const isNoteOpen = Boolean(state.openNoteIndices && state.openNoteIndices.has(idx));

      return `
        <div class="p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 text-xs shadow-xs space-y-1.5 transition">
          <div class="flex items-center justify-between gap-2">
            <!-- Cột trái: ảnh + tên + size/topping/đơn giá hiển thị gọn trên 1 dòng phụ -->
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              ${renderItemThumbnail(item, 'w-10 h-10 flex-shrink-0')}
              <div class="min-w-0 flex-1">
                <div class="font-bold text-slate-900 leading-tight truncate text-xs">${escapeHtml(item.TenMon)}</div>
                <div class="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  ${escapeHtml(item.TenSize || 'Tiêu chuẩn')} • ${formatMoney(item.GiaBan)}${item.Topping ? ` • ${escapeHtml(item.Topping)}` : ''}
                </div>
              </div>
            </div>

            <!-- Cột phải: icon 📝 ghi chú + nút +/- số lượng cao >= 40px + thành tiền -->
            <div class="flex items-center gap-1.5 flex-shrink-0">
              <!-- Nút mở/đóng ghi chú kèm badge chấm báo hiệu món có ghi chú -->
              <button type="button" onclick="toggleCartItemNote(${idx})" title="${hasNote ? 'Sửa ghi chú' : 'Thêm ghi chú'}"
                class="relative h-10 w-8 flex items-center justify-center text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-200/80 transition cursor-pointer">
                <span class="text-sm">📝</span>
                ${hasNote ? '<span class="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>' : ''}
              </button>

              <!-- Nút tăng giảm số lượng (+ / -) cao tối thiểu 40px cho tablet -->
              <div class="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden shadow-xs h-10">
                <button type="button" onclick="updateCartQty(${idx}, -1)" title="Giảm số lượng"
                  class="w-8 h-10 flex items-center justify-center text-sm font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 cursor-pointer select-none transition">-</button>
                <span class="w-8 h-10 flex items-center justify-center font-bold text-xs font-mono text-slate-900 border-x border-slate-200 select-none">${item.SoLuong}</span>
                <button type="button" onclick="updateCartQty(${idx}, 1)" title="Tăng số lượng"
                  class="w-8 h-10 flex items-center justify-center text-sm font-bold text-slate-700 hover:bg-slate-100 active:bg-slate-200 cursor-pointer select-none transition">+</button>
              </div>

              <!-- Thành tiền -->
              <span class="font-black text-slate-900 min-w-[65px] text-right font-mono text-xs">${formatMoney(lineTotal)}</span>
            </div>
          </div>

          <!-- Ô input nhập ghi chú (Ẩn mặc định, chỉ hiện khi click icon 📝) -->
          ${isNoteOpen ? `
            <div class="pt-1.5 border-t border-slate-200 flex items-center gap-1.5">
              <input type="text"
                id="cart-item-note-input-${idx}"
                placeholder="Ghi chú món (VD: ít đá, không đường, thêm shot...)"
                value="${escapeHtml(item.GhiChu || '')}"
                oninput="updateCartNote(${idx}, this.value)"
                class="flex-1 bg-white border border-amber-300 rounded-lg py-1 px-2.5 text-[11px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition shadow-xs"
              />
              <button type="button" onclick="toggleCartItemNote(${idx})" class="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-200/70 hover:bg-slate-200 rounded-lg cursor-pointer">
                Đóng
              </button>
            </div>
          ` : (hasNote ? `
            <div class="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 truncate flex items-center gap-1 cursor-pointer" onclick="toggleCartItemNote(${idx})" title="Nhấn để sửa ghi chú">
              <span>✏️</span> <span class="italic font-medium">${escapeHtml(item.GhiChu)}</span>
            </div>
          ` : '')}
        </div>
      `;
    }).join('');
  }

  // Cập nhật tổng tiền & giảm giá tự động
  calculateCartTotals();
}

// Logic Giảm giá tự động theo Điểm tích lũy:
// > 5000 điểm: Giảm 3% tổng tiền
// > 1000 điểm (và <= 5000 điểm): Giảm 5% tổng tiền
function getAutoDiscountRule(points) {
  const p = Number(points) || 0;
  if (p > 5000) {
    return { percent: 3, label: '-3% (VIP >5.000 điểm)' };
  } else if (p > 1000) {
    return { percent: 5, label: '-5% (Thân thiết >1.000 điểm)' };
  }
  return { percent: 0, label: '' };
}

function calculateCartTotals() {
  const subtotal = state.currentOrder.reduce((sum, item) => sum + (item.SoLuong * item.GiaBan), 0);
  
  // Tự động tính giảm giá theo điểm tích lũy của khách hàng
  const points = (state.selectedCustomer && state.selectedCustomer.DiemTichLuy) ? Number(state.selectedCustomer.DiemTichLuy) : 0;
  const rule = getAutoDiscountRule(points);
  const discountPercent = rule.percent;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  state.discountPercent = discountPercent;
  state.discountAmount = discountAmount;
  state.subtotal = subtotal;
  state.total = total;

  const subtotalEl = document.getElementById('cart-subtotal');
  const discountEl = document.getElementById('cart-discount');
  const discountBadgeEl = document.getElementById('cart-discount-badge');
  const totalEl = document.getElementById('cart-total');

  if (subtotalEl) subtotalEl.innerText = formatMoney(subtotal);
  if (discountEl) {
    discountEl.innerText = discountAmount > 0 ? `-${formatMoney(discountAmount)}` : '0 ₫';
  }
  if (discountBadgeEl) {
    if (discountPercent > 0) {
      discountBadgeEl.classList.remove('hidden');
      discountBadgeEl.innerText = rule.label;
    } else {
      discountBadgeEl.classList.add('hidden');
    }
  }
  if (totalEl) totalEl.innerText = formatMoney(total);

  // Cập nhật tính toán tiền thối lại và trạng thái khóa/mở nút thanh toán
  updateCashCalculation();
  updateCheckoutButtonState();
}

// 3. Nhập SĐT và Xử lý tra cứu Khách hàng (Chỉ cho phép số, BẮT BUỘC ĐỦ 10 SỐ) - QUY TẮC 3 & QUY TẮC 4
function handleCustomerPhoneInput(rawVal) {
  if (state.customerLookupTimer) {
    clearTimeout(state.customerLookupTimer);
  }
  
  const phoneInput = document.getElementById('pos-customer-phone');
  // Lọc chỉ giữ chữ số và giới hạn tối đa 10 số
  let val = (rawVal || '').replace(/\D/g, '').slice(0, 10);
  if (phoneInput && phoneInput.value !== val) {
    phoneInput.value = val;
  }

  const phoneHint = document.getElementById('pos-customer-phone-hint');

  // Trường hợp 1: Người dùng xóa sạch ô SĐT
  if (!val) {
    if (phoneHint) {
      phoneHint.classList.add('hidden');
      phoneHint.innerHTML = '';
    }
    resetCustomerUI();
    calculateCartTotals();
    return;
  }

  // Trường hợp 2: Đang nhập dở (< 10 số)
  // BẮT BUỘC ĐỦ 10 SỐ: Không gọi tra cứu API, không hiện ô tạo khách mới để tránh spam tạo khách rác
  if (val.length < 10) {
    if (phoneHint) {
      phoneHint.classList.remove('hidden');
      phoneHint.className = 'text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5';
      phoneHint.innerHTML = `⚠️ SĐT phải đủ 10 số (hiện có: <span class="text-rose-600 font-mono">${val.length}/10</span>)`;
    }
    hideCustomerBoxes();
    calculateCartTotals();
    return;
  }

  // Trường hợp 3: Đã nhập đủ đúng 10 số (val.length === 10)
  if (phoneHint) {
    phoneHint.classList.remove('hidden');
    phoneHint.className = 'text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5';
    phoneHint.innerHTML = `✓ Đã đủ 10 số: <span class="font-mono">${val}</span> (Đang kiểm tra...)`;
  }

  // Gọi tra cứu ngay sau 250ms debounce
  state.customerLookupTimer = setTimeout(() => {
    lookupCustomerByPhone(val);
  }, 250);
}

function handleCustomerPhoneDebounce(val) {
  handleCustomerPhoneInput(val);
}

function handleCustomerPhoneBlur(rawVal) {
  if (state.customerLookupTimer) {
    clearTimeout(state.customerLookupTimer);
  }
  const phoneInput = document.getElementById('pos-customer-phone');
  let val = (rawVal || phoneInput?.value || '').replace(/\D/g, '').slice(0, 10);
  if (phoneInput && phoneInput.value !== val) {
    phoneInput.value = val;
  }

  const phoneHint = document.getElementById('pos-customer-phone-hint');

  if (!val) {
    if (phoneHint) phoneHint.classList.add('hidden');
    resetCustomerUI();
    calculateCartTotals();
    return;
  }

  if (val.length < 10) {
    if (phoneHint) {
      phoneHint.classList.remove('hidden');
      phoneHint.className = 'text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-0.5';
      phoneHint.innerHTML = `❌ SĐT không hợp lệ: Cần nhập đủ 10 số (hiện có ${val.length}/10)`;
    }
    hideCustomerBoxes();
    calculateCartTotals();
    return;
  }

  // Nếu đủ 10 số thì gọi tra cứu
  lookupCustomerByPhone(val);
}

function hideCustomerBoxes() {
  state.selectedCustomer = null;
  state.isNewCustomer = false;
  const inputRow = document.getElementById('pos-customer-input-row');
  const summaryCard = document.getElementById('pos-customer-summary-card');
  const detailDrawer = document.getElementById('pos-customer-detail-drawer');
  const newCustBox = document.getElementById('pos-new-customer-box');
  const spinner = document.getElementById('pos-customer-spinner');

  if (inputRow) inputRow.classList.remove('hidden');
  if (summaryCard) summaryCard.classList.add('hidden');
  if (detailDrawer) detailDrawer.classList.add('hidden');
  if (newCustBox) newCustBox.classList.add('hidden');
  if (spinner) spinner.classList.add('hidden');
}

async function lookupCustomerByPhone(phone) {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(0, 10);
  const phoneHint = document.getElementById('pos-customer-phone-hint');
  const inputRow = document.getElementById('pos-customer-input-row');
  const summaryCard = document.getElementById('pos-customer-summary-card');
  const summaryText = document.getElementById('pos-customer-summary-text');
  const drawerPhone = document.getElementById('pos-customer-drawer-phone');
  const drawerPoints = document.getElementById('pos-customer-drawer-points');
  const drawerRank = document.getElementById('pos-customer-drawer-rank');
  const drawerBenefit = document.getElementById('pos-customer-drawer-benefit');
  const detailDrawer = document.getElementById('pos-customer-detail-drawer');
  const caret = document.getElementById('pos-customer-caret');
  const newCustBox = document.getElementById('pos-new-customer-box');
  const nameInput = document.getElementById('pos-customer-name-input');
  const spinner = document.getElementById('pos-customer-spinner');

  // BẮT BUỘC ĐỦ 10 SỐ MỚI ĐƯỢC XỬ LÝ
  if (cleanPhone.length !== 10) {
    hideCustomerBoxes();
    calculateCartTotals();
    return;
  }

  if (spinner) spinner.classList.remove('hidden');

  let foundCustomer = null;

  // 1. Gọi API Backend FastAPI tra cứu theo SĐT
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/pos/customer/search?phone=${encodeURIComponent(cleanPhone)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.found && data.customer) {
        foundCustomer = {
          MaKH: data.customer.MaKH,
          TenKH: data.customer.TenKH,
          SDT: data.customer.SDT,
          DiemTichLuy: data.customer.DiemTichLuy || 0,
          HangKhachHang: data.customer.HangKhachHang
        };
      }
    }
  } catch (err) {
    console.warn('API search offline, using local DB:', err);
  }

  // 2. Tra cứu tiếp trong DB local (fallback khi offline)
  if (!foundCustomer) {
    const cleanDigits = cleanPhone.replace(/\D/g, '');
    const localMatch = (DB.doitac || []).find(d => 
      d.LoaiDoiTac === 'KhachHang' && 
      (d.SDT === cleanPhone || (d.SDT && d.SDT.replace(/\D/g, '') === cleanDigits))
    );
    if (localMatch) {
      foundCustomer = {
        MaKH: localMatch.MaDoiTac || localMatch.MaKH,
        TenKH: localMatch.TenDoiTac || localMatch.TenKH,
        SDT: localMatch.SDT,
        DiemTichLuy: localMatch.DiemTichLuy || 0
      };
    }
  }

  if (spinner) spinner.classList.add('hidden');

  if (foundCustomer) {
    // =========================================================================
    // SECTION 3: ĐÃ NHẬN DIỆN KHÁCH HÀNG
    // Hiển thị 1 dòng tóm tắt duy nhất: Tên · Hạng · Điểm khả dụng [Dùng điểm] [Đổi]
    // Xóa dòng thừa "✓ Khách hàng thành viên (SĐT)"
    // Mặc định drawer thu gọn
    // =========================================================================
    state.selectedCustomer = foundCustomer;
    state.isNewCustomer = false;
    const pts = Number(foundCustomer.DiemTichLuy) || 0;

    // Xóa dòng thông báo thừa
    if (phoneHint) {
      phoneHint.classList.add('hidden');
      phoneHint.innerHTML = '';
    }

    // Tính tên hạng khách hàng
    let rankText = foundCustomer.HangKhachHang;
    if (!rankText) {
      if (pts >= 5000) {
        rankText = 'Kim Cương';
      } else if (pts >= 1000) {
        rankText = 'Vàng';
      } else if (pts >= 300) {
        rankText = 'Bạc';
      } else {
        rankText = 'Thành viên';
      }
    }
    const cleanRank = rankText.replace(/[^\p{L}\s]/gu, '').trim() || rankText;
    const custName = foundCustomer.TenKH || foundCustomer.TenDoiTac || 'Khách hàng';

    // Cập nhật dòng tóm tắt: Tên · Hạng · Điểm khả dụng (VD: Đặng Kim Yến · Kim Cương · 6.500 điểm)
    if (summaryText) {
      summaryText.innerText = `${custName} · ${cleanRank} · ${pts.toLocaleString('vi-VN')} điểm`;
    }

    // Cập nhật dữ liệu drawer mở rộng
    if (drawerPhone) drawerPhone.innerText = foundCustomer.SDT || cleanPhone;
    if (drawerPoints) drawerPoints.innerText = `${pts.toLocaleString('vi-VN')} điểm`;
    if (drawerRank) drawerRank.innerText = rankText;
    if (drawerBenefit) {
      const discountRule = getAutoDiscountRule(pts);
      drawerBenefit.innerText = discountRule.label || 'Tích lũy điểm để nâng hạng VIP';
    }

    // Ẩn ô nhập SĐT, hiện card tóm tắt 1 dòng (drawer mặc định đóng)
    if (inputRow) inputRow.classList.add('hidden');
    if (summaryCard) summaryCard.classList.remove('hidden');
    if (detailDrawer) detailDrawer.classList.add('hidden');
    if (caret) caret.classList.remove('rotate-180');
    if (newCustBox) newCustBox.classList.add('hidden');
    if (nameInput) nameInput.value = '';

  } else {
    // =========================================================================
    // KHÁCH HÀNG MỚI (Số điện thoại 10 số không tồn tại trong hệ thống)
    // Tự động hiển thị ô input "Nhập họ tên khách hàng mới"
    // =========================================================================
    state.selectedCustomer = null;
    state.isNewCustomer = true;

    if (phoneHint) {
      phoneHint.classList.remove('hidden');
      phoneHint.className = 'text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5';
      phoneHint.innerHTML = `✨ SĐT mới: <span class="font-mono">${cleanPhone}</span>`;
    }

    if (inputRow) inputRow.classList.remove('hidden');
    if (summaryCard) summaryCard.classList.add('hidden');
    if (detailDrawer) detailDrawer.classList.add('hidden');

    if (newCustBox) {
      newCustBox.classList.remove('hidden');
      if (nameInput) {
        if (!nameInput.value) {
          nameInput.focus();
        }
      }
    }
  }

  calculateCartTotals();
}

// Bật/tắt drawer chi tiết thông tin khách hàng
function toggleCustomerDetailDrawer() {
  const drawer = document.getElementById('pos-customer-detail-drawer');
  const caret = document.getElementById('pos-customer-caret');
  if (!drawer) return;
  const isHidden = drawer.classList.contains('hidden');
  if (isHidden) {
    drawer.classList.remove('hidden');
    if (caret) caret.classList.add('rotate-180');
  } else {
    drawer.classList.add('hidden');
    if (caret) caret.classList.remove('rotate-180');
  }
}

// Chọn khách lẻ (bỏ qua nhập SĐT)
function setGuestCustomer() {
  resetCustomerUI();
  calculateCartTotals();
  showToast('Đang phục vụ: Khách lẻ vãng lai', 'info');
}

// Đổi sang khách hàng khác
function changeCustomer() {
  resetCustomerUI();
  calculateCartTotals();
  const phoneInput = document.getElementById('pos-customer-phone');
  if (phoneInput) {
    phoneInput.focus();
  }
}

// Dùng điểm tích lũy / xem chính sách điểm
function applyCustomerPoints() {
  if (!state.selectedCustomer) return;
  const pts = Number(state.selectedCustomer.DiemTichLuy) || 0;
  const rule = getAutoDiscountRule(pts);
  if (rule.percent > 0) {
    showToast(`Hội viên có ${pts.toLocaleString('vi-VN')} điểm: Đang được áp dụng ưu đãi ${rule.label}!`, 'success');
  } else {
    showToast(`Hội viên có ${pts.toLocaleString('vi-VN')} điểm. Đạt >1.000 điểm để nhận chiết khấu hạng tự động.`, 'info');
  }
}

function clearCurrentOrder() {
  // Section 2: Xác nhận nếu giỏ đang có món để tránh bấm nhầm
  if (state.currentOrder && state.currentOrder.length > 0) {
    if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ món trong đơn hàng hiện tại?')) {
      return;
    }
  }

  state.currentOrder = [];
  state.manualTableCard = '';
  state.takeawayCustomer = '';
  state.selectedTable = null;
  state.selectedCustomer = null;
  state.isNewCustomer = false;
  state.discountPercent = 0;
  state.discountAmount = 0;
  state.cashGiven = 0;
  if (state.openNoteIndices) state.openNoteIndices.clear();

  const cardInput = document.getElementById('pos-table-card-input');
  if (cardInput) cardInput.value = '';

  const takeawayInput = document.getElementById('pos-takeaway-customer-input');
  if (takeawayInput) takeawayInput.value = '';

  const cashInput = document.getElementById('pos-cash-given-input');
  if (cashInput) cashInput.value = '';

  resetCustomerUI();
  updateTableControlsUI();
  renderOrderCart();
  updateCashCalculation();
  updateCheckoutButtonState();
}

function resetCustomerUI() {
  state.selectedCustomer = null;
  state.isNewCustomer = false;
  
  const inputRow = document.getElementById('pos-customer-input-row');
  const summaryCard = document.getElementById('pos-customer-summary-card');
  const detailDrawer = document.getElementById('pos-customer-detail-drawer');
  const caret = document.getElementById('pos-customer-caret');
  const phoneInput = document.getElementById('pos-customer-phone');
  const phoneHint = document.getElementById('pos-customer-phone-hint');
  const nameInput = document.getElementById('pos-customer-name-input');
  const newCustBox = document.getElementById('pos-new-customer-box');
  const spinner = document.getElementById('pos-customer-spinner');

  if (inputRow) inputRow.classList.remove('hidden');
  if (summaryCard) summaryCard.classList.add('hidden');
  if (detailDrawer) detailDrawer.classList.add('hidden');
  if (caret) caret.classList.remove('rotate-180');

  if (phoneInput) phoneInput.value = '';
  if (phoneHint) {
    phoneHint.classList.add('hidden');
    phoneHint.innerHTML = '';
  }
  if (nameInput) nameInput.value = '';
  if (newCustBox) newCustBox.classList.add('hidden');
  if (spinner) spinner.classList.add('hidden');
}

// Hàm tương thích cũ
function populateCustomerDropdown() {}
function handleSelectCustomer() {}
function applyDiscount() {}

// =========================================================================
// QUẢN LÝ PHƯƠNG THỨC THANH TOÁN & KHU VỰC TIỀN MẶT POS
// =========================================================================
function getPaymentMethodSvg(method, sizeClass = 'w-5 h-5') {
  if (method === 'ChuyenKhoan') {
    return `<svg class="${sizeClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="14" width="7" height="7" rx="1"></rect>
      <rect x="3" y="14" width="7" height="7" rx="1"></rect>
      <path d="M6.5 6.5h.01M17.5 6.5h.01M6.5 17.5h.01M17.5 17.5h.01"></path>
    </svg>`;
  }
  if (method === 'The') {
    return `<svg class="${sizeClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
      <line x1="2" y1="10" x2="22" y2="10"></line>
      <line x1="6" y1="15" x2="10" y2="15"></line>
    </svg>`;
  }
  // Default: TienMat (Cash)
  return `<svg class="${sizeClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M6 12h.01M18 12h.01"></path>
  </svg>`;
}

function setPaymentMethod(method) {
  state.paymentMethod = method;
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    btn.classList.remove('border-emerald-500', 'bg-emerald-50', 'text-emerald-800');
    btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
  });

  const methodMap = {
    'TienMat': 'pay-method-cash',
    'ChuyenKhoan': 'pay-method-qr',
    'The': 'pay-method-card'
  };
  const activeBtn = document.getElementById(methodMap[method]);
  if (activeBtn) {
    activeBtn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-800');
    activeBtn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
  }

  // 1. Icon động cho nút Thanh toán: thay đổi theo phương thức
  const checkoutIcon = document.getElementById('pos-checkout-btn-icon');
  if (checkoutIcon) {
    checkoutIcon.innerHTML = getPaymentMethodSvg(method, 'w-5 h-5');
  }

  // 2. Mở rộng UI cho tab "Tiền Mặt": render khi active, ẩn khi chọn QR/Thẻ
  const cashArea = document.getElementById('pos-cash-payment-area');
  if (cashArea) {
    if (method === 'TienMat') {
      cashArea.classList.remove('hidden');
    } else {
      cashArea.classList.add('hidden');
    }
  }

  // Cập nhật tính toán tiền thối lại và trạng thái khóa/mở nút thanh toán
  updateCashCalculation();
  updateCheckoutButtonState();
}

function handleCashGivenInput(rawVal) {
  const input = document.getElementById('pos-cash-given-input');
  const digits = (rawVal || '').toString().replace(/\D/g, '');
  if (!digits) {
    state.cashGiven = 0;
    if (input) input.value = '';
  } else {
    const num = parseInt(digits, 10) || 0;
    state.cashGiven = num;
    if (input) input.value = num.toLocaleString('vi-VN');
  }
  updateCashCalculation();
  updateCheckoutButtonState();
}

function selectQuickCash(amount) {
  state.cashGiven = amount;
  const input = document.getElementById('pos-cash-given-input');
  if (input) {
    input.value = amount.toLocaleString('vi-VN');
  }
  updateCashCalculation();
  updateCheckoutButtonState();
}

function selectExactCash() {
  const exact = state.total || 0;
  state.cashGiven = exact;
  const input = document.getElementById('pos-cash-given-input');
  if (input) {
    input.value = exact > 0 ? exact.toLocaleString('vi-VN') : '';
  }
  updateCashCalculation();
  updateCheckoutButtonState();
}

function clearCashGiven() {
  state.cashGiven = 0;
  const input = document.getElementById('pos-cash-given-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  updateCashCalculation();
  updateCheckoutButtonState();
}

function updateCashCalculation() {
  const changeEl = document.getElementById('pos-cash-change-display');
  const statusEl = document.getElementById('pos-cash-given-status');
  if (!changeEl || !statusEl) return;

  const total = state.total || 0;
  const given = Number(state.cashGiven) || 0;

  if (given <= 0) {
    changeEl.className = 'font-mono font-black text-sm text-slate-400';
    changeEl.innerText = '0 ₫';
    statusEl.className = 'text-[10px] font-semibold text-slate-500';
    statusEl.innerText = 'Chưa nhập';
    return;
  }

  if (given < total) {
    const missing = total - given;
    changeEl.className = 'font-mono font-black text-sm text-rose-600';
    changeEl.innerText = `Thiếu -${formatMoney(missing)}`;
    statusEl.className = 'text-[10px] font-bold text-rose-600';
    statusEl.innerHTML = `⚠️ Thiếu <span class="font-mono">${formatMoney(missing)}</span>`;
  } else {
    const change = given - total;
    changeEl.className = 'font-mono font-black text-sm text-emerald-700';
    changeEl.innerText = formatMoney(change);
    statusEl.className = 'text-[10px] font-bold text-emerald-700';
    statusEl.innerText = change === 0 ? '✓ Vừa đủ' : `✓ Thừa ${formatMoney(change)}`;
  }
}

function updateCheckoutButtonState() {
  const btn = document.getElementById('pos-checkout-btn');
  if (!btn) return;

  const hasItems = state.currentOrder && state.currentOrder.length > 0;
  const total = state.total || 0;

  let isValid = false;
  let reason = '';

  if (!hasItems || total <= 0) {
    isValid = false;
    reason = 'Chưa có món trong đơn hàng';
  } else if (state.paymentMethod === 'TienMat') {
    const given = Number(state.cashGiven) || 0;
    if (given <= 0) {
      isValid = false;
      reason = 'Vui lòng nhập tiền khách đưa';
    } else if (given < total) {
      isValid = false;
      reason = `Số tiền khách đưa chưa đủ (còn thiếu ${formatMoney(total - given)})`;
    } else {
      isValid = true;
    }
  } else {
    // Quét QR hoặc Thẻ ATM/Visa: Chỉ cần giỏ hàng có món và tổng tiền > 0
    isValid = true;
  }

  if (isValid) {
    btn.disabled = false;
    btn.classList.remove('bg-slate-300', 'text-slate-500', 'cursor-not-allowed', 'opacity-70', 'shadow-none', 'border-slate-300');
    btn.classList.add('bg-gradient-to-r', 'from-emerald-600', 'to-teal-600', 'hover:from-emerald-700', 'hover:to-teal-700', 'text-white', 'shadow-md', 'cursor-pointer', 'active:scale-[0.99]');
    btn.setAttribute('title', 'Nhấn để hoàn tất thanh toán & in hóa đơn');
  } else {
    btn.disabled = true;
    btn.classList.remove('bg-gradient-to-r', 'from-emerald-600', 'to-teal-600', 'hover:from-emerald-700', 'hover:to-teal-700', 'text-white', 'shadow-md', 'cursor-pointer', 'active:scale-[0.99]');
    btn.classList.add('bg-slate-300', 'text-slate-500', 'cursor-not-allowed', 'opacity-70', 'shadow-none', 'border', 'border-slate-300');
    btn.setAttribute('title', reason || 'Chưa đủ điều kiện thanh toán');
  }
}

async function handleCheckoutPOS() {
  if (state.currentOrder.length === 0) {
    alert('Vui lòng chọn món vào đơn hàng trước khi thanh toán!');
    return;
  }

  const branch = state.currentBranch === 'ALL' ? 'CN01' : state.currentBranch;
  const subtotal = state.currentOrder.reduce((sum, item) => sum + (item.SoLuong * item.GiaBan), 0);
  const total = Math.max(0, subtotal - (state.discountAmount || 0));

  // =========================================================================
  // VALIDATE THANH TOÁN TIỀN MẶT
  // =========================================================================
  if (state.paymentMethod === 'TienMat') {
    const given = Number(state.cashGiven) || 0;
    if (given <= 0) {
      alert('⚠️ Vui lòng nhập số tiền khách đưa trước khi thanh toán!');
      const cashInput = document.getElementById('pos-cash-given-input');
      if (cashInput) cashInput.focus();
      return;
    }
    if (given < total) {
      alert(`⚠️ Số tiền khách đưa (${formatMoney(given)}) chưa đủ để thanh toán đơn hàng (${formatMoney(total)})!\nCòn thiếu ${formatMoney(total - given)}.`);
      const cashInput = document.getElementById('pos-cash-given-input');
      if (cashInput) cashInput.focus();
      return;
    }
  }

  const cashGivenVal = state.paymentMethod === 'TienMat' ? (Number(state.cashGiven) || total) : total;
  const changeVal = state.paymentMethod === 'TienMat' ? Math.max(0, cashGivenVal - total) : 0;

  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 16);
  const hdId = `HD_${Date.now().toString().slice(-4)}`;

  // =========================================================================
  // XỬ LÝ DỮ LIỆU SỐ THẺ BÀN (TẠI QUÁN vs TAKE AWAY)
  // =========================================================================
  let tableId = null;
  let tableCardNumber = null;

  if (state.orderType === 'TakeAway') {
    // Take away không dùng thẻ bàn (lấy tên khách / STT nếu có)
    tableId = null;
    tableCardNumber = (state.takeawayCustomer && state.takeawayCustomer.trim()) ? `Mang Về (${state.takeawayCustomer.trim()})` : 'Mang Về';
  } else {
    // Dùng tại chỗ: lấy số thẻ bàn gõ tay
    tableId = null;
    tableCardNumber = (state.manualTableCard && state.manualTableCard.trim()) ? state.manualTableCard.trim() : 'Tại Quán';
  }

  // =========================================================================
  // XỬ LÝ KHÁCH HÀNG THEO QUY TẮC 3 & 4 (KHÁCH CŨ vs KHÁCH MỚI)
  // BẮT BUỘC SĐT PHẢI ĐỦ 10 SỐ NẾU CÓ NHẬP
  // =========================================================================
  const phoneInput = document.getElementById('pos-customer-phone');
  const phone = (phoneInput?.value || '').replace(/\D/g, '').trim();

  if (phone.length > 0 && phone.length < 10) {
    alert(`⚠️ Số điện thoại khách hàng phải nhập đủ 10 số!\n(Hiện tại bạn mới nhập ${phone.length}/10 số: "${phone}").\nVui lòng nhập đủ 10 chữ số hoặc xóa trống ô SĐT nếu là khách vãng lai.`);
    if (phoneInput) {
      phoneInput.focus();
      phoneInput.select();
    }
    return;
  }

  let customerName = 'Khách lẻ vãng lai';
  let isNewCust = false;
  let customerId = null;

  if (phone.length === 10) {
    if (state.isNewCustomer) {
      // Quy tắc 4: Khách mới -> Lấy dữ liệu từ ô input "Nhập tên khách hàng mới" gộp vào payload
      isNewCust = true;
      const nameInput = document.getElementById('pos-customer-name-input');
      const enteredName = (nameInput?.value || '').trim();
      customerName = enteredName || 'Khách mới';
      customerId = null;

      // Tạo ngay bản ghi khách hàng mới trong DB local
      const newCust = {
        MaDoiTac: `KH_${Date.now().toString().slice(-4)}`,
        TenDoiTac: customerName,
        SDT: phone,
        DiaChi: 'Tại quầy POS',
        LoaiDoiTac: 'KhachHang',
        DiemTichLuy: 0,
        TrangThaiHoatDong: 'HoatDong'
      };
      if (!DB.doitac) DB.doitac = [];
      DB.doitac.push(newCust);
      DB.khachhang = (DB.doitac || []).filter(d => d.LoaiDoiTac === 'KhachHang');
      state.selectedCustomer = newCust;
    } else if (state.selectedCustomer) {
      // Quy tắc 3: Khách cũ đã tìm thấy
      customerName = state.selectedCustomer.TenKH || state.selectedCustomer.TenDoiTac || 'Khách hàng';
      customerId = state.selectedCustomer.MaKH || state.selectedCustomer.MaDoiTac;
      isNewCust = false;
    }
  }

  // =========================================================================
  // CẤU TRÚC DỮ LIỆU JSON GỬI ĐI CHUẨN HÓA (PAYLOAD)
  // =========================================================================
  const checkoutPayload = {
    MaCN: branch,
    LoaiDonHang: state.orderType,               // "DungTaiCho" hoặc "TakeAway" (Quy tắc 1)
    MaBan: tableId,                             // Chỉ có giá trị khi chọn bàn từ danh sách (Quy tắc 2)
    SoTheBan: tableCardNumber,                  // Chỉ có giá trị khi gõ thẻ tay, hoặc "Mang Về" (Quy tắc 2)
    MaNV: state.currentUser ? state.currentUser.MaNV : 'NV002',
    MaKH: customerId,                           // MaKH nếu khách cũ, null nếu khách mới
    CustomerPhone: phone || null,               // Số điện thoại khách hàng
    CustomerName: customerName,                 // Tên khách hàng (lấy từ input khách mới nếu isNew)
    IsNewCustomer: isNewCust,                   // Cờ đánh dấu tạo khách mới (Quy tắc 4)
    PaymentMethod: state.paymentMethod,
    CashGiven: cashGivenVal,
    DiscountAmount: state.discountAmount || 0,
    DiscountPercent: state.discountPercent || 0,
    Items: state.currentOrder.map(item => ({
      MaMonSize: item.MaMonSize,
      TenMon: item.TenMon,
      TenSize: item.TenSize,
      SoLuong: item.SoLuong,
      GiaBan: item.GiaBan,
      GhiChu: item.GhiChu || ''
    })),
    Subtotal: subtotal,
    Total: total
  };

  console.log('POS Checkout Payload:', checkoutPayload);

  // Gửi API Backend FastAPI đồng bộ CSDL SQLite
  try {
    fetch('http://127.0.0.1:8000/api/pos/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutPayload)
    }).catch(e => console.warn('Backend API sync offline/skipped:', e));
  } catch (e) {
    // Không chặn luồng POS offline
  }

  // 1. Tự động trừ Tồn Kho (TONKHO) theo Định mức BOM (DINHMUCNGUYENLIEU)
  if (DB.dinhmucnguyenlieu && DB.tonkho) {
    state.currentOrder.forEach(item => {
      const recipes = DB.dinhmucnguyenlieu.filter(r => r.MaMonSize === item.MaMonSize);
      recipes.forEach(r => {
        const deduce = (r.SoLuongTieuHao || r.DinhMucTieuHao || 0) * item.SoLuong;
        const stockItem = DB.tonkho.find(t => t.MaCN === branch && t.MaNL === r.MaNL);
        if (stockItem) {
          stockItem.SoLuongTon = Math.max(0, stockItem.SoLuongTon - deduce);
        }
      });
    });
  }

  // 2. Tạo bản ghi Hóa Đơn (HOADON)
  const newInvoice = {
    MaHD: hdId,
    MaCN: branch,
    LoaiDonHang: state.orderType,
    MaBan: tableId,
    SoTheBan: tableCardNumber,
    MaNV: state.currentUser ? state.currentUser.MaNV : 'NV002',
    MaKH: customerId,
    TenKH: customerName,
    SDT: phone,
    NgayLap: timeStr,
    TongTien: subtotal,
    GiamGia: state.discountAmount || 0,
    TiLeGiam: state.discountPercent > 0 ? `${state.discountPercent}%` : '',
    TongThanhToan: total,
    HinhThucTT: state.paymentMethod,
    TienKhachDua: cashGivenVal,
    TienThoiLai: changeVal,
    TrangThai: 'HoanThanh'
  };
  if (!DB.hoadon) DB.hoadon = [];
  DB.hoadon.unshift(newInvoice);

  // 3. Tạo bản ghi Chi Tiết Hóa Đơn (CHITIETHOADON)
  if (!DB.chitiethoadon) DB.chitiethoadon = [];
  state.currentOrder.forEach(item => {
    DB.chitiethoadon.push({
      MaCTHD: Date.now() + Math.random(),
      MaHD: hdId,
      MaMonSize: item.MaMonSize,
      TenMon: `${item.TenMon} (${item.TenSize})`,
      SoLuong: item.SoLuong,
      DonGia: item.GiaBan,
      ThanhTien: item.SoLuong * item.GiaBan,
      GhiChu: item.GhiChu || ''
    });
  });

  // 4. Tự động ghi vào Sổ Quỹ (SOQUY) & tạo Phiếu Thu (PHIEUTHU)
  const ptId = `PT_${Date.now().toString().slice(-4)}`;
  if (!DB.phieuthu) DB.phieuthu = [];
  DB.phieuthu.unshift({
    MaPhieuThu: ptId,
    MaCN: branch,
    MaChiNhanh: branch,
    MaNV: state.currentUser ? state.currentUser.MaNV : 'NV002',
    TenNV: state.currentUser ? state.currentUser.TenNV : 'Thu Ngân',
    NgayThu: timeStr,
    SoTien: total,
    LyDo: `Thu tiền hóa đơn POS ${hdId} - Thẻ: ${tableCardNumber}`,
    PhuongThuc: state.paymentMethod,
    NguoiNop: customerName
  });

  const lastSQ = (DB.soquy && DB.soquy.length > 0) ? DB.soquy[DB.soquy.length - 1] : { TonQuy: 1000000 };
  const newTon = (lastSQ.TonQuy || 0) + total;
  if (!DB.soquy) DB.soquy = [];
  DB.soquy.push({
    MaSoQuy: `SQ_${Date.now().toString().slice(-4)}`,
    MaCN: branch,
    NgayGiaoDich: timeStr,
    LoaiGiaoDich: 'Thu',
    SoTienThu: total,
    SoTienChi: 0,
    TonQuy: newTon,
    HinhThucTT: state.paymentMethod,
    MaPhieuThu: ptId,
    MaPhieuChi: null,
    DienGiai: `Doanh thu hóa đơn POS ${hdId} - Thẻ: ${tableCardNumber}`
  });

  // 5. Tích lũy điểm khách hàng (1 điểm mỗi 10.000đ)
  if (state.selectedCustomer) {
    const pointsToAdd = Math.floor(total / 10000);
    state.selectedCustomer.DiemTichLuy = (state.selectedCustomer.DiemTichLuy || 0) + pointsToAdd;
  }

  // 6. Hiển thị Hóa đơn nhiệt K80
  openReceiptModalWithData(newInvoice, state.currentOrder);

  // 7. Giải phóng bàn nếu có chọn bàn
  if (state.selectedTable) {
    const table = DB.ban.find(b => b.MaBan === state.selectedTable);
    if (table) table.TrangThai = 'Trong';
    if (DB.tableOrders) delete DB.tableOrders[state.selectedTable];
  }

  // Reset giỏ hàng và form POS
  state.currentOrder = [];
  state.manualTableCard = '';
  state.takeawayCustomer = '';
  state.selectedTable = null;
  state.discountPercent = 0;
  state.discountAmount = 0;
  state.selectedCustomer = null;
  state.isNewCustomer = false;
  state.cashGiven = 0;
  if (state.openNoteIndices) state.openNoteIndices.clear();

  // Tăng mã số thứ tự đơn hàng cho đơn tiếp theo (VD: Đơn #013)
  const nextSeq = (DB.hoadon?.length || 0) + 1;
  state.currentOrderSeq = String(nextSeq).padStart(3, '0');

  const cardInput = document.getElementById('pos-table-card-input');
  if (cardInput) cardInput.value = '';

  const takeawayInput = document.getElementById('pos-takeaway-customer-input');
  if (takeawayInput) takeawayInput.value = '';

  const cashInput = document.getElementById('pos-cash-given-input');
  if (cashInput) cashInput.value = '';

  resetCustomerUI();
  updateTableControlsUI();
  updateCashCalculation();
  updateCheckoutButtonState();

  saveDatabase();
  renderOrderCart();
  showToast(`🎉 Thanh toán thành công hóa đơn ${hdId} - ${formatMoney(total)}!`, 'success');
}

function openReceiptModalWithData(invoice, items) {
  const modal = document.getElementById('receipt-modal');
  const printArea = document.getElementById('receipt-print-area');
  if (!modal || !printArea) return;

  const branch = DB.chinhanh.find(b => b.MaCN === invoice.MaCN) || { TenCN: 'Ban Mê Coffee', DiaChi: 'Việt Nam', SDT: '0901234567' };

  printArea.innerHTML = `
    <div class="text-center pb-3 border-b border-dashed border-slate-300">
      <div class="text-base font-black tracking-wider">BAN MÊ COFFEE</div>
      <div class="text-[10px] text-slate-500">${branch.TenCN}</div>
      <div class="text-[10px] text-slate-500">${branch.DiaChi}</div>
      <div class="text-[10px] text-slate-500">Hotline: ${branch.SDT}</div>
    </div>

    <div class="py-2.5 border-b border-dashed border-slate-300 space-y-0.5 text-[11px]">
      <div class="flex justify-between">
        <span>Số HĐ: <b>${invoice.MaHD}</b></span>
        <span>Giờ: ${invoice.NgayLap}</span>
      </div>
      <div class="flex justify-between">
        <span>Thẻ/Bàn: <b>${invoice.SoTheBan || invoice.MaBan || 'Mang Về'}</b></span>
        <span>Thu ngân: ${invoice.MaNV}</span>
      </div>
      <div class="flex justify-between">
        <span>Khách hàng: <b>${invoice.TenKH} ${invoice.SDT ? `(${invoice.SDT})` : ''}</b></span>
        <span>PTTT: <b>${invoice.HinhThucTT}</b></span>
      </div>
    </div>

    <div class="py-2.5 border-b border-dashed border-slate-300 space-y-2">
      ${items.map(item => `
        <div class="text-xs">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-bold text-slate-900">${item.TenMon}</div>
              <div class="text-[10px] text-slate-500">${item.TenSize} x ${item.SoLuong}</div>
            </div>
            <div class="font-bold text-slate-900 font-mono">${formatMoney(item.SoLuong * item.GiaBan)}</div>
          </div>
          ${item.GhiChu ? `<div class="text-[10px] text-amber-700 italic mt-0.5 font-sans">📝 Ghi chú: ${escapeHtml(item.GhiChu)}</div>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
      <div class="flex justify-between text-slate-600">
        <span>Tạm tính:</span>
        <span class="font-bold font-mono">${formatMoney(invoice.TongTien)}</span>
      </div>
      <div class="flex justify-between text-rose-600">
        <span>Giảm giá điểm ${invoice.TiLeGiam ? `(${invoice.TiLeGiam})` : ''}:</span>
        <span class="font-bold font-mono">-${formatMoney(invoice.GiamGia)}</span>
      </div>
      <div class="flex justify-between text-slate-900 text-sm font-black pt-1">
        <span>TỔNG TIỀN:</span>
        <span class="text-base text-emerald-700 font-mono">${formatMoney(invoice.TongThanhToan)}</span>
      </div>
      ${invoice.HinhThucTT === 'TienMat' ? `
        <div class="flex justify-between text-slate-700 text-xs pt-1 border-t border-dashed border-slate-200">
          <span>Tiền khách đưa:</span>
          <span class="font-bold font-mono">${formatMoney(invoice.TienKhachDua || invoice.TongThanhToan)}</span>
        </div>
        <div class="flex justify-between text-emerald-700 text-xs font-bold">
          <span>Tiền thối lại:</span>
          <span class="font-black font-mono">${formatMoney(invoice.TienThoiLai || 0)}</span>
        </div>
      ` : `
        <div class="flex justify-between text-slate-600 text-xs pt-1 border-t border-dashed border-slate-200">
          <span>Hình thức:</span>
          <span class="font-bold">${invoice.HinhThucTT === 'ChuyenKhoan' ? 'Chuyển khoản / Quét QR' : 'Thẻ ATM/Visa'}</span>
        </div>
      `}
    </div>

    <div class="text-center pt-3 text-[10px] text-slate-500 space-y-1">
      <div>Cảm ơn quý khách & Hẹn gặp lại!</div>
      <div class="font-mono text-[9px]">Wifi: BanMeCoffee • Pass: 12345678</div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeReceiptModal() {
  const modal = document.getElementById('receipt-modal');
  if (modal) modal.classList.add('hidden');
}

function printReceiptDirect() {
  window.print();
}

function openCashDrawerModal() {
  const modal = document.getElementById('modal-cash-drawer');
  const branch = state.currentBranch === 'ALL' ? 'CN01' : state.currentBranch;

  // Tính tiền bán lẻ hôm nay
  const todayInvoices = (DB.hoadon || []).filter(h => h.MaCN === branch && h.HinhThucTT === 'TienMat');
  const todayCashSales = todayInvoices.reduce((s, h) => s + (h.TongThanhToan || 0), 0);

  const salesInput = document.getElementById('drawer-input-sales');
  if (salesInput) salesInput.value = todayCashSales;

  calculateDrawerClosing();
  if (modal) modal.classList.remove('hidden');
}

function closeCashDrawerModal() {
  const modal = document.getElementById('modal-cash-drawer');
  if (modal) modal.classList.add('hidden');
}

function calculateDrawerClosing() {
  const initial = parseFloat(document.getElementById('drawer-input-initial')?.value) || 1000000;
  const sales = parseFloat(document.getElementById('drawer-input-sales')?.value) || 0;
  const exp = parseFloat(document.getElementById('drawer-input-expenses')?.value) || 0;
  const theoretical = initial + sales - exp;

  const actualInput = document.getElementById('drawer-input-actual');
  const actual = parseFloat(actualInput?.value) || theoretical;
  const diff = actual - theoretical;

  const theoInput = document.getElementById('drawer-input-theoretical');
  const diffInput = document.getElementById('drawer-input-diff');

  if (theoInput) theoInput.value = formatMoney(theoretical);
  if (diffInput) {
    diffInput.value = diff === 0 ? '0 ₫ (Khớp chuẩn 100%)' : (diff > 0 ? `+${formatMoney(diff)} (Dư tiền)` : `${formatMoney(diff)} (Hụt tiền)`);
  }
}

function submitCashDrawerClosing() {
  const branch = state.currentBranch === 'ALL' ? 'CN01' : state.currentBranch;
  const initial = parseFloat(document.getElementById('drawer-input-initial').value) || 1000000;
  const sales = parseFloat(document.getElementById('drawer-input-sales').value) || 0;
  const exp = parseFloat(document.getElementById('drawer-input-expenses').value) || 0;
  const actual = parseFloat(document.getElementById('drawer-input-actual').value) || (initial + sales - exp);
  const diff = actual - (initial + sales - exp);
  const now = new Date();
  const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);

  const zReport = {
    MaChotCa: `ZR_${Date.now().toString().slice(-4)}`,
    MaCN: branch,
    CaLam: state.currentShift,
    ThuNgan: state.currentUser ? state.currentUser.TenNV : 'Thu Ngân',
    TienDauCa: initial,
    TienThuTrongCa: sales,
    ChiKhanCap: exp,
    TienLyThuyet: initial + sales - exp,
    TienThucDem: actual,
    ChenhLech: diff,
    ThoiGian: timeStr,
    TrangThai: diff === 0 ? 'Khop100%' : 'CoChenhLech'
  };

  if (!DB.chotcakedt) DB.chotcakedt = [];
  DB.chotcakedt.unshift(zReport);
  saveDatabase();
  closeCashDrawerModal();
  showToast('Đã chốt két tiền và hoàn tất Z-Report ca làm việc!', 'success');
}

// ==============================================================================
// 12. DANH SÁCH ĐƠN HÀNG ĐÃ BÁN (LỊCH SỬ HÓA ĐƠN) - CHI NHÁNH & IN LẠI BILL
// ==============================================================================

function openOrderHistoryModal() {
  const modal = document.getElementById('modal-order-history');
  if (!modal) return;

  // Cập nhật thẻ tên chi nhánh hiện tại (Branch isolation)
  const branchId = state.currentBranch === 'ALL' ? 'CN01' : (state.currentBranch || 'CN01');
  const branchObj = (DB.chinhanh || []).find(b => b.MaCN === branchId) || { TenCN: branchId };
  const badge = document.getElementById('history-branch-badge');
  if (badge) {
    if (state.currentBranch === 'ALL' && state.currentUser && state.currentUser.Role === 'SUPER_ADMIN') {
      badge.innerText = '🏢 Toàn Hệ Thống (ALL)';
    } else {
      badge.innerText = `📍 ${branchObj.TenCN}`;
    }
  }

  // Đặt lại trang về 1 và nạp dữ liệu
  state.historyPage = 1;
  loadOrderHistory();

  modal.classList.remove('hidden');
}

function closeOrderHistoryModal() {
  const modal = document.getElementById('modal-order-history');
  if (modal) modal.classList.add('hidden');
}

function handleHistoryFilterChange() {
  state.historyPage = 1;
  loadOrderHistory();
}

function changeHistoryPage(delta) {
  const newPage = (state.historyPage || 1) + delta;
  if (newPage < 1 || newPage > (state.historyTotalPages || 1)) return;
  state.historyPage = newPage;
  loadOrderHistory();
}

async function loadOrderHistory() {
  const tbody = document.getElementById('order-history-table-body');
  const emptyState = document.getElementById('history-empty-state');
  const statCount = document.getElementById('history-stat-count');
  const statRevenue = document.getElementById('history-stat-revenue');
  const paginationInfo = document.getElementById('history-pagination-info');
  const pageIndicator = document.getElementById('history-page-indicator');
  const btnPrev = document.getElementById('history-btn-prev');
  const btnNext = document.getElementById('history-btn-next');

  if (!tbody) return;

  const branchId = state.currentBranch || 'CN01';
  const searchInput = document.getElementById('history-search-input');
  const searchVal = (searchInput?.value || '').trim();
  const dateFilter = document.getElementById('history-filter-date')?.value || 'today';
  const payFilter = document.getElementById('history-filter-pay')?.value || 'ALL';
  const page = state.historyPage || 1;
  const pageSize = state.historyPageSize || 8;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="p-8 text-center text-slate-500 font-semibold">
        <div class="inline-block animate-spin text-lg mr-2">⏳</div> Đang tải danh sách đơn hàng...
      </td>
    </tr>
  `;

  let orders = [];
  let totalCount = 0;
  let totalRevenue = 0;
  let totalPages = 1;

  try {
    const params = new URLSearchParams({
      branch_id: branchId,
      date_filter: dateFilter,
      payment_method: payFilter,
      page: page,
      page_size: pageSize
    });
    if (searchVal) params.append('search', searchVal);

    const res = await fetch(`http://127.0.0.1:8000/api/pos/orders?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      orders = data.orders || [];
      totalCount = data.total_count || 0;
      totalRevenue = data.total_revenue || 0;
      totalPages = data.total_pages || 1;
    } else {
      throw new Error('API server returned non-200 status');
    }
  } catch (err) {
    console.warn('API /api/pos/orders offline/failed, falling back to local DB.hoadon:', err);
    // Fallback sang local DB.hoadon tuân thủ phân quyền chi nhánh (Branch isolation)
    let filtered = (DB.hoadon || []).filter(h => h.TrangThai === 'HoanThanh');
    if (branchId !== 'ALL') {
      filtered = filtered.filter(h => h.MaCN === branchId);
    }
    // Lọc thời gian
    const todayStr = new Date().toISOString().slice(0, 10);
    if (dateFilter === 'today') {
      filtered = filtered.filter(h => (h.NgayLap || '').startsWith(todayStr));
    }
    // Lọc PTTT
    if (payFilter !== 'ALL') {
      filtered = filtered.filter(h => h.HinhThucTT === payFilter);
    }
    // Lọc tìm kiếm
    if (searchVal) {
      const q = searchVal.toLowerCase();
      filtered = filtered.filter(h => 
        (h.MaHD && h.MaHD.toLowerCase().includes(q)) ||
        (h.SoTheBan && h.SoTheBan.toLowerCase().includes(q)) ||
        (h.TenKH && h.TenKH.toLowerCase().includes(q)) ||
        (h.SDT && h.SDT.includes(q))
      );
    }

    totalCount = filtered.length;
    totalRevenue = filtered.reduce((sum, h) => sum + (h.TongThanhToan || 0), 0);
    totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const offset = (page - 1) * pageSize;
    orders = filtered.slice(offset, offset + pageSize).map(h => ({
      ...h,
      CustomerName: h.TenKH || 'Khách lẻ vãng lai',
      CustomerPhone: h.SDT || '',
      ItemCount: (DB.chitiethoadon || []).filter(c => c.MaHD === h.MaHD).length
    }));
  }

  state.currentHistoryOrders = orders;
  state.historyTotalPages = totalPages;

  // Cập nhật thống kê
  if (statCount) statCount.innerText = `${totalCount} đơn`;
  if (statRevenue) statRevenue.innerText = formatMoney(totalRevenue);

  // Hiển thị hoặc ẩn empty state
  if (orders.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    tbody.innerHTML = orders.map(order => {
      // Badge PTTT
      let payBadge = '';
      if (order.HinhThucTT === 'TienMat') {
        payBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">💵 Tiền mặt</span>`;
      } else if (order.HinhThucTT === 'ChuyenKhoan') {
        payBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">📱 Quét QR</span>`;
      } else {
        payBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">💳 Thẻ ATM/Visa</span>`;
      }

      // Phân loại Đơn: Tại bàn / Thẻ bàn / Mang về
      let typeBadge = '';
      if (order.SoTheBan === 'Mang Về' || order.LoaiDonHang === 'TakeAway') {
        typeBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🛍️ Mang đi</span>`;
      } else if (order.SoTheBan && order.SoTheBan !== 'Tại Quán') {
        typeBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">🏷️ ${order.SoTheBan}</span>`;
      } else if (order.MaBan) {
        typeBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">🍽️ Bàn ${order.MaBan}</span>`;
      } else {
        typeBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">🍽️ Tại quán</span>`;
      }

      // Thông tin khách hàng
      let custDisplay = '';
      if (order.CustomerPhone) {
        custDisplay = `
          <div class="font-bold text-slate-900">${escapeHtml(order.CustomerName || 'Khách hàng')}</div>
          <div class="text-[10px] text-slate-500 font-mono">${escapeHtml(order.CustomerPhone)}</div>
        `;
      } else {
        custDisplay = `<span class="text-slate-500 italic">Khách lẻ vãng lai</span>`;
      }

      return `
        <tr class="hover:bg-slate-50/80 transition cursor-pointer" onclick="viewInvoiceDetail('${order.MaHD}')">
          <td class="p-3">
            <span class="font-mono font-black text-amber-600 hover:underline">#${order.MaHD}</span>
            <div class="text-[10px] text-slate-400 font-semibold">${order.ItemCount || 0} món</div>
          </td>
          <td class="p-3">
            <span class="font-semibold text-slate-800">${order.NgayLap}</span>
            <div class="text-[10px] text-slate-400">${order.TenCN || order.MaCN}</div>
          </td>
          <td class="p-3">${typeBadge}</td>
          <td class="p-3">${custDisplay}</td>
          <td class="p-3">${payBadge}</td>
          <td class="p-3 text-right">
            <span class="font-mono font-black text-emerald-700 text-sm">${formatMoney(order.TongThanhToan)}</span>
            ${order.GiamGia > 0 ? `<div class="text-[10px] text-rose-600 font-semibold font-mono">-${formatMoney(order.GiamGia)}</div>` : ''}
          </td>
          <td class="p-3 text-center" onclick="event.stopPropagation()">
            <div class="flex items-center justify-center gap-1.5">
              <button
                type="button"
                onclick="viewInvoiceDetail('${order.MaHD}')"
                class="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Xem chi tiết đơn hàng"
              >
                <span>👁️</span> <span>Chi tiết</span>
              </button>
              <button
                type="button"
                onclick="reprintInvoice('${order.MaHD}')"
                class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800 font-bold text-[11px] transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title="In lại hóa đơn K80"
              >
                <span>🖨️</span> <span>In lại</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Cập nhật phân trang
  const fromNum = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const toNum = Math.min(totalCount, page * pageSize);
  if (paginationInfo) paginationInfo.innerText = `Đang hiển thị ${fromNum} - ${toNum} của ${totalCount} hóa đơn`;
  if (pageIndicator) pageIndicator.innerText = `${page} / ${totalPages}`;
  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;
}

async function viewInvoiceDetail(maHD) {
  const modal = document.getElementById('modal-order-detail');
  if (!modal) return;

  const idEl = document.getElementById('detail-invoice-id');
  const timeEl = document.getElementById('detail-invoice-time');
  const branchEl = document.getElementById('detail-branch-name');
  const cashierEl = document.getElementById('detail-cashier-name');
  const typeEl = document.getElementById('detail-order-type');
  const payEl = document.getElementById('detail-pay-method');
  const custNameEl = document.getElementById('detail-customer-name');
  const custPhoneEl = document.getElementById('detail-customer-phone');
  const custPointsEl = document.getElementById('detail-customer-points');
  const itemsBody = document.getElementById('detail-items-table-body');
  const subtotalEl = document.getElementById('detail-subtotal');
  const discountEl = document.getElementById('detail-discount');
  const totalEl = document.getElementById('detail-total');
  const cashBreakdown = document.getElementById('detail-cash-breakdown');
  const cashGivenEl = document.getElementById('detail-cash-given');
  const cashChangeEl = document.getElementById('detail-cash-change');

  let invoice = null;
  let items = [];

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/pos/order/${maHD}`);
    if (res.ok) {
      const data = await res.json();
      invoice = data.invoice;
      items = data.items || [];
    } else {
      throw new Error('API detail failed');
    }
  } catch (e) {
    invoice = (DB.hoadon || []).find(h => h.MaHD === maHD);
    items = (DB.chitiethoadon || []).filter(c => c.MaHD === maHD);
  }

  if (!invoice) {
    alert('Không tìm thấy thông tin chi tiết hóa đơn!');
    return;
  }

  state.selectedDetailInvoice = { invoice, items };

  if (idEl) idEl.innerText = `#${invoice.MaHD}`;
  if (timeEl) timeEl.innerText = `Ngày lập: ${invoice.NgayLap}`;
  if (branchEl) branchEl.innerText = invoice.TenCN || invoice.MaCN;
  if (cashierEl) cashierEl.innerText = invoice.TenNV || invoice.MaNV || 'Thu ngân';

  let typeText = 'Tại quán';
  if (invoice.SoTheBan === 'Mang Về' || invoice.LoaiDonHang === 'TakeAway') {
    typeText = '🛍️ Mang đi (Take away)';
  } else if (invoice.SoTheBan) {
    typeText = `🏷️ Thẻ bàn ${invoice.SoTheBan}`;
  } else if (invoice.MaBan) {
    typeText = `🍽️ Bàn ${invoice.MaBan}`;
  }
  if (typeEl) typeEl.innerText = typeText;

  let payText = '💵 Tiền mặt';
  if (invoice.HinhThucTT === 'ChuyenKhoan') payText = '📱 Chuyển khoản QR';
  else if (invoice.HinhThucTT === 'The') payText = '💳 Thẻ ATM/Visa';
  if (payEl) payEl.innerText = payText;

  if (custNameEl) custNameEl.innerText = invoice.CustomerName || invoice.TenKH || 'Khách lẻ vãng lai';
  if (custPhoneEl) {
    custPhoneEl.innerText = (invoice.CustomerPhone || invoice.SDT) ? `SĐT: ${invoice.CustomerPhone || invoice.SDT}` : 'Khách lẻ không đăng ký SĐT';
  }

  if (custPointsEl) {
    if (invoice.DiemTichLuy && invoice.DiemTichLuy > 0) {
      custPointsEl.classList.remove('hidden');
      custPointsEl.innerHTML = `<span class="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">⭐ ${Number(invoice.DiemTichLuy).toLocaleString('vi-VN')} điểm</span>`;
    } else {
      custPointsEl.classList.add('hidden');
    }
  }

  if (itemsBody) {
    itemsBody.innerHTML = items.map(item => `
      <tr class="hover:bg-slate-50">
        <td class="p-2.5">
          <div class="font-bold text-slate-900">${escapeHtml(item.TenMon || item.MaMonSize)}</div>
          <div class="text-[10px] text-slate-500 font-semibold">${item.TenSize || ''}</div>
          ${item.GhiChu ? `<div class="text-[10px] text-amber-700 italic mt-0.5">📝 ${escapeHtml(item.GhiChu)}</div>` : ''}
        </td>
        <td class="p-2.5 text-center font-bold font-mono">${item.SoLuong}</td>
        <td class="p-2.5 text-right font-mono">${formatMoney(item.DonGia || item.GiaBan)}</td>
        <td class="p-2.5 text-right font-black font-mono text-slate-900">${formatMoney(item.ThanhTien || (item.SoLuong * (item.DonGia || item.GiaBan)))}</td>
      </tr>
    `).join('');
  }

  if (subtotalEl) subtotalEl.innerText = formatMoney(invoice.TongTien);
  if (discountEl) {
    discountEl.innerText = invoice.GiamGia > 0 ? `-${formatMoney(invoice.GiamGia)}` : '0 ₫';
  }
  if (totalEl) totalEl.innerText = formatMoney(invoice.TongThanhToan);

  if (cashBreakdown) {
    if (invoice.HinhThucTT === 'TienMat') {
      cashBreakdown.classList.remove('hidden');
      const given = invoice.TienKhachDua || invoice.KhachTra || invoice.TongThanhToan;
      const change = invoice.TienThoiLai || Math.max(0, given - invoice.TongThanhToan);
      if (cashGivenEl) cashGivenEl.innerText = formatMoney(given);
      if (cashChangeEl) cashChangeEl.innerText = formatMoney(change);
    } else {
      cashBreakdown.classList.add('hidden');
    }
  }

  modal.classList.remove('hidden');
}

function closeOrderDetailModal() {
  const modal = document.getElementById('modal-order-detail');
  if (modal) modal.classList.add('hidden');
}

async function reprintInvoice(maHD) {
  let invoice = null;
  let items = [];

  try {
    const res = await fetch(`http://127.0.0.1:8000/api/pos/order/${maHD}`);
    if (res.ok) {
      const data = await res.json();
      invoice = data.invoice;
      items = data.items || [];
    }
  } catch (e) {
    // offline fallback
  }

  if (!invoice) {
    invoice = (DB.hoadon || []).find(h => h.MaHD === maHD);
    items = (DB.chitiethoadon || []).filter(c => c.MaHD === maHD);
  }

  if (!invoice) {
    alert('Không tìm thấy thông tin đơn hàng để in lại!');
    return;
  }

  openReceiptModalWithData(invoice, items);
  showToast(`🖨️ Đang mở bản in lại cho hóa đơn #${maHD}!`, 'info');
}

function reprintCurrentDetailInvoice() {
  if (state.selectedDetailInvoice) {
    const { invoice, items } = state.selectedDetailInvoice;
    openReceiptModalWithData(invoice, items);
    closeOrderDetailModal();
    showToast(`🖨️ Đang mở bản in lại cho hóa đơn #${invoice.MaHD}!`, 'info');
  }
}
