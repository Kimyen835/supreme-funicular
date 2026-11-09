from pydantic import BaseModel, Field
from typing import List, Optional

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = "1234"
    branch_id: Optional[str] = None
    shift_id: Optional[str] = None

class LoginResponse(BaseModel):
    success: bool
    message: str
    staff: Optional[dict] = None
    branch: Optional[dict] = None
    shift: Optional[dict] = None
    allowed_views: List[str] = []

class CheckOutRequest(BaseModel):
    staff_id: str
    shift_id: Optional[str] = None

# --- POS SCHEMAS ---
class OrderItemSchema(BaseModel):
    MaMonSize: str
    TenMon: str
    TenSize: str
    SoLuong: int
    GiaBan: float
    HinhAnh: Optional[str] = "☕"
    GhiChu: Optional[str] = ""

class CreateOrderRequest(BaseModel):
    MaCN: str
    MaBan: Optional[str] = None
    SoTheBan: Optional[str] = None
    MaNV: str
    MaKH: Optional[str] = None
    CustomerPhone: Optional[str] = None
    CustomerName: Optional[str] = None
    IsNewCustomer: Optional[bool] = False
    LoaiDonHang: Optional[str] = "DungTaiCho" # "DungTaiCho" hoặc "TakeAway"
    PaymentMethod: str = "TienMat"
    CashGiven: Optional[float] = 0.0
    DiscountAmount: Optional[float] = 0.0
    DiscountPercent: Optional[float] = 0.0
    Items: List[OrderItemSchema]
    Subtotal: Optional[float] = None
    Total: Optional[float] = None

class TableTransferRequest(BaseModel):
    SourceTableId: str
    TargetTableId: str

class TableStatusUpdateRequest(BaseModel):
    MaBan: str
    TrangThai: str
    YeuCauThanhToan: Optional[int] = 0

# --- KDS SCHEMAS ---
class SendToKitchenRequest(BaseModel):
    tableId: Optional[str] = None
    tableName: str
    items: List[OrderItemSchema]
    sender: Optional[str] = "Phục vụ"

class UpdateKdsStatusRequest(BaseModel):
    ticketId: str
    status: str # ChoPhaChe, DangPhaChe, DaHoanThanh

# --- INVENTORY SCHEMAS ---
class StockImportRequest(BaseModel):
    MaCN: str
    MaNL: str
    SoLuongNhap: float

# --- HR & STAFF SCHEMAS ---
class StaffCreateRequest(BaseModel):
    MaNV: str
    TenNV: str
    GioiTinh: Optional[str] = "Nam"
    DiaChi: Optional[str] = ""
    SDT: Optional[str] = ""
    ChucVu: str
    LuongTheoGio: Optional[float] = 25000.0
    TenDangNhap: str
    MatKhau: Optional[str] = "1234"
    MaCN: Optional[str] = "CN01"
    TrangThai: Optional[str] = "Đang làm việc"

class StaffUpdateRequest(BaseModel):
    TenNV: Optional[str] = None
    GioiTinh: Optional[str] = None
    DiaChi: Optional[str] = None
    SDT: Optional[str] = None
    ChucVu: Optional[str] = None
    LuongTheoGio: Optional[float] = None
    TenDangNhap: Optional[str] = None
    MatKhau: Optional[str] = None
    MaCN: Optional[str] = None
    TrangThai: Optional[str] = None

class CalculatePayrollRequest(BaseModel):
    MaNV: str
    Thang: int
    Nam: int
    PhuCap: Optional[float] = 300000.0
    ThuongPhat: Optional[float] = 200000.0

# --- BRANCH MANAGER & OPERATIONS SCHEMAS ---
class StockAuditRequest(BaseModel):
    MaCN: str
    NguoiKiemKe: str
    MaNL: str
    TonMay: float
    TonThucTe: float
    LyDo: Optional[str] = "Hao hụt kiểm kê cuối ngày"

class VoidApprovalRequest(BaseModel):
    MaYeuCau: str
    MaCN: str
    PinCode: str
    Action: Optional[str] = "APPROVE" # APPROVE, REJECT
    MaHD: Optional[str] = None
    TenMon: Optional[str] = None
    SoTien: Optional[float] = 0.0
    ThuNgan: Optional[str] = None
    LyDo: Optional[str] = None

class ZReportRequest(BaseModel):
    MaCN: str
    CaLam: str
    ThuNgan: str
    TienDauCa: Optional[float] = 1000000.0
    TienThuTrongCa: float
    ChiKhanCap: Optional[float] = 0.0
    TienLyThuyet: float
    TienThucDem: float
    GhiChu: Optional[str] = "Bàn giao ca bình thường"

# --- SHIFT ASSIGNMENT SCHEMAS ---
class ShiftAssignmentCreateRequest(BaseModel):
    MaPhanCa: Optional[str] = None
    MaNV: str
    MaCN: str
    MaCa: str
    Thu: str
    NgayLam: str
    TrangThai: Optional[str] = "DaDuyet"

# --- FINANCE SCHEMAS (PHIẾU THU & PHIẾU CHI) ---
class PhieuThuCreateRequest(BaseModel):
    MaPhieuThu: Optional[str] = None
    MaCN: str
    MaNV: Optional[str] = None
    TenNV: Optional[str] = None
    NgayThu: Optional[str] = None
    SoTien: float
    LyDo: str
    PhuongThuc: Optional[str] = "TienMat"
    NguoiNop: str
    LoaiPhieu: Optional[str] = "ThuCong"

class PhieuThuUpdateRequest(BaseModel):
    NguoiNop: Optional[str] = None
    LyDo: Optional[str] = None
    SoTien: Optional[float] = None
    PhuongThuc: Optional[str] = None
    NgayThu: Optional[str] = None
    MaCN: Optional[str] = None
    NguoiCapNhat: Optional[str] = None

class PhieuChiCreateRequest(BaseModel):
    MaPhieuChi: Optional[str] = None
    MaCN: str
    MaNV: Optional[str] = None
    TenNV: Optional[str] = None
    NgayChi: Optional[str] = None
    SoTien: float
    LyDo: str
    PhuongThuc: Optional[str] = "TienMat"
    NguoiNhan: str
    LoaiPhieu: Optional[str] = "ThuCong"

class PhieuChiUpdateRequest(BaseModel):
    NguoiNhan: Optional[str] = None
    LyDo: Optional[str] = None
    SoTien: Optional[float] = None
    PhuongThuc: Optional[str] = None
    NgayChi: Optional[str] = None
    MaCN: Optional[str] = None
    NguoiCapNhat: Optional[str] = None


