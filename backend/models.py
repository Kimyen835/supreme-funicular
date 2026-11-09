from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

# 1. CHI NHÁNH
class ChiNhanh(Base):
    __tablename__ = "chinhanh"
    MaCN = Column(String(20), primary_key=True, index=True)
    TenCN = Column(String(100), nullable=False)
    DiaChi = Column(String(255))
    SDT = Column(String(20))

# 2. NHÂN VIÊN
class NhanVien(Base):
    __tablename__ = "nhanvien"
    MaNV = Column(String(20), primary_key=True, index=True)
    TenNV = Column(String(100), nullable=False)
    GioiTinh = Column(String(10), default="Nam")
    DiaChi = Column(String(255), default="")
    SDT = Column(String(20))
    ChucVu = Column(String(50), nullable=False)
    LuongTheoGio = Column(Float, default=25000.0)
    TenDangNhap = Column(String(50), unique=True, nullable=False, index=True)
    MatKhau = Column(String(255), nullable=False)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    TrangThai = Column(String(50), default="Đang làm việc")

# 3. CA LÀM
class CaLam(Base):
    __tablename__ = "calam"
    MaCa = Column(String(20), primary_key=True, index=True)
    TenCa = Column(String(50), nullable=False)
    GioBatDau = Column(String(10), nullable=False)
    GioKetThuc = Column(String(10), nullable=False)

# 3.0. PHÂN CA LÀM VIỆC (PHANCA_CHAMCONG)
class PhanCa(Base):
    __tablename__ = "phanca"
    MaPhanCa = Column(String(20), primary_key=True, index=True)
    MaNV = Column(String(20), ForeignKey("nhanvien.MaNV"), nullable=False)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    MaCa = Column(String(20), ForeignKey("calam.MaCa"), nullable=False)
    Thu = Column(String(20), nullable=False)
    NgayLam = Column(String(20), nullable=False)
    TrangThai = Column(String(50), default="DaDuyet")

# 3.1. THIẾT BỊ MÁY CHẤM CÔNG (CLOUD SYNC / ADMS PUSH)
class ThietBiChamCong(Base):
    __tablename__ = "thietbichamcong"
    MaTB = Column(String(20), primary_key=True, index=True)
    TenTB = Column(String(100), nullable=False)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    SerialNumber = Column(String(50), unique=True, nullable=False)
    IP_LAN = Column(String(30))
    Protocol = Column(String(50), default="ADMS / Cloud Push")
    TrangThai = Column(String(20), default="Online")
    LastSync = Column(String(30))
    TongLog = Column(Integer, default=0)

# 3.2. RAW PUNCH LOG TỪ MÁY CHẤM CÔNG ĐẨY VỀ (< 5S)
class ChamCongRawLog(Base):
    __tablename__ = "chamcong_rawlog"
    MaLog = Column(String(30), primary_key=True, index=True)
    MaNV = Column(String(20), ForeignKey("nhanvien.MaNV"), nullable=False)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    MaTB = Column(String(20), ForeignKey("thietbichamcong.MaTB"), nullable=False)
    ThoiGian = Column(String(30), nullable=False)
    KieuQuet = Column(String(20), default="Check-in")
    Status = Column(String(100))

# 4. CHẤM CÔNG CHI TIẾT (TỰ ĐỘNG KHỚP CA, TÍNH TRỄ / SỚM)
class ChamCong(Base):
    __tablename__ = "chamcong"
    MaChamCong = Column(Integer, primary_key=True, autoincrement=True)
    MaNV = Column(String(20), ForeignKey("nhanvien.MaNV"), nullable=False)
    MaCa = Column(String(20), ForeignKey("calam.MaCa"), nullable=False)
    NgayLam = Column(String(15), nullable=False)
    GioVao = Column(String(15), nullable=False)
    GioRa = Column(String(15), nullable=True)
    DiTrePhut = Column(Integer, default=0)
    VeSomPhut = Column(Integer, default=0)
    SoGioThucTe = Column(Float, nullable=True)
    ThoiGianLamText = Column(String(50), nullable=True)
    LuongCa = Column(Float, nullable=True)
    TrangThai = Column(String(50), default="Đúng giờ")

# 5. BẢNG LƯƠNG TỰ ĐỘNG
class BangLuong(Base):
    __tablename__ = "bangluong"
    MaBangLuong = Column(String(30), primary_key=True, index=True)
    MaNV = Column(String(20), ForeignKey("nhanvien.MaNV"), nullable=False)
    Thang = Column(Integer, nullable=False)
    Nam = Column(Integer, nullable=False)
    TongGioLam = Column(Float, nullable=False)
    LuongTheoGio = Column(Float, nullable=False)
    PhuCap = Column(Float, default=0.0)
    PhatDiTre = Column(Float, default=0.0)
    ThuongPhat = Column(Float, default=0.0)
    ThucLinh = Column(Float, nullable=False)
    TrangThai = Column(String(50), default="Chờ chi trả")

