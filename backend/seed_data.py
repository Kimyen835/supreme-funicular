from database import engine, SessionLocal, Base
import models

def init_db_and_seed():
    # 1. Tạo tất cả bảng nếu chưa có
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Nếu đã có chi nhánh thì đã seed rồi
        if db.query(models.ChiNhanh).first():
            print("Database already initialized and seeded.")
            return

        print("Seeding initial cafe database...")

        # 1. Chi nhánh
        cn1 = models.ChiNhanh(MaCN='CN01', TenCN='Cà Phê Sài Gòn - Quận 1', DiaChi='123 Nguyễn Huệ, Q.1, TP.HCM', SDT='0901234567')
        cn2 = models.ChiNhanh(MaCN='CN02', TenCN='Cà Phê Sài Gòn - Cầu Giấy', DiaChi='45 Cầu Giấy, Hà Nội', SDT='0907654321')
        db.add_all([cn1, cn2])

        # 2. Nhân viên
        nv1 = models.NhanVien(MaNV='NV001', TenNV='Trần Chủ Chuỗi', GioiTinh='Nam', DiaChi='Số 42/6A Đường Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', SDT='0901111222', ChucVu='SUPER_ADMIN', LuongTheoGio=80000, TenDangNhap='chuchuoi', MatKhau='1234', MaCN='CN01', TrangThai='Đang làm việc')
        nv2 = models.NhanVien(MaNV='NV002', TenNV='Lê Thu Ngân', GioiTinh='Nữ', DiaChi='Số 85/4 Đường Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', SDT='0902222333', ChucVu='CASHIER', LuongTheoGio=25000, TenDangNhap='thungan1', MatKhau='1234', MaCN='CN01', TrangThai='Đang làm việc')
        nv3 = models.NhanVien(MaNV='NV003', TenNV='Nguyễn Văn Pha', GioiTinh='Nam', DiaChi='Số 96/2 Đường Pasteur, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', SDT='0903333444', ChucVu='BARISTA', LuongTheoGio=28000, TenDangNhap='barista1', MatKhau='1234', MaCN='CN01', TrangThai='Đang làm việc')
        nv4 = models.NhanVien(MaNV='NV004', TenNV='Võ Thu Ngân', GioiTinh='Nữ', DiaChi='Số 124 Đường Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội', SDT='0904444555', ChucVu='CASHIER', LuongTheoGio=25000, TenDangNhap='thungan2', MatKhau='1234', MaCN='CN02', TrangThai='Đang làm việc')
        nv5 = models.NhanVien(MaNV='NV005', TenNV='Trịnh Barista', GioiTinh='Nữ', DiaChi='Số 38 Ngõ 82 Đường Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội', SDT='0905555666', ChucVu='BARISTA', LuongTheoGio=28000, TenDangNhap='barista2', MatKhau='1234', MaCN='CN02', TrangThai='Đang làm việc')
        nv6 = models.NhanVien(MaNV='NV006', TenNV='Nguyễn Quản Lý', GioiTinh='Nam', DiaChi='Số 182/15 Đường Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh', SDT='0906666777', ChucVu='BRANCH_MANAGER', LuongTheoGio=45000, TenDangNhap='quanly1', MatKhau='1234', MaCN='CN01', TrangThai='Đang làm việc')
        nv7 = models.NhanVien(MaNV='NV007', TenNV='Hoàng Quản Lý', GioiTinh='Nam', DiaChi='Số 68 Ngõ 165 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, TP. Hà Nội', SDT='0907777888', ChucVu='BRANCH_MANAGER', LuongTheoGio=45000, TenDangNhap='quanly2', MatKhau='1234', MaCN='CN02', TrangThai='Đang làm việc')
        nv8 = models.NhanVien(MaNV='NV008', TenNV='Vũ Thủ Kho', GioiTinh='Nam', DiaChi='Số 215/8 Đường Trần Hưng Đạo, Phường Cô Giang, Quận 1, TP. Hồ Chí Minh', SDT='0908888111', ChucVu='WAREHOUSE', LuongTheoGio=30000, TenDangNhap='thukho1', MatKhau='1234', MaCN='CN01', TrangThai='Đang làm việc')
        nv9 = models.NhanVien(MaNV='NV009', TenNV='Đặng Thủ Kho', GioiTinh='Nam', DiaChi='Số 56 Ngõ 106 Đường Hoàng Quốc Việt, Phường Nghĩa Đô, Quận Cầu Giấy, TP. Hà Nội', SDT='0909999222', ChucVu='WAREHOUSE', LuongTheoGio=30000, TenDangNhap='thukho2', MatKhau='1234', MaCN='CN02', TrangThai='Đang làm việc')
        nv10 = models.NhanVien(MaNV='NV010', TenNV='Hoàng Mai Hoa', GioiTinh='Nữ', DiaChi='Số 105 Đường Phố Huế, Phường Ngô Thì Nhậm, Quận Hai Bà Trưng, TP. Hà Nội', SDT='0912345678', ChucVu='CASHIER', LuongTheoGio=26000, TenDangNhap='maihoa', MatKhau='1234', MaCN='CN02', TrangThai='Đang làm việc')
        db.add_all([nv1, nv2, nv3, nv4, nv5, nv6, nv7, nv8, nv9, nv10])

        # 3. Ca làm
        c1 = models.CaLam(MaCa='CA_SANG', TenCa='Ca Sáng (06:30 - 12:00)', GioBatDau='06:30', GioKetThuc='12:00')
        c2 = models.CaLam(MaCa='CA_CHIEU', TenCa='Ca Chiều (12:00 - 17:30)', GioBatDau='12:00', GioKetThuc='17:30')
        c3 = models.CaLam(MaCa='CA_TOI', TenCa='Ca Tối (17:30 - 23:00)', GioBatDau='17:30', GioKetThuc='23:00')
        db.add_all([c1, c2, c3])

        # 4. Danh mục
        dm1 = models.DanhMuc(MaDM='ALL', TenDM='Tất cả món')
        dm2 = models.DanhMuc(MaDM='CF', TenDM='Cà Phê Truyền Thống')
        dm3 = models.DanhMuc(MaDM='TRA', TenDM='Trà Trái Cây & Macchiato')
        dm4 = models.DanhMuc(MaDM='FREEZE', TenDM='Đá Xay - Freeze')
        dm5 = models.DanhMuc(MaDM='BANH', TenDM='Bánh Ngọt & Snack')
        db.add_all([dm1, dm2, dm3, dm4, dm5])

        # 5. Kích cỡ
        k1 = models.KichCo(MaSize='S', TenSize='Nhỏ (S)')
        k2 = models.KichCo(MaSize='M', TenSize='Vừa (M)')
        k3 = models.KichCo(MaSize='L', TenSize='Lớn (L)')
        db.add_all([k1, k2, k3])

        # 6. Món
        m1 = models.Mon(MaMon='CF_DEN', TenMon='Cà Phê Đen Đá', MaDM='CF', HinhAnh='☕')
        m2 = models.Mon(MaMon='CF_SUA', TenMon='Cà Phê Sữa Sài Gòn', MaDM='CF', HinhAnh='🧋')
        m3 = models.Mon(MaMon='BAC_XIU', TenMon='Bạc Xỉu 3 Tầng', MaDM='CF', HinhAnh='🥛')
        m4 = models.Mon(MaMon='TRA_DAO', TenMon='Trà Đào Cam Sả', MaDM='TRA', HinhAnh='🍑')
        m5 = models.Mon(MaMon='TRA_SEN', TenMon='Trà Sen Vàng Kem Cheese', MaDM='TRA', HinhAnh='🪷')
        m6 = models.Mon(MaMon='FREEZE_MATCHA', TenMon='Matcha Đá Xay Thạch', MaDM='FREEZE', HinhAnh='🍵')
        m7 = models.Mon(MaMon='CROISSANT', TenMon='Bánh Croissant Bơ Tỏi', MaDM='BANH', HinhAnh='🥐')
        db.add_all([m1, m2, m3, m4, m5, m6, m7])

        # 7. Món_Size
        ms_list = [
            models.MonSize(MaMonSize='CF_DEN_S', MaMon='CF_DEN', MaSize='S', GiaBan=22000),
            models.MonSize(MaMonSize='CF_DEN_M', MaMon='CF_DEN', MaSize='M', GiaBan=28000),
            models.MonSize(MaMonSize='CF_SUA_S', MaMon='CF_SUA', MaSize='S', GiaBan=25000),
            models.MonSize(MaMonSize='CF_SUA_M', MaMon='CF_SUA', MaSize='M', GiaBan=32000),
            models.MonSize(MaMonSize='CF_SUA_L', MaMon='CF_SUA', MaSize='L', GiaBan=39000),
            models.MonSize(MaMonSize='BAC_XIU_S', MaMon='BAC_XIU', MaSize='S', GiaBan=28000),
            models.MonSize(MaMonSize='BAC_XIU_M', MaMon='BAC_XIU', MaSize='M', GiaBan=35000),
            models.MonSize(MaMonSize='TRA_DAO_M', MaMon='TRA_DAO', MaSize='M', GiaBan=38000),
            models.MonSize(MaMonSize='TRA_DAO_L', MaMon='TRA_DAO', MaSize='L', GiaBan=45000),
            models.MonSize(MaMonSize='TRA_SEN_M', MaMon='TRA_SEN', MaSize='M', GiaBan=42000),
            models.MonSize(MaMonSize='TRA_SEN_L', MaMon='TRA_SEN', MaSize='L', GiaBan=49000),
            models.MonSize(MaMonSize='FREEZE_MATCHA_M', MaMon='FREEZE_MATCHA', MaSize='M', GiaBan=48000),
            models.MonSize(MaMonSize='FREEZE_MATCHA_L', MaMon='FREEZE_MATCHA', MaSize='L', GiaBan=55000),
            models.MonSize(MaMonSize='CROISSANT_S', MaMon='CROISSANT', MaSize='S', GiaBan=30000)
        ]
        db.add_all(ms_list)

        # 8. Nguyên liệu
        nl_list = [
            models.NguyenLieu(MaNL='CF_HAT', TenNL='Cà phê hạt Robusta mộc', DonViTinh='gam', NguongBao=500),
            models.NguyenLieu(MaNL='SUA_DAC', TenNL='Sữa đặc Ngôi Sao Phương Nam', DonViTinh='ml', NguongBao=1000),
            models.NguyenLieu(MaNL='SUA_TUOI', TenNL='Sữa tươi thanh trùng Dalat Milk', DonViTinh='ml', NguongBao=2000),
            models.NguyenLieu(MaNL='TRA_TUI', TenNL='Trà đen túi lọc Ahmad Tea', DonViTinh='túi', NguongBao=30),
            models.NguyenLieu(MaNL='DAO_MIENG', TenNL='Đào ngâm đóng hộp Kronos', DonViTinh='miếng', NguongBao=40),
            models.NguyenLieu(MaNL='MATCHA_BOT', TenNL='Bột Matcha Nhật Uji', DonViTinh='gam', NguongBao=200),
            models.NguyenLieu(MaNL='LY_NHUA', TenNL='Ly nhựa nắp cầu mang đi', DonViTinh='cái', NguongBao=100)
        ]
        db.add_all(nl_list)

        # 9. Công thức (BOM)
        ct_list = [
            models.CongThuc(MaMonSize='CF_SUA_S', MaNL='CF_HAT', SoLuongTieuHao=20),
            models.CongThuc(MaMonSize='CF_SUA_S', MaNL='SUA_DAC', SoLuongTieuHao=25),
            models.CongThuc(MaMonSize='CF_SUA_S', MaNL='LY_NHUA', SoLuongTieuHao=1),
            models.CongThuc(MaMonSize='CF_SUA_M', MaNL='CF_HAT', SoLuongTieuHao=25),
            models.CongThuc(MaMonSize='CF_SUA_M', MaNL='SUA_DAC', SoLuongTieuHao=35),
            models.CongThuc(MaMonSize='CF_SUA_M', MaNL='LY_NHUA', SoLuongTieuHao=1),
            models.CongThuc(MaMonSize='CF_SUA_L', MaNL='CF_HAT', SoLuongTieuHao=30),
            models.CongThuc(MaMonSize='CF_SUA_L', MaNL='SUA_DAC', SoLuongTieuHao=45),
            models.CongThuc(MaMonSize='CF_SUA_L', MaNL='LY_NHUA', SoLuongTieuHao=1),
            models.CongThuc(MaMonSize='TRA_DAO_M', MaNL='TRA_TUI', SoLuongTieuHao=1),
            models.CongThuc(MaMonSize='TRA_DAO_M', MaNL='DAO_MIENG', SoLuongTieuHao=2),
            models.CongThuc(MaMonSize='TRA_DAO_M', MaNL='LY_NHUA', SoLuongTieuHao=1)
        ]
        db.add_all(ct_list)

        # 10. Tồn kho mẫu
        tk_list = [
            models.TonKho(MaCN='CN01', MaNL='CF_HAT', SoLuongTon=4800),
            models.TonKho(MaCN='CN01', MaNL='SUA_DAC', SoLuongTon=850),
            models.TonKho(MaCN='CN01', MaNL='SUA_TUOI', SoLuongTon=4500),
            models.TonKho(MaCN='CN01', MaNL='TRA_TUI', SoLuongTon=85),
            models.TonKho(MaCN='CN01', MaNL='DAO_MIENG', SoLuongTon=28),
            models.TonKho(MaCN='CN01', MaNL='MATCHA_BOT', SoLuongTon=650),
            models.TonKho(MaCN='CN01', MaNL='LY_NHUA', SoLuongTon=350)
        ]
        db.add_all(tk_list)

        # 11. Bàn
        ban_list = [
            # Bàn Chi Nhánh 1 (Quận 1)
            models.Ban(MaBan='B01', SoBan='Bàn 01', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN01', TrangThai='CoKhach'),
            models.Ban(MaBan='B02', SoBan='Bàn 02', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN01', TrangThai='Trong'),
            models.Ban(MaBan='B03', SoBan='Bàn 03', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN01', TrangThai='Trong'),
            models.Ban(MaBan='B04', SoBan='Bàn VIP 04', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN01', TrangThai='Trong'),
            models.Ban(MaBan='B05', SoBan='Bàn 05', KhuVuc='Tầng 2 (Sân Thượng)', MaCN='CN01', TrangThai='Trong'),
            models.Ban(MaBan='B06', SoBan='Bàn 06', KhuVuc='Tầng 2 (Sân Thượng)', MaCN='CN01', TrangThai='Trong'),
            # Bàn Chi Nhánh 2 (Cầu Giấy)
            models.Ban(MaBan='B201', SoBan='Bàn 01', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN02', TrangThai='Trong'),
            models.Ban(MaBan='B202', SoBan='Bàn 02', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN02', TrangThai='Trong'),
            models.Ban(MaBan='B203', SoBan='Bàn 03', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN02', TrangThai='Trong'),
            models.Ban(MaBan='B204', SoBan='Bàn VIP 04', KhuVuc='Tầng 1 (Máy Lạnh)', MaCN='CN02', TrangThai='Trong'),
            models.Ban(MaBan='B205', SoBan='Bàn 05', KhuVuc='Tầng 2 (Sân Thượng)', MaCN='CN02', TrangThai='Trong'),
            models.Ban(MaBan='B206', SoBan='Bàn 06', KhuVuc='Tầng 2 (Sân Thượng)', MaCN='CN02', TrangThai='Trong')
        ]
        db.add_all(ban_list)

        # 12. Khách hàng
        kh_list = [
            models.KhachHang(MaKH='KH001', TenKH='Nguyễn Văn An', SDT='0988111222', DiemTichLuy=45),
            models.KhachHang(MaKH='KH002', TenKH='Trần Thị Bình', SDT='0977333444', DiemTichLuy=120),
            models.KhachHang(MaKH='KH003', TenKH='Lê Hoàng Long', SDT='0912345678', DiemTichLuy=210)
        ]
        db.add_all(kh_list)

        # 13. Hóa đơn mẫu & Chi tiết
        hd1 = models.HoaDon(MaHD='HD_1001', MaCN='CN01', MaBan='B01', MaNV='NV002', MaKH='KH001', NgayLap='2026-10-14 08:15', TongTien=71000, GiamGia=0, TongThanhToan=71000, KhachTra=71000, HinhThucTT='ChuyenKhoan', TrangThai='HoanThanh')
        hd2 = models.HoaDon(MaHD='HD_1002', MaCN='CN01', MaBan=None, MaNV='NV002', MaKH='KH002', NgayLap='2026-10-14 09:20', TongTien=83000, GiamGia=10000, TongThanhToan=73000, KhachTra=73000, HinhThucTT='TienMat', TrangThai='HoanThanh')
        hd3 = models.HoaDon(MaHD='HD_1003', MaCN='CN01', MaBan='B02', MaNV='NV002', MaKH=None, NgayLap='2026-10-14 10:45', TongTien=64000, GiamGia=0, TongThanhToan=64000, KhachTra=64000, HinhThucTT='The', TrangThai='HoanThanh')
        
        # Hóa đơn Chi Nhánh 2
        hd4 = models.HoaDon(MaHD='HD_2001', MaCN='CN02', MaBan='B201', MaNV='NV004', MaKH='KH001', NgayLap='2026-10-14 09:00', TongTien=64000, GiamGia=0, TongThanhToan=64000, KhachTra=64000, HinhThucTT='TienMat', TrangThai='HoanThanh')
        hd5 = models.HoaDon(MaHD='HD_2002', MaCN='CN02', MaBan='B202', MaNV='NV004', MaKH='KH002', NgayLap='2026-10-14 10:30', TongTien=125000, GiamGia=0, TongThanhToan=125000, KhachTra=125000, HinhThucTT='ChuyenKhoan', TrangThai='HoanThanh')
        hd6 = models.HoaDon(MaHD='HD_2003', MaCN='CN02', MaBan=None, MaNV='NV004', MaKH=None, NgayLap='2026-10-14 11:15', TongTien=88000, GiamGia=0, TongThanhToan=88000, KhachTra=88000, HinhThucTT='The', TrangThai='HoanThanh')
        db.add_all([hd1, hd2, hd3, hd4, hd5, hd6])

        # Chi tiết hóa đơn
        cthd1 = models.ChiTietHoaDon(MaHD='HD_1001', MaMonSize='CF_SUA_L', SoLuong=1, DonGia=39000, ThanhTien=39000)
        cthd2 = models.ChiTietHoaDon(MaHD='HD_1001', MaMonSize='CF_SUA_M', SoLuong=1, DonGia=32000, ThanhTien=32000)
        cthd3 = models.ChiTietHoaDon(MaHD='HD_2001', MaMonSize='CF_SUA_M', SoLuong=2, DonGia=32000, ThanhTien=64000)
        cthd4 = models.ChiTietHoaDon(MaHD='HD_2002', MaMonSize='FREEZE_MATCHA_L', SoLuong=1, DonGia=55000, ThanhTien=55000)
        cthd5 = models.ChiTietHoaDon(MaHD='HD_2002', MaMonSize='TRA_SEN_L', SoLuong=1, DonGia=49000, ThanhTien=49000)
        cthd6 = models.ChiTietHoaDon(MaHD='HD_2003', MaMonSize='TRA_DAO_M', SoLuong=2, DonGia=38000, ThanhTien=76000)
        db.add_all([cthd1, cthd2, cthd3, cthd4, cthd5, cthd6])

        # Chấm công mẫu
        cc1 = models.ChamCong(MaNV='NV002', MaCa='CA_SANG', NgayLam='2026-10-14', GioVao='06:28', GioRa='12:02', SoGioThucTe=5.5, ThoiGianLamText='5 giờ 34 phút', LuongCa=137500)
        cc2 = models.ChamCong(MaNV='NV003', MaCa='CA_SANG', NgayLam='2026-10-14', GioVao='06:30', GioRa='12:00', SoGioThucTe=5.5, ThoiGianLamText='5 giờ 30 phút', LuongCa=165000)
        db.add_all([cc1, cc2])

        # Phân ca làm việc mẫu
        if db.query(models.PhanCa).count() == 0:
            pcs = [
                models.PhanCa(MaPhanCa='PC01', MaNV='NV002', MaCN='CN01', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
                models.PhanCa(MaPhanCa='PC02', MaNV='NV003', MaCN='CN01', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
                models.PhanCa(MaPhanCa='PC03', MaNV='NV008', MaCN='CN01', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
                models.PhanCa(MaPhanCa='PC04', MaNV='NV006', MaCN='CN01', MaCa='CA_CHIEU', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
                models.PhanCa(MaPhanCa='PC05', MaNV='NV004', MaCN='CN02', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
                models.PhanCa(MaPhanCa='PC06', MaNV='NV005', MaCN='CN02', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
                models.PhanCa(MaPhanCa='PC07', MaNV='NV009', MaCN='CN02', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
            ]
            db.add_all(pcs)

        # Phiếu thu & Phiếu chi & Sổ quỹ mẫu
        if db.query(models.PhieuThu).count() == 0:
            db.add_all([
                models.PhieuThu(MaPhieuThu="PT_001", MaCN="CN01", MaNV="NV002", TenNV="Lê Thu Ngân", NgayThu="2026-10-14 18:00", SoTien=399000.0, LyDo="Doanh thu bán lẻ POS tiền mặt", PhuongThuc="TienMat", NguoiNop="Khách hàng vãng lai", LoaiPhieu="TuDong"),
                models.PhieuThu(MaPhieuThu="PT_002", MaCN="CN01", MaNV="NV002", TenNV="Lê Thu Ngân", NgayThu="2026-10-14 18:05", SoTien=412000.0, LyDo="Doanh thu bán lẻ POS chuyển khoản", PhuongThuc="ChuyenKhoan", NguoiNop="Khách thanh toán VietQR", LoaiPhieu="TuDong"),
                models.PhieuThu(MaPhieuThu="PT_003", MaCN="CN02", MaNV="NV004", TenNV="Võ Thu Ngân", NgayThu="2026-10-14 18:00", SoTien=447000.0, LyDo="Doanh thu bán lẻ POS CN2", PhuongThuc="ChuyenKhoan", NguoiNop="Khách hàng POS", LoaiPhieu="TuDong")
            ])
        if db.query(models.PhieuChi).count() == 0:
            db.add_all([
                models.PhieuChi(MaPhieuChi="PC_001", MaCN="CN01", MaNV="NV006", TenNV="Nguyễn Quản Lý", NgayChi="2026-10-15 09:30", SoTien=85000.0, LyDo="Chi khẩn cấp mua đá pha chế và túi nylon", PhuongThuc="TienMat", NguoiNhan="Đại lý đá sạch Q.1", LoaiPhieu="ThuCong"),
                models.PhieuChi(MaPhieuChi="PC_002", MaCN="CN01", MaNV="NV001", TenNV="Trần Chủ Chuỗi", NgayChi="2026-10-12 15:00", SoTien=2100000.0, LyDo="Thanh toán tiền nhập sữa tươi Dalat Milk", PhuongThuc="ChuyenKhoan", NguoiNhan="Vinamilk TP.HCM", LoaiPhieu="ThuCong")
            ])
        if db.query(models.SoQuy).count() == 0:
            db.add_all([
                models.SoQuy(MaSoQuy="SQ_001", MaCN="CN01", NgayGiaoDich="2026-10-14 08:30", LoaiGiaoDich="Thu", SoTienThu=1000000.0, SoTienChi=0.0, TonQuy=1000000.0, HinhThucTT="TienMat", MaPhieuThu="PT_000", MaPhieuChi=None, DienGiai="Tiền mặt đầu ca ngày 14/10"),
                models.SoQuy(MaSoQuy="SQ_002", MaCN="CN01", NgayGiaoDich="2026-10-14 18:00", LoaiGiaoDich="Thu", SoTienThu=399000.0, SoTienChi=0.0, TonQuy=1399000.0, HinhThucTT="TienMat", MaPhieuThu="PT_001", MaPhieuChi=None, DienGiai="Thu tiền bán hàng POS ca 14/10"),
                models.SoQuy(MaSoQuy="SQ_003", MaCN="CN01", NgayGiaoDich="2026-10-14 18:05", LoaiGiaoDich="Thu", SoTienThu=412000.0, SoTienChi=0.0, TonQuy=1811000.0, HinhThucTT="ChuyenKhoan", MaPhieuThu="PT_002", MaPhieuChi=None, DienGiai="Thu chuyển khoản QR ngân hàng POS"),
                models.SoQuy(MaSoQuy="SQ_004", MaCN="CN01", NgayGiaoDich="2026-10-15 09:30", LoaiGiaoDich="Chi", SoTienThu=0.0, SoTienChi=85000.0, TonQuy=1726000.0, HinhThucTT="TienMat", MaPhieuThu=None, MaPhieuChi="PC_001", DienGiai="Chi khẩn cấp mua đá và túi đựng mang đi")
            ])

        db.commit()
        print("Initial database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db_and_seed()
