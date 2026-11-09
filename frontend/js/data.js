// ==============================================================================
// DỮ LIỆU MOCK KHỞI TẠO CHUẨN 23 BẢNG THEO SƠ ĐỒ ERD & HỆ THỐNG UCD
// ==============================================================================

const DB = {
  // 1. BẢNG CHI NHÁNH (CHINHANH)
  chinhanh: [
    { MaCN: 'CN01', MaChiNhanh: 'CN01', TenCN: 'Cà Phê Sài Gòn - Quận 1', TenChiNhanh: 'Cà Phê Sài Gòn - Quận 1', DiaChi: '123 Nguyễn Huệ, Q.1, TP.HCM', SDT: '0901234567', TrangThai: 'HoatDong' },
    { MaCN: 'CN02', MaChiNhanh: 'CN02', TenCN: 'Cà Phê Sài Gòn - Cầu Giấy', TenChiNhanh: 'Cà Phê Sài Gòn - Cầu Giấy', DiaChi: '45 Cầu Giấy, Hà Nội', SDT: '0907654321', TrangThai: 'HoatDong' }
  ],

  // 2. BẢNG CHỨC VỤ (CHUCVU)
  chucvu: [
    { MaChucVu: 'CV01', TenChucVu: 'Chủ Quán', MoTa: 'Chủ hệ thống toàn chuỗi (Super Admin)' },
    { MaChucVu: 'CV02', TenChucVu: 'Quản Lý', MoTa: 'Quản lý vận hành chi nhánh' },
    { MaChucVu: 'CV03', TenChucVu: 'Thu Ngân', MoTa: 'Bán hàng POS và xử lý thanh toán' },
    { MaChucVu: 'CV04', TenChucVu: 'Nhân Viên Kho', MoTa: 'Quản lý kho và nguyên vật liệu' },
    { MaChucVu: 'CV05', TenChucVu: 'Pha Chế (Barista)', MoTa: 'Pha chế đồ uống theo công thức' }
  ],

  // 1.5. CẤU TRÚC VAI TRÒ HỆ THỐNG (ROLES) - 4 VAI TRÒ CHUẨN THEO UCD
  roles: [
    { RoleCode: 'SUPER_ADMIN', RoleName: 'Chủ Quán (Owner / Super Admin)', Scope: 'Toàn Chuỗi (ALL, CN01, CN02)' },
    { RoleCode: 'BRANCH_MANAGER', RoleName: 'Quản Lý Chi Nhánh (Manager)', Scope: 'Chi Nhánh Phân Công' },
    { RoleCode: 'CASHIER', RoleName: 'Thu Ngân (Cashier / POS)', Scope: 'Quầy Bán Hàng Chi Nhánh' },
    { RoleCode: 'WAREHOUSE', RoleName: 'Nhân Viên Kho (Warehouse Staff)', Scope: 'Kho Chi Nhánh & Nguyên Liệu' }
  ],

  // 3. BẢNG NHÂN VIÊN (NHANVIEN) - 4 VAI TRÒ UCD
  nhanvien: [
    { 
      MaNV: 'NV001', 
      MaNhanVien: 'NV001',
      TenNV: 'Trần Chủ Chuỗi', 
      TenNhanVien: 'Trần Chủ Chuỗi',
      GioiTinh: 'Nam',
      DiaChi: 'Số 42/6A Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      SDT: '0901111222',
      Email: 'chuchuoi@banmecafe.vn',
      Role: 'SUPER_ADMIN',
      MaChucVu: 'CV01',
      ChucVu: 'SUPER_ADMIN',
      ChucVuText: 'Chủ Quán (Super Admin / Owner)',
      Avatar: '👑',
      LuongTheoGio: 80000, 
      LuongCoBan: 80000,
      TenDangNhap: 'chuchuoi', 
      MatKhau: '1234', 
      MaPIN: '1111',
      AssignedBranches: ['ALL', 'CN01', 'CN02'],
      DefaultBranch: 'ALL',
      MaCN: 'CN01',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV006', 
      MaNhanVien: 'NV006',
      TenNV: 'Nguyễn Quản Lý (CN1)', 
      TenNhanVien: 'Nguyễn Quản Lý (CN1)',
      GioiTinh: 'Nam',
      DiaChi: 'Số 182/15 Đường Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
      SDT: '0906666777',
      Email: 'quanly1@banmecafe.vn',
      Role: 'BRANCH_MANAGER',
      MaChucVu: 'CV02',
      ChucVu: 'BRANCH_MANAGER',
      ChucVuText: 'Quản Lý Chi Nhánh 1 (Quận 1)',
      Avatar: '👔',
      LuongTheoGio: 45000, 
      LuongCoBan: 45000,
      TenDangNhap: 'quanly1', 
      MatKhau: '1234', 
      MaPIN: '8888',
      AssignedBranches: ['CN01'],
      DefaultBranch: 'CN01',
      MaCN: 'CN01',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV007', 
      MaNhanVien: 'NV007',
      TenNV: 'Hoàng Quản Lý (CN2)', 
      TenNhanVien: 'Hoàng Quản Lý (CN2)',
      GioiTinh: 'Nam',
      DiaChi: 'Số 68 Ngõ 165 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, TP. Hà Nội',
      SDT: '0907777888',
      Email: 'quanly2@banmecafe.vn',
      Role: 'BRANCH_MANAGER',
      MaChucVu: 'CV02',
      ChucVu: 'BRANCH_MANAGER',
      ChucVuText: 'Quản Lý Chi Nhánh 2 (Cầu Giấy)',
      Avatar: '👔',
      LuongTheoGio: 45000, 
      LuongCoBan: 45000,
      TenDangNhap: 'quanly2', 
      MatKhau: '1234', 
      MaPIN: '9999',
      AssignedBranches: ['CN02'],
      DefaultBranch: 'CN02',
      MaCN: 'CN02',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV002', 
      MaNhanVien: 'NV002',
      TenNV: 'Lê Thu Ngân (CN1)', 
      TenNhanVien: 'Lê Thu Ngân (CN1)',
      GioiTinh: 'Nữ',
      DiaChi: 'Số 85/4 Đường Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      SDT: '0902222333',
      Email: 'thungan1@banmecafe.vn',
      Role: 'CASHIER',
      MaChucVu: 'CV03',
      ChucVu: 'CASHIER',
      ChucVuText: 'Nhân Viên Thu Ngân (POS - CN1)',
      Avatar: '👩‍💼',
      LuongTheoGio: 25000, 
      LuongCoBan: 25000,
      TenDangNhap: 'thungan1', 
      MatKhau: '1234', 
      MaPIN: '1234',
      AssignedBranches: ['CN01'],
      DefaultBranch: 'CN01',
      MaCN: 'CN01',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV004', 
      MaNhanVien: 'NV004',
      TenNV: 'Võ Thu Ngân (CN2)', 
      TenNhanVien: 'Võ Thu Ngân (CN2)',
      GioiTinh: 'Nữ',
      DiaChi: 'Số 124 Đường Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội',
      SDT: '0904444555',
      Email: 'thungan2@banmecafe.vn',
      Role: 'CASHIER',
      MaChucVu: 'CV03',
      ChucVu: 'CASHIER',
      ChucVuText: 'Nhân Viên Thu Ngân (POS - CN2)',
      Avatar: '👩‍💼',
      LuongTheoGio: 25000, 
      LuongCoBan: 25000,
      TenDangNhap: 'thungan2', 
      MatKhau: '1234', 
      MaPIN: '1234',
      AssignedBranches: ['CN02'],
      DefaultBranch: 'CN02',
      MaCN: 'CN02',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV008', 
      MaNhanVien: 'NV008',
      TenNV: 'Vũ Thủ Kho (CN1)', 
      TenNhanVien: 'Vũ Thủ Kho (CN1)',
      GioiTinh: 'Nam',
      DiaChi: 'Số 215/8 Đường Trần Hưng Đạo, Phường Cô Giang, Quận 1, TP. Hồ Chí Minh',
      SDT: '0908888111',
      Email: 'kho1@banmecafe.vn',
      Role: 'WAREHOUSE',
      MaChucVu: 'CV04',
      ChucVu: 'WAREHOUSE',
      ChucVuText: 'Nhân Viên Kho (CN1 - Quận 1)',
      Avatar: '📦',
      LuongTheoGio: 30000, 
      LuongCoBan: 30000,
      TenDangNhap: 'thukho1', 
      MatKhau: '1234', 
      MaPIN: '5555',
      AssignedBranches: ['CN01'],
      DefaultBranch: 'CN01',
      MaCN: 'CN01',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV009', 
      MaNhanVien: 'NV009',
      TenNV: 'Đặng Thủ Kho (CN2)', 
      TenNhanVien: 'Đặng Thủ Kho (CN2)',
      GioiTinh: 'Nam',
      DiaChi: 'Số 56 Ngõ 106 Đường Hoàng Quốc Việt, Phường Nghĩa Đô, Quận Cầu Giấy, TP. Hà Nội',
      SDT: '0909999222',
      Email: 'kho2@banmecafe.vn',
      Role: 'WAREHOUSE',
      MaChucVu: 'CV04',
      ChucVu: 'WAREHOUSE',
      ChucVuText: 'Nhân Viên Kho (CN2 - Cầu Giấy)',
      Avatar: '📦',
      LuongTheoGio: 30000, 
      LuongCoBan: 30000,
      TenDangNhap: 'thukho2', 
      MatKhau: '1234', 
      MaPIN: '6666',
      AssignedBranches: ['CN02'],
      DefaultBranch: 'CN02',
      MaCN: 'CN02',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV003', 
      MaNhanVien: 'NV003',
      TenNV: 'Nguyễn Văn Pha (CN1)', 
      TenNhanVien: 'Nguyễn Văn Pha (CN1)',
      GioiTinh: 'Nam',
      DiaChi: 'Số 96/2 Đường Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      SDT: '0903333444',
      Email: 'barista1@banmecafe.vn',
      Role: 'BARISTA',
      MaChucVu: 'CV05',
      ChucVu: 'BARISTA',
      ChucVuText: 'Barista Pha Chế (CN1)',
      Avatar: '☕',
      LuongTheoGio: 28000, 
      LuongCoBan: 28000,
      TenDangNhap: 'barista1', 
      MatKhau: '1234', 
      MaPIN: '2222',
      AssignedBranches: ['CN01'],
      DefaultBranch: 'CN01',
      MaCN: 'CN01',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV005', 
      MaNhanVien: 'NV005',
      TenNV: 'Trịnh Barista (CN2)', 
      TenNhanVien: 'Trịnh Barista (CN2)',
      GioiTinh: 'Nữ',
      DiaChi: 'Số 38 Ngõ 82 Đường Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội',
      SDT: '0905555666',
      Email: 'barista2@banmecafe.vn',
      Role: 'BARISTA',
      MaChucVu: 'CV05',
      ChucVu: 'BARISTA',
      ChucVuText: 'Barista Pha Chế (CN2)',
      Avatar: '☕',
      LuongTheoGio: 28000, 
      LuongCoBan: 28000,
      TenDangNhap: 'barista2', 
      MatKhau: '1234', 
      MaPIN: '3333',
      AssignedBranches: ['CN02'],
      DefaultBranch: 'CN02',
      MaCN: 'CN02',
      TrangThai: 'Đang làm việc'
    },
    { 
      MaNV: 'NV010', 
      MaNhanVien: 'NV010',
      TenNV: 'Hoàng Mai Hoa (CN2)', 
      TenNhanVien: 'Hoàng Mai Hoa (CN2)',
      GioiTinh: 'Nữ',
      DiaChi: 'Số 105 Đường Phố Huế, Phường Ngô Thì Nhậm, Quận Hai Bà Trưng, TP. Hà Nội',
      SDT: '0912345678',
      Email: 'maihoa@banmecafe.vn',
      Role: 'CASHIER',
      MaChucVu: 'CV03',
      ChucVu: 'CASHIER',
      ChucVuText: 'Nhân Viên Thu Ngân (CN2)',
      Avatar: '👩‍💼',
      LuongTheoGio: 26000, 
      LuongCoBan: 26000,
      TenDangNhap: 'maihoa', 
      MatKhau: '1234', 
      MaPIN: '1234',
      AssignedBranches: ['CN02'],
      DefaultBranch: 'CN02',
      MaCN: 'CN02',
      TrangThai: 'Đang làm việc'
    }
  ],

  // 4. BẢNG CA LÀM (CALAM)
  calam: [
    { MaCa: 'CA_SANG', TenCa: 'Ca Sáng (06:30 - 12:00)', GioBatDau: '06:30', GioKetThuc: '12:00', SoGioQuyDinh: 5.5 },
    { MaCa: 'CA_CHIEU', TenCa: 'Ca Chiều (12:00 - 17:30)', GioBatDau: '12:00', GioKetThuc: '17:30', SoGioQuyDinh: 5.5 },
    { MaCa: 'CA_TOI', TenCa: 'Ca Tối (17:30 - 23:00)', GioBatDau: '17:30', GioKetThuc: '23:00', SoGioQuyDinh: 5.5 }
  ],

  // 5. BẢNG PHÂN CA LÀM VIỆC
  phanca: [
    { MaPhanCa: 'PC01', MaNV: 'NV002', TenNV: 'Lê Thu Ngân (CN1)', MaCN: 'CN01', MaCa: 'CA_SANG', TenCa: 'Ca Sáng', Thu: 'Thứ 2', NgayLam: '2026-10-15', TrangThai: 'DaDuyet' },
    { MaPhanCa: 'PC02', MaNV: 'NV003', TenNV: 'Nguyễn Văn Pha (CN1)', MaCN: 'CN01', MaCa: 'CA_SANG', TenCa: 'Ca Sáng', Thu: 'Thứ 2', NgayLam: '2026-10-15', TrangThai: 'DaDuyet' },
    { MaPhanCa: 'PC03', MaNV: 'NV008', TenNV: 'Vũ Thủ Kho (CN1)', MaCN: 'CN01', MaCa: 'CA_SANG', TenCa: 'Ca Sáng', Thu: 'Thứ 2', NgayLam: '2026-10-15', TrangThai: 'DaDuyet' },
    { MaPhanCa: 'PC04', MaNV: 'NV006', TenNV: 'Nguyễn Quản Lý (CN1)', MaCN: 'CN01', MaCa: 'CA_CHIEU', TenCa: 'Ca Chiều', Thu: 'Thứ 2', NgayLam: '2026-10-15', TrangThai: 'DaDuyet' },
    { MaPhanCa: 'PC05', MaNV: 'NV004', TenNV: 'Võ Thu Ngân (CN2)', MaCN: 'CN02', MaCa: 'CA_SANG', TenCa: 'Ca Sáng', Thu: 'Thứ 2', NgayLam: '2026-10-15', TrangThai: 'DaDuyet' },
    { MaPhanCa: 'PC06', MaNV: 'NV005', TenNV: 'Trịnh Barista (CN2)', MaCN: 'CN02', MaCa: 'CA_SANG', TenCa: 'Ca Sáng', Thu: 'Thứ 2', NgayLam: '2026-10-15', TrangThai: 'DaDuyet' },
    { MaPhanCa: 'PC07', MaNV: 'NV009', TenNV: 'Đặng Thủ Kho (CN2)', MaCN: 'CN02', MaCa: 'CA_SANG', TenCa: 'Ca Sáng', Thu: 'Thứ 2', NgayLam: '2026-10-15', TrangThai: 'DaDuyet' }
  ],

  // 6. THIẾT BỊ MÁY CHẤM CÔNG CLOUD
  thietbi: [
    {
      MaTB: 'TB01',
      TenTB: 'Ronald Jack Pro Cloud (Cửa Chính)',
      MaCN: 'CN01',
      SerialNumber: 'RJ-CN01-8899',
      IP_LAN: '192.168.1.200',
      Protocol: 'ADMS / Cloud Push (Port 8000)',
      TrangThai: 'Online',
      LastSync: '2 giây trước',
      TongLog: 1248
    },
    {
      MaTB: 'TB02',
      TenTB: 'ZKTeco SpeedFace Cloud (Quầy Thu Ngân)',
      MaCN: 'CN02',
      SerialNumber: 'ZK-CN02-7788',
      IP_LAN: '192.168.2.200',
      Protocol: 'ADMS / Cloud Push (Port 8000)',
      TrangThai: 'Online',
      LastSync: '5 giây trước',
      TongLog: 896
    }
  ],

  // 7. BẢNG NHẬT KÝ QUẸT VÂN TAY RAW
  chamcong_rawlog: [
    { MaLog: 'LOG_101', MaNV: 'NV002', TenNV: 'Lê Thu Ngân (CN1)', MaCN: 'CN01', MaTB: 'TB01', ThoiGian: '2026-10-15 06:28:15', KieuQuet: 'Check-in', Status: 'Khớp ca sáng (Sớm 2p)' },
    { MaLog: 'LOG_102', MaNV: 'NV003', TenNV: 'Nguyễn Văn Pha (CN1)', MaCN: 'CN01', MaTB: 'TB01', ThoiGian: '2026-10-15 06:35:42', KieuQuet: 'Check-in', Status: 'Khớp ca sáng (Trễ 5p)' },
    { MaLog: 'LOG_103', MaNV: 'NV004', TenNV: 'Võ Thu Ngân (CN2)', MaCN: 'CN02', MaTB: 'TB02', ThoiGian: '2026-10-15 06:29:50', KieuQuet: 'Check-in', Status: 'Khớp ca sáng (Đúng giờ)' },
    { MaLog: 'LOG_104', MaNV: 'NV005', TenNV: 'Trịnh Barista (CN2)', MaCN: 'CN02', MaTB: 'TB02', ThoiGian: '2026-10-15 06:45:10', KieuQuet: 'Check-in', Status: 'Khớp ca sáng (Trễ 15p)' }
  ],

  // 8. BẢNG CHẤM CÔNG CHI TIẾT (Tự Động Tính Trễ / Sớm)
  chamcong: [
    { MaChamCong: 1, MaNV: 'NV002', TenNV: 'Lê Thu Ngân (CN1)', MaCN: 'CN01', MaCa: 'CA_SANG', NgayLam: '2026-10-15', GioVao: '06:28', GioRa: '12:05', DiTrePhut: 0, VeSomPhut: 0, SoGioThucTe: 5.6, TrangThai: 'Đúng giờ' },
    { MaChamCong: 2, MaNV: 'NV003', TenNV: 'Nguyễn Văn Pha (CN1)', MaCN: 'CN01', MaCa: 'CA_SANG', NgayLam: '2026-10-15', GioVao: '06:35', GioRa: '12:00', DiTrePhut: 5, VeSomPhut: 0, SoGioThucTe: 5.4, TrangThai: 'Đi trễ 5p' },
    { MaChamCong: 3, MaNV: 'NV004', TenNV: 'Võ Thu Ngân (CN2)', MaCN: 'CN02', MaCa: 'CA_SANG', NgayLam: '2026-10-15', GioVao: '06:30', GioRa: '12:00', DiTrePhut: 0, VeSomPhut: 0, SoGioThucTe: 5.5, TrangThai: 'Đúng giờ' },
    { MaChamCong: 4, MaNV: 'NV005', TenNV: 'Trịnh Barista (CN2)', MaCN: 'CN02', MaCa: 'CA_SANG', NgayLam: '2026-10-15', GioVao: '06:45', GioRa: '11:50', DiTrePhut: 15, VeSomPhut: 10, SoGioThucTe: 5.1, TrangThai: 'Trễ 15p & Sớm 10p' }
  ],

  // 9. BẢNG LƯƠNG NHÂN VIÊN TỰ ĐỘNG
  bangluong: [
    { MaBangLuong: 'BL_202610_NV001', MaNV: 'NV001', TenNV: 'Trần Chủ Chuỗi', MaCN: 'CN01', ChucVu: 'Chủ Quán', Thang: 10, Nam: 2026, TongGioLam: 160, LuongTheoGio: 80000, PhuCap: 2000000, PhatDiTre: 0, ThuongPhat: 1000000, ThucLinh: 15800000, TrangThai: 'Đã thanh toán' },
    { MaBangLuong: 'BL_202610_NV006', MaNV: 'NV006', TenNV: 'Nguyễn Quản Lý (CN1)', MaCN: 'CN01', ChucVu: 'Quản Lý', Thang: 10, Nam: 2026, TongGioLam: 156, LuongTheoGio: 45000, PhuCap: 800000, PhatDiTre: 0, ThuongPhat: 500000, ThucLinh: 8320000, TrangThai: 'Chờ chi trả' },
    { MaBangLuong: 'BL_202610_NV002', MaNV: 'NV002', TenNV: 'Lê Thu Ngân (CN1)', MaCN: 'CN01', ChucVu: 'Thu Ngân', Thang: 10, Nam: 2026, TongGioLam: 142.5, LuongTheoGio: 25000, PhuCap: 300000, PhatDiTre: 0, ThuongPhat: 200000, ThucLinh: 4062500, TrangThai: 'Chờ chi trả' },
    { MaBangLuong: 'BL_202610_NV008', MaNV: 'NV008', TenNV: 'Vũ Thủ Kho (CN1)', MaCN: 'CN01', ChucVu: 'Thủ Kho', Thang: 10, Nam: 2026, TongGioLam: 140, LuongTheoGio: 30000, PhuCap: 400000, PhatDiTre: 0, ThuongPhat: 150000, ThucLinh: 4750000, TrangThai: 'Chờ chi trả' },
    { MaBangLuong: 'BL_202610_NV003', MaNV: 'NV003', TenNV: 'Nguyễn Văn Pha (CN1)', MaCN: 'CN01', ChucVu: 'Barista', Thang: 10, Nam: 2026, TongGioLam: 138, LuongTheoGio: 28000, PhuCap: 300000, PhatDiTre: 50000, ThuongPhat: 100000, ThucLinh: 4214000, TrangThai: 'Chờ chi trả' },
    { MaBangLuong: 'BL_202610_NV007', MaNV: 'NV007', TenNV: 'Hoàng Quản Lý (CN2)', MaCN: 'CN02', ChucVu: 'Quản Lý', Thang: 10, Nam: 2026, TongGioLam: 152, LuongTheoGio: 45000, PhuCap: 800000, PhatDiTre: 0, ThuongPhat: 400000, ThucLinh: 8040000, TrangThai: 'Chờ chi trả' },
    { MaBangLuong: 'BL_202610_NV004', MaNV: 'NV004', TenNV: 'Võ Thu Ngân (CN2)', MaCN: 'CN02', ChucVu: 'Thu Ngân', Thang: 10, Nam: 2026, TongGioLam: 140, LuongTheoGio: 25000, PhuCap: 300000, PhatDiTre: 0, ThuongPhat: 150000, ThucLinh: 3950000, TrangThai: 'Chờ chi trả' },
    { MaBangLuong: 'BL_202610_NV009', MaNV: 'NV009', TenNV: 'Đặng Thủ Kho (CN2)', MaCN: 'CN02', ChucVu: 'Thủ Kho', Thang: 10, Nam: 2026, TongGioLam: 139, LuongTheoGio: 30000, PhuCap: 400000, PhatDiTre: 0, ThuongPhat: 150000, ThucLinh: 4720000, TrangThai: 'Chờ chi trả' },
    { MaBangLuong: 'BL_202610_NV005', MaNV: 'NV005', TenNV: 'Trịnh Barista (CN2)', MaCN: 'CN02', ChucVu: 'Barista', Thang: 10, Nam: 2026, TongGioLam: 135.5, LuongTheoGio: 28000, PhuCap: 300000, PhatDiTre: 100000, ThuongPhat: 100000, ThucLinh: 4094000, TrangThai: 'Chờ chi trả' }
  ],

  // 10. BẢNG NHÓM HÀNG / DANH MỤC (NHOMHANG / DANHMUC)
  nhomhang: [
    { MaDM: 'ALL', MaNhomHang: 'ALL', TenDM: 'Tất cả món', TenNhomHang: 'Tất cả món', MoTa: 'Toàn bộ thực đơn' },
    { MaDM: 'CF', MaNhomHang: 'CF', TenDM: 'Cà Phê Truyền Thống', TenNhomHang: 'Cà Phê Truyền Thống', MoTa: 'Cà phê rang mộc nguyên chất' },
    { MaDM: 'TRA', MaNhomHang: 'TRA', TenDM: 'Trà Trái Cây & Macchiato', TenNhomHang: 'Trà Trái Cây & Macchiato', MoTa: 'Trà tươi hoa quả thơm ngon' },
    { MaDM: 'FREEZE', MaNhomHang: 'FREEZE', TenDM: 'Đá Xay - Freeze', TenNhomHang: 'Đá Xay - Freeze', MoTa: 'Đồ uống đá xay mát lạnh' },
    { MaDM: 'BANH', MaNhomHang: 'BANH', TenDM: 'Bánh Ngọt & Snack', TenNhomHang: 'Bánh Ngọt & Snack', MoTa: 'Bánh tươi dùng kèm' }
  ],
  danhmuc: [
    { MaDM: 'ALL', TenDM: 'Tất cả món' },
    { MaDM: 'CF', TenDM: 'Cà Phê Truyền Thống' },
    { MaDM: 'TRA', TenDM: 'Trà Trái Cây & Macchiato' },
    { MaDM: 'FREEZE', TenDM: 'Đá Xay - Freeze' },
    { MaDM: 'BANH', TenDM: 'Bánh Ngọt & Snack' }
  ],

  // 11. BẢNG SẢN PHẨM / MÓN (SANPHAM / MON)
  sanpham: [
    { MaSanPham: 'CF_DEN', MaMon: 'CF_DEN', TenSanPham: 'Cà Phê Đen Đá', TenMon: 'Cà Phê Đen Đá', MaNhomHang: 'CF', MaDM: 'CF', DonViTinh: 'Ly', LoaiSanPham: 'PhaChe', GiaVon: 7500, GiaBan: 22000, HinhAnh: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaSanPham: 'CF_SUA', MaMon: 'CF_SUA', TenSanPham: 'Cà Phê Sữa Sài Gòn', TenMon: 'Cà Phê Sữa Sài Gòn', MaNhomHang: 'CF', MaDM: 'CF', DonViTinh: 'Ly', LoaiSanPham: 'PhaChe', GiaVon: 9500, GiaBan: 25000, HinhAnh: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaSanPham: 'BAC_XIU', MaMon: 'BAC_XIU', TenSanPham: 'Bạc Xỉu 3 Tầng', TenMon: 'Bạc Xỉu 3 Tầng', MaNhomHang: 'CF', MaDM: 'CF', DonViTinh: 'Ly', LoaiSanPham: 'PhaChe', GiaVon: 10500, GiaBan: 28000, HinhAnh: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaSanPham: 'TRA_DAO', MaMon: 'TRA_DAO', TenSanPham: 'Trà Đào Cam Sả', TenMon: 'Trà Đào Cam Sả', MaNhomHang: 'TRA', MaDM: 'TRA', DonViTinh: 'Ly', LoaiSanPham: 'PhaChe', GiaVon: 12000, GiaBan: 38000, HinhAnh: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaSanPham: 'TRA_SEN', MaMon: 'TRA_SEN', TenSanPham: 'Trà Sen Vàng Kem Cheese', TenMon: 'Trà Sen Vàng Kem Cheese', MaNhomHang: 'TRA', MaDM: 'TRA', DonViTinh: 'Ly', LoaiSanPham: 'PhaChe', GiaVon: 13500, GiaBan: 42000, HinhAnh: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaSanPham: 'FREEZE_MATCHA', MaMon: 'FREEZE_MATCHA', TenSanPham: 'Matcha Đá Xay Thạch', TenMon: 'Matcha Đá Xay Thạch', MaNhomHang: 'FREEZE', MaDM: 'FREEZE', DonViTinh: 'Ly', LoaiSanPham: 'PhaChe', GiaVon: 15000, GiaBan: 48000, HinhAnh: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaSanPham: 'CROISSANT', MaMon: 'CROISSANT', TenSanPham: 'Bánh Croissant Bơ Tỏi', TenMon: 'Bánh Croissant Bơ Tỏi', MaNhomHang: 'BANH', MaDM: 'BANH', DonViTinh: 'Cái', LoaiSanPham: 'DongGoi', GiaVon: 16000, GiaBan: 30000, HinhAnh: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' }
  ],
  mon: [
    { MaMon: 'CF_DEN', TenMon: 'Cà Phê Đen Đá', MaDM: 'CF', HinhAnh: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaMon: 'CF_SUA', TenMon: 'Cà Phê Sữa Sài Gòn', MaDM: 'CF', HinhAnh: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaMon: 'BAC_XIU', TenMon: 'Bạc Xỉu 3 Tầng', MaDM: 'CF', HinhAnh: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaMon: 'TRA_DAO', TenMon: 'Trà Đào Cam Sả', MaDM: 'TRA', HinhAnh: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaMon: 'TRA_SEN', TenMon: 'Trà Sen Vàng Kem Cheese', MaDM: 'TRA', HinhAnh: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaMon: 'FREEZE_MATCHA', TenMon: 'Matcha Đá Xay Thạch', MaDM: 'FREEZE', HinhAnh: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' },
    { MaMon: 'CROISSANT', TenMon: 'Bánh Croissant Bơ Tỏi', MaDM: 'BANH', HinhAnh: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=80', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&auto=format&fit=crop&q=80', TrangThai: 'DangBan' }
  ],

  // 12. BẢNG KÍCH CỠ (KICHCO)
  kichco: [
    { MaSize: 'S', TenSize: 'Nhỏ (S)' },
    { MaSize: 'M', TenSize: 'Vừa (M)' },
    { MaSize: 'L', TenSize: 'Lớn (L)' }
  ],

  // 13. BẢNG MÓN_SIZE (MON_SIZE)
  mon_size: [
    { MaMonSize: 'CF_DEN_S', MaMon: 'CF_DEN', MaSize: 'S', GiaBan: 22000 },
    { MaMonSize: 'CF_DEN_M', MaMon: 'CF_DEN', MaSize: 'M', GiaBan: 28000 },
    { MaMonSize: 'CF_SUA_S', MaMon: 'CF_SUA', MaSize: 'S', GiaBan: 25000 },
    { MaMonSize: 'CF_SUA_M', MaMon: 'CF_SUA', MaSize: 'M', GiaBan: 32000 },
    { MaMonSize: 'CF_SUA_L', MaMon: 'CF_SUA', MaSize: 'L', GiaBan: 39000 },
    { MaMonSize: 'BAC_XIU_S', MaMon: 'BAC_XIU', MaSize: 'S', GiaBan: 28000 },
    { MaMonSize: 'BAC_XIU_M', MaMon: 'BAC_XIU', MaSize: 'M', GiaBan: 35000 },
    { MaMonSize: 'TRA_DAO_M', MaMon: 'TRA_DAO', MaSize: 'M', GiaBan: 38000 },
    { MaMonSize: 'TRA_DAO_L', MaMon: 'TRA_DAO', MaSize: 'L', GiaBan: 45000 },
    { MaMonSize: 'TRA_SEN_M', MaMon: 'TRA_SEN', MaSize: 'M', GiaBan: 42000 },
    { MaMonSize: 'TRA_SEN_L', MaMon: 'TRA_SEN', MaSize: 'L', GiaBan: 49000 },
    { MaMonSize: 'FREEZE_MATCHA_M', MaMon: 'FREEZE_MATCHA', MaSize: 'M', GiaBan: 48000 },
    { MaMonSize: 'FREEZE_MATCHA_L', MaMon: 'FREEZE_MATCHA', MaSize: 'L', GiaBan: 55000 },
    { MaMonSize: 'CROISSANT_S', MaMon: 'CROISSANT', MaSize: 'S', GiaBan: 30000 }
  ],

  // 14. BẢNG LOẠI BẢNG GIÁ (LOAIBANGGIA)
  loaibanggia: [
    { MaLoaiBangGia: 'BG_CHUAN', TenLoaiBangGia: 'Bảng giá niêm yết chuẩn' },
    { MaLoaiBangGia: 'BG_HAPPYHOUR', TenLoaiBangGia: 'Bảng giá Happy Hour (Giờ vàng 14h-17h)' },
    { MaLoaiBangGia: 'BG_TET', TenLoaiBangGia: 'Bảng giá Phụ thu Lễ Tết (+10%)' }
  ],

  // 15. BẢNG BẢNG GIÁ (BANGGIA)
  banggia: [
    { MaBangGia: 'BG01_CN1', MaChiNhanh: 'CN01', MaLoaiBangGia: 'BG_CHUAN', MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', GiaBan: 32000, NgayBatDau: '2026-01-01', NgayKetThuc: '2026-12-31' },
    { MaBangGia: 'BG02_CN1', MaChiNhanh: 'CN01', MaLoaiBangGia: 'BG_CHUAN', MaMonSize: 'CF_SUA_L', TenMon: 'Cà Phê Sữa Sài Gòn (L)', GiaBan: 39000, NgayBatDau: '2026-01-01', NgayKetThuc: '2026-12-31' },
    { MaBangGia: 'BG03_CN1', MaChiNhanh: 'CN01', MaLoaiBangGia: 'BG_CHUAN', MaMonSize: 'TRA_DAO_L', TenMon: 'Trà Đào Cam Sả (L)', GiaBan: 45000, NgayBatDau: '2026-01-01', NgayKetThuc: '2026-12-31' },
    { MaBangGia: 'BG04_CN2', MaChiNhanh: 'CN02', MaLoaiBangGia: 'BG_CHUAN', MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', GiaBan: 32000, NgayBatDau: '2026-01-01', NgayKetThuc: '2026-12-31' },
    { MaBangGia: 'BG05_CN2', MaChiNhanh: 'CN02', MaLoaiBangGia: 'BG_CHUAN', MaMonSize: 'CF_SUA_L', TenMon: 'Cà Phê Sữa Sài Gòn (L)', GiaBan: 39000, NgayBatDau: '2026-01-01', NgayKetThuc: '2026-12-31' },
    { MaBangGia: 'BG06_CN2', MaChiNhanh: 'CN02', MaLoaiBangGia: 'BG_CHUAN', MaMonSize: 'TRA_DAO_L', TenMon: 'Trà Đào Cam Sả (L)', GiaBan: 45000, NgayBatDau: '2026-01-01', NgayKetThuc: '2026-12-31' }
  ],

  // 16. BẢNG NGUYÊN LIỆU (NGUYENLIEU)
  nguyenlieu: [
    { MaNL: 'CF_HAT', MaNguyenLieu: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', DonViTinh: 'gam', NguongBao: 500, DonGiaVon: 250 },
    { MaNL: 'SUA_DAC', MaNguyenLieu: 'SUA_DAC', TenNL: 'Sữa đặc Ngôi Sao Phương Nam', DonViTinh: 'ml', NguongBao: 1000, DonGiaVon: 40 },
    { MaNL: 'SUA_TUOI', MaNguyenLieu: 'SUA_TUOI', TenNL: 'Sữa tươi thanh trùng Dalat Milk', DonViTinh: 'ml', NguongBao: 2000, DonGiaVon: 35 },
    { MaNL: 'TRA_TUI', MaNguyenLieu: 'TRA_TUI', TenNL: 'Trà đen túi lọc Ahmad Tea', DonViTinh: 'túi', NguongBao: 30, DonGiaVon: 3000 },
    { MaNL: 'DAO_MIENG', MaNguyenLieu: 'DAO_MIENG', TenNL: 'Đào ngâm đóng hộp Kronos', DonViTinh: 'miếng', NguongBao: 40, DonGiaVon: 4000 },
    { MaNL: 'MATCHA_BOT', MaNguyenLieu: 'MATCHA_BOT', TenNL: 'Bột Matcha Nhật Uji', DonViTinh: 'gam', NguongBao: 200, DonGiaVon: 800 },
    { MaNL: 'LY_NHUA', MaNguyenLieu: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', DonViTinh: 'cái', NguongBao: 100, DonGiaVon: 1200 }
  ],

  // 17. BẢNG ĐỊNH MỨC NGUYÊN LIỆU / CÔNG THỨC MÓN (DINHMUCNGUYENLIEU / CONGTHUC - BOM)
  dinhmucnguyenlieu: [
    { MaDinhMuc: 1, MaMonSize: 'CF_SUA_S', TenMon: 'Cà Phê Sữa Sài Gòn (S)', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', SoLuongTieuHao: 20, DinhMucTieuHao: 20, DonVi: 'gam' },
    { MaDinhMuc: 2, MaMonSize: 'CF_SUA_S', TenMon: 'Cà Phê Sữa Sài Gòn (S)', MaNL: 'SUA_DAC', TenNL: 'Sữa đặc Ngôi Sao Phương Nam', SoLuongTieuHao: 25, DinhMucTieuHao: 25, DonVi: 'ml' },
    { MaDinhMuc: 3, MaMonSize: 'CF_SUA_S', TenMon: 'Cà Phê Sữa Sài Gòn (S)', MaNL: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'cái' },

    { MaDinhMuc: 4, MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', SoLuongTieuHao: 25, DinhMucTieuHao: 25, DonVi: 'gam' },
    { MaDinhMuc: 5, MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', MaNL: 'SUA_DAC', TenNL: 'Sữa đặc Ngôi Sao Phương Nam', SoLuongTieuHao: 35, DinhMucTieuHao: 35, DonVi: 'ml' },
    { MaDinhMuc: 6, MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', MaNL: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'cái' },

    { MaDinhMuc: 7, MaMonSize: 'CF_SUA_L', TenMon: 'Cà Phê Sữa Sài Gòn (L)', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', SoLuongTieuHao: 30, DinhMucTieuHao: 30, DonVi: 'gam' },
    { MaDinhMuc: 8, MaMonSize: 'CF_SUA_L', TenMon: 'Cà Phê Sữa Sài Gòn (L)', MaNL: 'SUA_DAC', TenNL: 'Sữa đặc Ngôi Sao Phương Nam', SoLuongTieuHao: 45, DinhMucTieuHao: 45, DonVi: 'ml' },
    { MaDinhMuc: 9, MaMonSize: 'CF_SUA_L', TenMon: 'Cà Phê Sữa Sài Gòn (L)', MaNL: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'cái' },

    { MaDinhMuc: 10, MaMonSize: 'TRA_DAO_M', TenMon: 'Trà Đào Cam Sả (M)', MaNL: 'TRA_TUI', TenNL: 'Trà đen túi lọc Ahmad Tea', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'túi' },
    { MaDinhMuc: 11, MaMonSize: 'TRA_DAO_M', TenMon: 'Trà Đào Cam Sả (M)', MaNL: 'DAO_MIENG', TenNL: 'Đào ngâm đóng hộp Kronos', SoLuongTieuHao: 2, DinhMucTieuHao: 2, DonVi: 'miếng' },
    { MaDinhMuc: 12, MaMonSize: 'TRA_DAO_M', TenMon: 'Trà Đào Cam Sả (M)', MaNL: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'cái' },

    { MaDinhMuc: 13, MaMonSize: 'TRA_DAO_L', TenMon: 'Trà Đào Cam Sả (L)', MaNL: 'TRA_TUI', TenNL: 'Trà đen túi lọc Ahmad Tea', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'túi' },
    { MaDinhMuc: 14, MaMonSize: 'TRA_DAO_L', TenMon: 'Trà Đào Cam Sả (L)', MaNL: 'DAO_MIENG', TenNL: 'Đào ngâm đóng hộp Kronos', SoLuongTieuHao: 3, DinhMucTieuHao: 3, DonVi: 'miếng' },
    { MaDinhMuc: 15, MaMonSize: 'TRA_DAO_L', TenMon: 'Trà Đào Cam Sả (L)', MaNL: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'cái' },

    { MaDinhMuc: 16, MaMonSize: 'CF_DEN_S', TenMon: 'Cà Phê Đen Đá (S)', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', SoLuongTieuHao: 20, DinhMucTieuHao: 20, DonVi: 'gam' },
    { MaDinhMuc: 17, MaMonSize: 'CF_DEN_S', TenMon: 'Cà Phê Đen Đá (S)', MaNL: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'cái' },
    { MaDinhMuc: 18, MaMonSize: 'FREEZE_MATCHA_L', TenMon: 'Matcha Đá Xay Thạch (L)', MaNL: 'MATCHA_BOT', TenNL: 'Bột Matcha Nhật Uji', SoLuongTieuHao: 25, DinhMucTieuHao: 25, DonVi: 'gam' },
    { MaDinhMuc: 19, MaMonSize: 'FREEZE_MATCHA_L', TenMon: 'Matcha Đá Xay Thạch (L)', MaNL: 'SUA_TUOI', TenNL: 'Sữa tươi thanh trùng Dalat Milk', SoLuongTieuHao: 100, DinhMucTieuHao: 100, DonVi: 'ml' },
    { MaDinhMuc: 20, MaMonSize: 'FREEZE_MATCHA_L', TenMon: 'Matcha Đá Xay Thạch (L)', MaNL: 'LY_NHUA', TenNL: 'Ly nhựa nắp cầu mang đi', SoLuongTieuHao: 1, DinhMucTieuHao: 1, DonVi: 'cái' }
  ],
  congthuc: [], // Sẽ được đồng bộ từ dinhmucnguyenlieu

  // 18. BẢNG TỒN KHO THEO CHI NHÁNH (TONKHO)
  tonkho: [
    { MaTonKho: 1, MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: 'CF_HAT', MaNguyenLieu: 'CF_HAT', SoLuongTon: 2450, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 2, MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: 'SUA_DAC', MaNguyenLieu: 'SUA_DAC', SoLuongTon: 4800, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 3, MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: 'SUA_TUOI', MaNguyenLieu: 'SUA_TUOI', SoLuongTon: 12000, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 4, MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: 'TRA_TUI', MaNguyenLieu: 'TRA_TUI', SoLuongTon: 150, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 5, MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: 'DAO_MIENG', MaNguyenLieu: 'DAO_MIENG', SoLuongTon: 80, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 6, MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: 'MATCHA_BOT', MaNguyenLieu: 'MATCHA_BOT', SoLuongTon: 850, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 7, MaCN: 'CN01', MaChiNhanh: 'CN01', MaNL: 'LY_NHUA', MaNguyenLieu: 'LY_NHUA', SoLuongTon: 420, NgayCapNhat: '2026-10-15 14:00' },

    { MaTonKho: 8, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: 'CF_HAT', MaNguyenLieu: 'CF_HAT', SoLuongTon: 1800, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 9, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: 'SUA_DAC', MaNguyenLieu: 'SUA_DAC', SoLuongTon: 3200, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 10, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: 'SUA_TUOI', MaNguyenLieu: 'SUA_TUOI', SoLuongTon: 9500, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 11, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: 'TRA_TUI', MaNguyenLieu: 'TRA_TUI', SoLuongTon: 110, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 12, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: 'DAO_MIENG', MaNguyenLieu: 'DAO_MIENG', SoLuongTon: 65, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 13, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: 'MATCHA_BOT', MaNguyenLieu: 'MATCHA_BOT', SoLuongTon: 620, NgayCapNhat: '2026-10-15 14:00' },
    { MaTonKho: 14, MaCN: 'CN02', MaChiNhanh: 'CN02', MaNL: 'LY_NHUA', MaNguyenLieu: 'LY_NHUA', SoLuongTon: 350, NgayCapNhat: '2026-10-15 14:00' }
  ],

  // 19. BẢNG ĐỐI TÁC (DOITAC - KHÁCH HÀNG & NHÀ CUNG CẤP)
  doitac: [
    { MaDoiTac: 'KH001', TenDoiTac: 'Nguyễn Văn An', SDT: '0988111222', DiaChi: '12 Lê Lợi, Q.1, TP.HCM', LoaiDoiTac: 'KhachHang', DiemTichLuy: 45, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'KH002', TenDoiTac: 'Trần Thị Bình', SDT: '0977333444', DiaChi: '56 Pasteur, Q.1, TP.HCM', LoaiDoiTac: 'KhachHang', DiemTichLuy: 120, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'KH003', TenDoiTac: 'Lê Hoàng Long', SDT: '0912345678', DiaChi: '89 Cầu Giấy, Hà Nội', LoaiDoiTac: 'KhachHang', DiemTichLuy: 210, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'KH004', TenDoiTac: 'Phạm Minh Tuấn', SDT: '0905123456', DiaChi: '23 Hai Bà Trưng, Q.1, TP.HCM', LoaiDoiTac: 'KhachHang', DiemTichLuy: 2500, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'KH005', TenDoiTac: 'Đặng Kim Yến', SDT: '0909888999', DiaChi: '88 Nguyễn Đình Chiểu, Q.3, TP.HCM', LoaiDoiTac: 'KhachHang', DiemTichLuy: 6500, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'NCC01', TenDoiTac: 'Công Ty Cổ Phần Cà Phê Buôn Ma Thuột', SDT: '02838123456', DiaChi: 'Km 3, QL 14, TP. Buôn Ma Thuột', LoaiDoiTac: 'NhaCungCap', DiemTichLuy: 0, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'NCC02', TenDoiTac: 'Công Ty CP Sữa Vinamilk Chi Nhánh TP.HCM', SDT: '02839988776', DiaChi: '10 Tân Trào, P. Tân Phú, Q.7, TP.HCM', LoaiDoiTac: 'NhaCungCap', DiemTichLuy: 0, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'NCC03', TenDoiTac: 'Tổng Kho Trà & Đào Ngâm Kronos Sài Gòn', SDT: '0903332211', DiaChi: '45 Cộng Hòa, Tân Bình, TP.HCM', LoaiDoiTac: 'NhaCungCap', DiemTichLuy: 0, TrangThaiHoatDong: 'HoatDong' },
    { MaDoiTac: 'NCC04', TenDoiTac: 'Nhà Máy Bao Bì Ly Nhựa & Nắp Cầu Đại Phát', SDT: '0918889900', DiaChi: 'KCN Vĩnh Lộc, Bình Chánh, TP.HCM', LoaiDoiTac: 'NhaCungCap', DiemTichLuy: 0, TrangThaiHoatDong: 'HoatDong' }
  ],
  khachhang: [],
  nhacungcap: [],

  // 20. BẢNG PHIẾU NHẬP HÀNG (PHIEUNHAPHANG)
  phieunhaphang: [
    { MaPhieuNhap: 'PN_001', MaCN: 'CN01', MaChiNhanh: 'CN01', MaDoiTac: 'NCC01', TenNCC: 'Công Ty CP Cà Phê Buôn Ma Thuột', MaNV: 'NV008', TenNV: 'Vũ Thủ Kho', NgayNhap: '2026-10-10 08:30', TongTien: 3500000, TrangThai: 'DaNhapKho' },
    { MaPhieuNhap: 'PN_002', MaCN: 'CN01', MaChiNhanh: 'CN01', MaDoiTac: 'NCC02', TenNCC: 'Công Ty CP Sữa Vinamilk', MaNV: 'NV008', TenNV: 'Vũ Thủ Kho', NgayNhap: '2026-10-12 10:15', TongTien: 2100000, TrangThai: 'DaNhapKho' },
    { MaPhieuNhap: 'PN_003', MaCN: 'CN02', MaChiNhanh: 'CN02', MaDoiTac: 'NCC01', TenNCC: 'Công Ty CP Cà Phê Buôn Ma Thuột', MaNV: 'NV009', TenNV: 'Đặng Thủ Kho', NgayNhap: '2026-10-11 09:00', TongTien: 3000000, TrangThai: 'DaNhapKho' }
  ],

  // 21. BẢNG PHIẾU NHẬP CHI TIẾT (PHIEUNHAPCHITIET)
  phieunhapchitiet: [
    { MaPhieuNhapCT: 1, MaPhieuNhap: 'PN_001', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', SoLuong: 14000, DonGiaNhap: 250, ThanhTien: 3500000 },
    { MaPhieuNhapCT: 2, MaPhieuNhap: 'PN_002', MaNL: 'SUA_TUOI', TenNL: 'Sữa tươi thanh trùng Dalat Milk', SoLuong: 60000, DonGiaNhap: 35, ThanhTien: 2100000 },
    { MaPhieuNhapCT: 3, MaPhieuNhap: 'PN_003', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', SoLuong: 12000, DonGiaNhap: 250, ThanhTien: 3000000 }
  ],
  phieukho: [],
  chitietphieukho: [],

  // 22. BẢNG PHIẾU KIỂM KÊ (PHIEUKIEMKE)
  phieukiemke: [
    { MaPhieuKK: 'PKK_CN1_01', MaCN: 'CN01', MaChiNhanh: 'CN01', MaNV: 'NV008', TenNV: 'Vũ Thủ Kho (CN1)', NgayKiemKe: '2026-10-15', GhiChu: 'Kiểm kê kho cuối ngày ca sáng CN1' },
    { MaPhieuKK: 'PKK_CN2_01', MaCN: 'CN02', MaChiNhanh: 'CN02', MaNV: 'NV009', TenNV: 'Đặng Thủ Kho (CN2)', NgayKiemKe: '2026-10-15', GhiChu: 'Kiểm kê kho cuối ngày ca sáng CN2' }
  ],

  // 23. BẢNG KIỂM KÊ CHI TIẾT (KIEMKE_CHITIET)
  kiemke_chitiet: [
    { MaKiemKeCT: 1, MaPhieuKK: 'PKK_CN1_01', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', TonHeThong: 2750, TonThucTe: 2450, ChenhLech: -300, DonVi: 'gam', GhiChu: 'Hao hụt cân chỉnh cối xay (Dial-in ca sáng)' },
    { MaKiemKeCT: 2, MaPhieuKK: 'PKK_CN1_01', MaNL: 'SUA_TUOI', TenNL: 'Sữa tươi thanh trùng', TonHeThong: 12000, TonThucTe: 12000, ChenhLech: 0, DonVi: 'ml', GhiChu: 'Khớp chuẩn 100%' },
    { MaKiemKeCT: 3, MaPhieuKK: 'PKK_CN2_01', MaNL: 'CF_HAT', TenNL: 'Cà phê hạt Robusta mộc', TonHeThong: 2000, TonThucTe: 1800, ChenhLech: -200, DonVi: 'gam', GhiChu: 'Hao hụt cối xay buổi sáng' }
  ],
  kiemkekho: [],

  // 24. BẢNG SỔ QUỸ (SOQUY)
  soquy: [
    { MaSoQuy: 'SQ_001', MaCN: 'CN01', NgayGiaoDich: '2026-10-14 08:30', LoaiGiaoDich: 'Thu', SoTienThu: 1000000, SoTienChi: 0, TonQuy: 1000000, HinhThucTT: 'TienMat', MaPhieuThu: 'PT_000', MaPhieuChi: null, DienGiai: 'Tiền mặt đầu ca ngày 14/10' },
    { MaSoQuy: 'SQ_002', MaCN: 'CN01', NgayGiaoDich: '2026-10-14 18:00', LoaiGiaoDich: 'Thu', SoTienThu: 399000, SoTienChi: 0, TonQuy: 1399000, HinhThucTT: 'TienMat', MaPhieuThu: 'PT_001', MaPhieuChi: null, DienGiai: 'Thu tiền bán hàng POS ca 14/10' },
    { MaSoQuy: 'SQ_003', MaCN: 'CN01', NgayGiaoDich: '2026-10-14 18:05', LoaiGiaoDich: 'Thu', SoTienThu: 412000, SoTienChi: 0, TonQuy: 1811000, HinhThucTT: 'ChuyenKhoan', MaPhieuThu: 'PT_002', MaPhieuChi: null, DienGiai: 'Thu chuyển khoản QR ngân hàng POS' },
    { MaSoQuy: 'SQ_004', MaCN: 'CN01', NgayGiaoDich: '2026-10-15 09:30', LoaiGiaoDich: 'Chi', SoTienThu: 0, SoTienChi: 85000, TonQuy: 1726000, HinhThucTT: 'TienMat', MaPhieuThu: null, MaPhieuChi: 'PC_001', DienGiai: 'Chi khẩn cấp mua đá và túi đựng mang đi' },
    { MaSoQuy: 'SQ_005', MaCN: 'CN02', NgayGiaoDich: '2026-10-14 08:30', LoaiGiaoDich: 'Thu', SoTienThu: 1000000, SoTienChi: 0, TonQuy: 1000000, HinhThucTT: 'TienMat', MaPhieuThu: 'PT_003', MaPhieuChi: null, DienGiai: 'Tiền két ban đầu CN2' },
    { MaSoQuy: 'SQ_006', MaCN: 'CN02', NgayGiaoDich: '2026-10-14 18:00', LoaiGiaoDich: 'Thu', SoTienThu: 447000, SoTienChi: 0, TonQuy: 1447000, HinhThucTT: 'ChuyenKhoan', MaPhieuThu: 'PT_004', MaPhieuChi: null, DienGiai: 'Thu bán hàng POS CN2' }
  ],

  // 25. BẢNG PHIẾU THU (PHIEUTHU)
  phieuthu: [
    { MaPhieuThu: 'PT_001', MaCN: 'CN01', MaChiNhanh: 'CN01', MaNV: 'NV002', TenNV: 'Lê Thu Ngân', NgayThu: '2026-10-14 18:00', SoTien: 399000, LyDo: 'Doanh thu bán lẻ POS tiền mặt', PhuongThuc: 'TienMat', NguoiNop: 'Khách hàng vãng lai' },
    { MaPhieuThu: 'PT_002', MaCN: 'CN01', MaChiNhanh: 'CN01', MaNV: 'NV002', TenNV: 'Lê Thu Ngân', NgayThu: '2026-10-14 18:05', SoTien: 412000, LyDo: 'Doanh thu bán lẻ POS chuyển khoản', PhuongThuc: 'ChuyenKhoan', NguoiNop: 'Khách thanh toán VietQR' },
    { MaPhieuThu: 'PT_003', MaCN: 'CN02', MaChiNhanh: 'CN02', MaNV: 'NV004', TenNV: 'Võ Thu Ngân', NgayThu: '2026-10-14 18:00', SoTien: 447000, LyDo: 'Doanh thu bán lẻ POS CN2', PhuongThuc: 'ChuyenKhoan', NguoiNop: 'Khách hàng POS' }
  ],

  // 26. BẢNG PHIẾU CHI (PHIEUCHI)
  phieuchi: [
    { MaPhieuChi: 'PC_001', MaCN: 'CN01', MaChiNhanh: 'CN01', MaNV: 'NV006', TenNV: 'Nguyễn Quản Lý', NgayChi: '2026-10-15 09:30', SoTien: 85000, LyDo: 'Chi khẩn cấp mua đá pha chế và túi nylon', PhuongThuc: 'TienMat', NguoiNhan: 'Đại lý đá sạch Q.1' },
    { MaPhieuChi: 'PC_002', MaCN: 'CN01', MaChiNhanh: 'CN01', MaNV: 'NV001', TenNV: 'Trần Chủ Chuỗi', NgayChi: '2026-10-12 15:00', SoTien: 2100000, LyDo: 'Thanh toán tiền nhập sữa tươi Dalat Milk', PhuongThuc: 'ChuyenKhoan', NguoiNhan: 'Vinamilk TP.HCM' }
  ],

  // 27. BẢNG CÔNG NỢ (CONGNO)
  congno: [
    { MaCongNo: 'CN_THU_01', MaDoiTac: 'KH003', TenDoiTac: 'Lê Hoàng Long', LoaiCongNo: 'PhaiThu', SoTienCongNo: 420000, NgayPhatSinh: '2026-10-10', HanThanhToan: '2026-10-25', TrangThai: 'ChuaThanhToan' },
    { MaCongNo: 'CN_TRA_01', MaDoiTac: 'NCC01', TenDoiTac: 'Công Ty Cổ Phần Cà Phê Buôn Ma Thuột', LoaiCongNo: 'PhaiTra', SoTienCongNo: 3500000, NgayPhatSinh: '2026-10-10', HanThanhToan: '2026-10-30', TrangThai: 'ChuaThanhToan' },
    { MaCongNo: 'CN_TRA_02', MaDoiTac: 'NCC03', TenDoiTac: 'Tổng Kho Trà & Đào Ngâm Kronos Sài Gòn', LoaiCongNo: 'PhaiTra', SoTienCongNo: 1500000, NgayPhatSinh: '2026-10-14', HanThanhToan: '2026-10-28', TrangThai: 'ChuaThanhToan' }
  ],

  // 28. BẢNG BÀN / THẺ PHỤC VỤ (BAN)
  ban: [
    // Bàn Chi Nhánh 1 (Quận 1)
    { MaBan: 'B01', SoBan: 'Thẻ 01', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN01', TrangThai: 'CoKhach' },
    { MaBan: 'B02', SoBan: 'Thẻ 02', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN01', TrangThai: 'Trong' },
    { MaBan: 'B03', SoBan: 'Thẻ 03', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN01', TrangThai: 'Trong' },
    { MaBan: 'B04', SoBan: 'Thẻ 04', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN01', TrangThai: 'Trong' },
    { MaBan: 'B05', SoBan: 'Thẻ 05', KhuVuc: 'Tầng 2 (Sân Thượng)', MaCN: 'CN01', TrangThai: 'Trong' },
    { MaBan: 'B06', SoBan: 'Thẻ 06', KhuVuc: 'Tầng 2 (Sân Thượng)', MaCN: 'CN01', TrangThai: 'Trong' },
    // Bàn Chi Nhánh 2 (Cầu Giấy)
    { MaBan: 'B201', SoBan: 'Thẻ 01', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN02', TrangThai: 'Trong' },
    { MaBan: 'B202', SoBan: 'Thẻ 02', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN02', TrangThai: 'Trong' },
    { MaBan: 'B203', SoBan: 'Thẻ 03', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN02', TrangThai: 'Trong' },
    { MaBan: 'B204', SoBan: 'Thẻ 04', KhuVuc: 'Tầng 1 (Máy Lạnh)', MaCN: 'CN02', TrangThai: 'Trong' },
    { MaBan: 'B205', SoBan: 'Thẻ 05', KhuVuc: 'Tầng 2 (Sân Thượng)', MaCN: 'CN02', TrangThai: 'Trong' },
    { MaBan: 'B206', SoBan: 'Thẻ 06', KhuVuc: 'Tầng 2 (Sân Thượng)', MaCN: 'CN02', TrangThai: 'Trong' }
  ],

  // 29. BẢNG HÓA ĐƠN (HOADON)
  hoadon: [
    { MaHD: 'HD_1001', MaCN: 'CN01', MaBan: 'B01', MaNV: 'NV002', MaKH: 'KH001', TenKH: 'Nguyễn Văn An', NgayLap: '2026-10-14 08:15', TongTien: 71000, GiamGia: 0, TongThanhToan: 71000, HinhThucTT: 'ChuyenKhoan', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_1002', MaCN: 'CN01', MaBan: null, MaNV: 'NV002', MaKH: 'KH002', TenKH: 'Trần Thị Bình', NgayLap: '2026-10-14 09:20', TongTien: 83000, GiamGia: 10000, TongThanhToan: 73000, HinhThucTT: 'TienMat', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_1003', MaCN: 'CN01', MaBan: 'B02', MaNV: 'NV002', MaKH: null, TenKH: 'Khách lẻ', NgayLap: '2026-10-14 10:45', TongTien: 64000, GiamGia: 0, TongThanhToan: 64000, HinhThucTT: 'The', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_1004', MaCN: 'CN01', MaBan: 'B03', MaNV: 'NV002', MaKH: null, TenKH: 'Khách lẻ', NgayLap: '2026-10-14 14:10', TongTien: 114000, GiamGia: 0, TongThanhToan: 114000, HinhThucTT: 'ChuyenKhoan', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_1005', MaCN: 'CN01', MaBan: null, MaNV: 'NV002', MaKH: 'KH003', TenKH: 'Lê Hoàng Long', NgayLap: '2026-10-14 15:30', TongTien: 97000, GiamGia: 20000, TongThanhToan: 77000, HinhThucTT: 'TienMat', TrangThai: 'HoanThanh' },
    
    // Chi nhánh 2
    { MaHD: 'HD_2001', MaCN: 'CN02', MaBan: 'B201', MaNV: 'NV004', MaKH: 'KH001', TenKH: 'Nguyễn Văn An', NgayLap: '2026-10-14 09:00', TongTien: 64000, GiamGia: 0, TongThanhToan: 64000, HinhThucTT: 'TienMat', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_2002', MaCN: 'CN02', MaBan: 'B202', MaNV: 'NV004', MaKH: 'KH002', TenKH: 'Trần Thị Bình', NgayLap: '2026-10-14 10:30', TongTien: 125000, GiamGia: 0, TongThanhToan: 125000, HinhThucTT: 'ChuyenKhoan', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_2003', MaCN: 'CN02', MaBan: null, MaNV: 'NV004', MaKH: null, TenKH: 'Khách lẻ', NgayLap: '2026-10-14 11:15', TongTien: 88000, GiamGia: 0, TongThanhToan: 88000, HinhThucTT: 'The', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_2004', MaCN: 'CN02', MaBan: 'B203', MaNV: 'NV004', MaKH: null, TenKH: 'Khách lẻ', NgayLap: '2026-10-14 14:00', TongTien: 73000, GiamGia: 0, TongThanhToan: 73000, HinhThucTT: 'ChuyenKhoan', TrangThai: 'HoanThanh' },
    { MaHD: 'HD_2005', MaCN: 'CN02', MaBan: 'B204', MaNV: 'NV004', MaKH: 'KH003', TenKH: 'Lê Hoàng Long', NgayLap: '2026-10-14 16:20', TongTien: 97000, GiamGia: 10000, TongThanhToan: 87000, HinhThucTT: 'TienMat', TrangThai: 'HoanThanh' }
  ],

  // 30. BẢNG CHI TIẾT HÓA ĐƠN (CHITIETHOADON)
  chitiethoadon: [
    { MaCTHD: 1, MaHD: 'HD_1001', MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', SoLuong: 1, DonGia: 32000, ThanhTien: 32000 },
    { MaCTHD: 2, MaHD: 'HD_1001', MaMonSize: 'CF_SUA_L', TenMon: 'Cà Phê Sữa Sài Gòn (L)', SoLuong: 1, DonGia: 39000, ThanhTien: 39000 },
    { MaCTHD: 3, MaHD: 'HD_1002', MaMonSize: 'TRA_DAO_L', TenMon: 'Trà Đào Cam Sả (L)', SoLuong: 1, DonGia: 45000, ThanhTien: 45000 },
    { MaCTHD: 4, MaHD: 'HD_1002', MaMonSize: 'TRA_DAO_M', TenMon: 'Trà Đào Cam Sả (M)', SoLuong: 1, DonGia: 38000, ThanhTien: 38000 },
    { MaCTHD: 5, MaHD: 'HD_1003', MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', SoLuong: 2, DonGia: 32000, ThanhTien: 64000 },
    { MaCTHD: 6, MaHD: 'HD_1004', MaMonSize: 'TRA_SEN_L', TenMon: 'Trà Sen Vàng Kem Cheese (L)', SoLuong: 2, DonGia: 49000, ThanhTien: 98000 },
    { MaCTHD: 7, MaHD: 'HD_1004', MaMonSize: 'CF_DEN_S', TenMon: 'Cà Phê Đen Đá (S)', SoLuong: 1, DonGia: 22000, ThanhTien: 22000 },
    { MaCTHD: 8, MaHD: 'HD_1005', MaMonSize: 'FREEZE_MATCHA_L', TenMon: 'Matcha Đá Xay Thạch (L)', SoLuong: 1, DonGia: 55000, ThanhTien: 55000 },
    { MaCTHD: 9, MaHD: 'HD_1005', MaMonSize: 'TRA_SEN_M', TenMon: 'Trà Sen Vàng Kem Cheese (M)', SoLuong: 1, DonGia: 42000, ThanhTien: 42000 },
    // Chi nhánh 2
    { MaCTHD: 10, MaHD: 'HD_2001', MaMonSize: 'CF_SUA_M', TenMon: 'Cà Phê Sữa Sài Gòn (M)', SoLuong: 2, DonGia: 32000, ThanhTien: 64000 },
    { MaCTHD: 11, MaHD: 'HD_2002', MaMonSize: 'FREEZE_MATCHA_L', TenMon: 'Matcha Đá Xay Thạch (L)', SoLuong: 1, DonGia: 55000, ThanhTien: 55000 },
    { MaCTHD: 12, MaHD: 'HD_2002', MaMonSize: 'TRA_SEN_L', TenMon: 'Trà Sen Vàng Kem Cheese (L)', SoLuong: 1, DonGia: 49000, ThanhTien: 49000 },
    { MaCTHD: 13, MaHD: 'HD_2002', MaMonSize: 'CROISSANT_S', TenMon: 'Bánh Croissant Bơ Tỏi (S)', SoLuong: 1, DonGia: 30000, ThanhTien: 30000 },
    { MaCTHD: 14, MaHD: 'HD_2003', MaMonSize: 'TRA_DAO_M', TenMon: 'Trà Đào Cam Sả (M)', SoLuong: 2, DonGia: 38000, ThanhTien: 76000 },
    { MaCTHD: 15, MaHD: 'HD_2003', MaMonSize: 'CF_DEN_S', TenMon: 'Cà Phê Đen Đá (S)', SoLuong: 1, DonGia: 22000, ThanhTien: 22000 },
    { MaCTHD: 16, MaHD: 'HD_2004', MaMonSize: 'BAC_XIU_M', TenMon: 'Bạc Xỉu 3 Tầng (M)', SoLuong: 1, DonGia: 35000, ThanhTien: 35000 },
    { MaCTHD: 17, MaHD: 'HD_2004', MaMonSize: 'TRA_DAO_M', TenMon: 'Trà Đào Cam Sả (M)', SoLuong: 1, DonGia: 38000, ThanhTien: 38000 },
    { MaCTHD: 18, MaHD: 'HD_2005', MaMonSize: 'FREEZE_MATCHA_M', TenMon: 'Matcha Đá Xay Thạch (M)', SoLuong: 1, DonGia: 48000, ThanhTien: 48000 },
    { MaCTHD: 19, MaHD: 'HD_2005', MaMonSize: 'TRA_SEN_L', TenMon: 'Trà Sen Vàng Kem Cheese (L)', SoLuong: 1, DonGia: 49000, ThanhTien: 49000 }
  ],

  // 31. CHỐT CA KÉT TIỀN (Z-REPORT)
  chotcakedt: [
    { MaChotCa: 'ZR_CN1_01', MaCN: 'CN01', CaLam: 'Ca Sáng', ThuNgan: 'Lê Thu Ngân', TienDauCa: 1000000, TienThuTrongCa: 2340000, ChiKhanCap: 50000, TienLyThuyet: 3290000, TienThucDem: 3290000, ChenhLech: 0, ThoiGian: '14:05:00', TrangThai: 'Khop100%' },
    { MaChotCa: 'ZR_CN2_01', MaCN: 'CN02', CaLam: 'Ca Sáng', ThuNgan: 'Võ Thu Ngân', TienDauCa: 1000000, TienThuTrongCa: 1980000, ChiKhanCap: 0, TienLyThuyet: 2980000, TienThucDem: 2980000, ChenhLech: 0, ThoiGian: '14:10:00', TrangThai: 'Khop100%' }
  ],

  // 32. YÊU CẦU HỦY MÓN
  yeucauhuy: [
    { MaYeuCau: 'YCH_101', MaCN: 'CN01', MaHD: 'HD_DEMO_01', TenMon: 'Trà Sữa Oolong (L)', SoTien: 45000, ThuNgan: 'Lê Thu Ngân', LyDo: 'Khách đổi sang Cà Phê Muối', ThoiGian: '08:45', TrangThai: 'ChoDuyet' },
    { MaYeuCau: 'YCH_102', MaCN: 'CN02', MaHD: 'HD_DEMO_02', TenMon: 'Bạc Xỉu 3 Tầng (M)', SoTien: 35000, ThuNgan: 'Võ Thu Ngân', LyDo: 'Bấm nhầm size cho khách', ThoiGian: '09:15', TrangThai: 'ChoDuyet' }
  ],

  // Đơn hàng đang chọn tại bàn
  tableOrders: {
    'B01': [
      { MaMonSize: 'CF_SUA_L', TenMon: 'Cà Phê Sữa Sài Gòn', HinhAnh: '🧋', TenSize: 'Lớn (L)', GiaBan: 39000, SoLuong: 1 },
      { MaMonSize: 'BAC_XIU_M', TenMon: 'Bạc Xỉu 3 Tầng', HinhAnh: '🥛', TenSize: 'Vừa (M)', GiaBan: 35000, SoLuong: 1 }
    ]
  }
};

// ==============================================================================
// ĐỒNG BỘ DỮ LIỆU VỚI LOCALSTORAGE
// ==============================================================================
function syncAliases() {
  // Đồng bộ dinhmucnguyenlieu sang congthuc
  DB.congthuc = DB.dinhmucnguyenlieu || [];
  
  // Đồng bộ doitac sang khachhang và nhacungcap
  DB.khachhang = (DB.doitac || []).filter(d => d.LoaiDoiTac === 'KhachHang');
  DB.nhacungcap = (DB.doitac || []).filter(d => d.LoaiDoiTac === 'NhaCungCap');
}

function loadDatabase() {
  const local = localStorage.getItem('COFFEE_POS_DB_V2');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      Object.assign(DB, parsed);
    } catch (e) {
      console.error('Lỗi đọc database local:', e);
    }
  }

  // Đảm bảo địa chỉ cụ thể chi tiết chuẩn thực tế (Số nhà, tên đường, phường, quận, TP)
  const detailedAddresses = {
    'NV001': 'Số 42/6A Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    'NV002': 'Số 85/4 Đường Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    'NV003': 'Số 96/2 Đường Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    'NV004': 'Số 124 Đường Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội',
    'NV005': 'Số 38 Ngõ 82 Đường Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội',
    'NV006': 'Số 182/15 Đường Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
    'NV007': 'Số 68 Ngõ 165 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, TP. Hà Nội',
    'NV008': 'Số 215/8 Đường Trần Hưng Đạo, Phường Cô Giang, Quận 1, TP. Hồ Chí Minh',
    'NV009': 'Số 56 Ngõ 106 Đường Hoàng Quốc Việt, Phường Nghĩa Đô, Quận Cầu Giấy, TP. Hà Nội',
    'NV010': 'Số 105 Đường Phố Huế, Phường Ngô Thì Nhậm, Quận Hai Bà Trưng, TP. Hà Nội'
  };

  if (DB.nhanvien && Array.isArray(DB.nhanvien)) {
    DB.nhanvien.forEach(s => {
      if (detailedAddresses[s.MaNV]) {
        s.DiaChi = detailedAddresses[s.MaNV];
      } else if (!s.DiaChi || s.DiaChi.length < 15) {
        s.DiaChi = s.MaCN === 'CN02' 
          ? 'Số 88 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, TP. Hà Nội' 
          : 'Số 120 Đường Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh';
      }
      if (!s.GioiTinh) {
        s.GioiTinh = (s.TenNV && (s.TenNV.includes('Thu Ngân') || s.TenNV.includes('Trịnh Barista') || s.TenNV.includes('Nữ') || s.TenNV.includes('Hoa'))) ? 'Nữ' : 'Nam';
      }
      if (!s.TrangThai) {
        s.TrangThai = 'Đang làm việc';
      }
    });
  }

  syncAliases();
  saveDatabase();
}

function saveDatabase() {
  syncAliases();
  localStorage.setItem('COFFEE_POS_DB_V2', JSON.stringify(DB));
}

loadDatabase();