# 6. DANH MỤC
class DanhMuc(Base):
    __tablename__ = "danhmuc"
    MaDM = Column(String(20), primary_key=True, index=True)
    TenDM = Column(String(100), nullable=False)

# 7. MÓN
class Mon(Base):
    __tablename__ = "mon"
    MaMon = Column(String(20), primary_key=True, index=True)
    TenMon = Column(String(100), nullable=False)
    MaDM = Column(String(20), ForeignKey("danhmuc.MaDM"), nullable=False)
    HinhAnh = Column(String(10), default="☕")
    TrangThai = Column(String(20), default="ConHang")

# 8. KÍCH CỠ
class KichCo(Base):
    __tablename__ = "kichco"
    MaSize = Column(String(10), primary_key=True, index=True)
    TenSize = Column(String(50), nullable=False)

# 9. MÓN_SIZE
class MonSize(Base):
    __tablename__ = "mon_size"
    MaMonSize = Column(String(30), primary_key=True, index=True)
    MaMon = Column(String(20), ForeignKey("mon.MaMon"), nullable=False)
    MaSize = Column(String(10), ForeignKey("kichco.MaSize"), nullable=False)
    GiaBan = Column(Float, nullable=False)

# 10. NGUYÊN LIỆU
class NguyenLieu(Base):
    __tablename__ = "nguyenlieu"
    MaNL = Column(String(20), primary_key=True, index=True)
    TenNL = Column(String(100), nullable=False)
    DonViTinh = Column(String(20), nullable=False)
    NguongBao = Column(Float, default=500.0)

# 11. CÔNG THỨC (BOM)
class CongThuc(Base):
    __tablename__ = "congthuc"
    MaCongThuc = Column(Integer, primary_key=True, autoincrement=True)
    MaMonSize = Column(String(30), ForeignKey("mon_size.MaMonSize"), nullable=False)
    MaNL = Column(String(20), ForeignKey("nguyenlieu.MaNL"), nullable=False)
    SoLuongTieuHao = Column(Float, nullable=False)

# 12. TỒN KHO CHI NHÁNH
class TonKho(Base):
    __tablename__ = "tonkho"
    MaTonKho = Column(Integer, primary_key=True, autoincrement=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    MaNL = Column(String(20), ForeignKey("nguyenlieu.MaNL"), nullable=False)
    SoLuongTon = Column(Float, default=0.0)

# 13. BÀN
class Ban(Base):
    __tablename__ = "ban"
    MaBan = Column(String(20), primary_key=True, index=True)
    SoBan = Column(String(50), nullable=False)
    KhuVuc = Column(String(100), nullable=False)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    TrangThai = Column(String(20), default="Trong") # Trong, CoKhach
    YeuCauThanhToan = Column(Integer, default=0) # 0: False, 1: True

# 14. KHÁCH HÀNG
class KhachHang(Base):
    __tablename__ = "khachhang"
    MaKH = Column(String(20), primary_key=True, index=True)
    TenKH = Column(String(100), nullable=False)
    SDT = Column(String(20), unique=True, index=True)
    DiemTichLuy = Column(Integer, default=0)

# 15. HÓA ĐƠN
class HoaDon(Base):
    __tablename__ = "hoadon"
    MaHD = Column(String(30), primary_key=True, index=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    MaBan = Column(String(20), ForeignKey("ban.MaBan"), nullable=True)
    SoTheBan = Column(String(50), nullable=True)
    MaNV = Column(String(20), ForeignKey("nhanvien.MaNV"), nullable=False)
    MaKH = Column(String(20), ForeignKey("khachhang.MaKH"), nullable=True)
    NgayLap = Column(String(25), nullable=False)
    TongTien = Column(Float, nullable=False)
    GiamGia = Column(Float, default=0.0)
    TongThanhToan = Column(Float, nullable=False)
    KhachTra = Column(Float, nullable=True) # Compatibility
    HinhThucTT = Column(String(30), nullable=False) # TienMat, ChuyenKhoan, The
    TrangThai = Column(String(30), default="HoanThanh")

# 16. CHI TIẾT HÓA ĐƠN
class ChiTietHoaDon(Base):
    __tablename__ = "chitiethoadon"
    MaCTHD = Column(Integer, primary_key=True, autoincrement=True)
    MaHD = Column(String(30), ForeignKey("hoadon.MaHD"), nullable=False)
    MaMonSize = Column(String(30), ForeignKey("mon_size.MaMonSize"), nullable=False)
    SoLuong = Column(Integer, nullable=False)
    DonGia = Column(Float, nullable=False)
    ThanhTien = Column(Float, nullable=False)
    GhiChu = Column(String(255), nullable=True)

# 17. VAI TRÒ HỆ THỐNG (ROLES)
class Role(Base):
    __tablename__ = "roles"
    RoleId = Column(String(20), primary_key=True, index=True)
    RoleCode = Column(String(50), unique=True, nullable=False) # SUPER_ADMIN, BRANCH_MANAGER, CASHIER
    RoleName = Column(String(100), nullable=False)
    Description = Column(String(255))
    IsActive = Column(Integer, default=1)

# 18. PHÂN QUYỀN CHI NHÁNH (USER_BRANCH_MAPPING - N:N)
class UserBranchMapping(Base):
    __tablename__ = "user_branch_mappings"
    MappingId = Column(Integer, primary_key=True, autoincrement=True)
    UserId = Column(String(20), ForeignKey("nhanvien.MaNV"), nullable=False)
    BranchId = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    IsDefault = Column(Integer, default=0)

# 19. KIỂM KÊ KHO CUỐI NGÀY & HAO HỤT
class KiemKeKho(Base):
    __tablename__ = "kiemkekho"
    MaKiemKe = Column(String(30), primary_key=True, index=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    NgayKiemKe = Column(String(20), nullable=False)
    NguoiKiemKe = Column(String(100), nullable=False)
    MaNL = Column(String(20), ForeignKey("nguyenlieu.MaNL"), nullable=False)
    TonMay = Column(Float, nullable=False)
    TonThucTe = Column(Float, nullable=False)
    ChenhLech = Column(Float, nullable=False)
    LyDo = Column(String(255))

# 20. YÊU CẦU PHÊ DUYỆT HỦY MÓN / HÓA ĐƠN
class YeuCauHuy(Base):
    __tablename__ = "yeucauhuy"
    MaYeuCau = Column(String(30), primary_key=True, index=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    MaHD = Column(String(30), nullable=False)
    TenMon = Column(String(100))
    SoTien = Column(Float, default=0.0)
    ThuNgan = Column(String(100), nullable=False)
    LyDo = Column(String(255), nullable=False)
    ThoiGian = Column(String(30), nullable=False)
    TrangThai = Column(String(30), default="ChoDuyet") # ChoDuyet, DaDuyet, TuChoi

# 21. BÀN GIAO KÉT TIỀN & CHỐT CA (Z-REPORT)
class ChotCaKetTien(Base):
    __tablename__ = "chotcakettien"
    MaChotCa = Column(String(30), primary_key=True, index=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    CaLam = Column(String(50), nullable=False)
    ThuNgan = Column(String(100), nullable=False)
    TienDauCa = Column(Float, default=1000000.0)
    TienThuTrongCa = Column(Float, default=0.0)
    ChiKhanCap = Column(Float, default=0.0)
    TienLyThuyet = Column(Float, default=0.0)
    TienThucDem = Column(Float, default=0.0)
    ChenhLech = Column(Float, default=0.0)
    ThoiGian = Column(String(30), nullable=False)
    GhiChu = Column(String(255))

# 22. PHIẾU THU (PHIEUTHU)
class PhieuThu(Base):
    __tablename__ = "phieuthu"
    MaPhieuThu = Column(String(30), primary_key=True, index=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    MaNV = Column(String(20), nullable=True)
    TenNV = Column(String(100), nullable=True)
    NgayThu = Column(String(30), nullable=False)
    SoTien = Column(Float, nullable=False)
    LyDo = Column(String(255), nullable=False)
    PhuongThuc = Column(String(30), default="TienMat")
    NguoiNop = Column(String(100), nullable=False)
    LoaiPhieu = Column(String(20), default="ThuCong") # "TuDong" hoặc "ThuCong"
    NguoiCapNhat = Column(String(100), nullable=True)
    NgayCapNhat = Column(String(30), nullable=True)
    LichSuChinhSua = Column(String(500), nullable=True)

# 23. PHIẾU CHI (PHIEUCHI)
class PhieuChi(Base):
    __tablename__ = "phieuchi"
    MaPhieuChi = Column(String(30), primary_key=True, index=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    MaNV = Column(String(20), nullable=True)
    TenNV = Column(String(100), nullable=True)
    NgayChi = Column(String(30), nullable=False)
    SoTien = Column(Float, nullable=False)
    LyDo = Column(String(255), nullable=False)
    PhuongThuc = Column(String(30), default="TienMat")
    NguoiNhan = Column(String(100), nullable=False)
    LoaiPhieu = Column(String(20), default="ThuCong") # "TuDong" hoặc "ThuCong"
    NguoiCapNhat = Column(String(100), nullable=True)
    NgayCapNhat = Column(String(30), nullable=True)
    LichSuChinhSua = Column(String(500), nullable=True)

# 24. SỔ QUỸ (SOQUY)
class SoQuy(Base):
    __tablename__ = "soquy"
    MaSoQuy = Column(String(30), primary_key=True, index=True)
    MaCN = Column(String(20), ForeignKey("chinhanh.MaCN"), nullable=False)
    NgayGiaoDich = Column(String(30), nullable=False)
    LoaiGiaoDich = Column(String(10), nullable=False) # "Thu", "Chi"
    SoTienThu = Column(Float, default=0.0)
    SoTienChi = Column(Float, default=0.0)
    TonQuy = Column(Float, default=0.0)
    HinhThucTT = Column(String(30), default="TienMat")
    MaPhieuThu = Column(String(30), nullable=True)
    MaPhieuChi = Column(String(30), nullable=True)
    DienGiai = Column(String(255), nullable=True)


