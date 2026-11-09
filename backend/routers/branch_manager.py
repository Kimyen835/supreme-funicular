from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import datetime

router = APIRouter(prefix="/api/branch-manager", tags=["Vận Hành Quản Lý Chi Nhánh"])

# 1. Dashboard vận hành của riêng chi nhánh
@router.get("/dashboard")
def get_branch_dashboard(branch_id: str = "CN01", db: Session = Depends(get_db)):
    branch = db.query(models.ChiNhanh).filter(models.ChiNhanh.MaCN == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Không tìm thấy chi nhánh")

    invoices = db.query(models.HoaDon).filter(
        models.HoaDon.MaCN == branch_id,
        models.HoaDon.TrangThai == "HoanThanh"
    ).all()

    total_revenue = sum(hd.TongThanhToan for hd in invoices) if invoices else 0.0
    total_orders = len(invoices)
    
    active_tables = db.query(models.Ban).filter(
        models.Ban.MaCN == branch_id,
        models.Ban.TrangThai == "CoKhach"
    ).count()

    return {
        "MaCN": branch.MaCN,
        "TenCN": branch.TenCN,
        "DoanhThu": total_revenue,
        "TongDon": total_orders,
        "TheDangDung": active_tables,
        "GioCaoDiem": "12:00 - 13:30 (Đỉnh trưa)",
        "TrangThai": "HoatDong"
    }

# 2. Lấy danh sách kiểm kê kho & hao hụt cuối ngày
@router.get("/stock-audit")
def get_stock_audits(branch_id: str = "CN01", db: Session = Depends(get_db)):
    audits = db.query(models.KiemKeKho).filter(models.KiemKeKho.MaCN == branch_id).all()
    return audits

# 3. Tạo phiếu kiểm kê kho & ghi nhận hao hụt dial-in
@router.post("/stock-audit")
def create_stock_audit(req: schemas.StockAuditRequest, db: Session = Depends(get_db)):
    audit = models.KiemKeKho(
        MaKiemKe=f"KK_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
        MaCN=req.MaCN,
        NgayKiemKe=datetime.datetime.now().strftime("%Y-%m-%d"),
        NguoiKiemKe=req.NguoiKiemKe,
        MaNL=req.MaNL,
        TonMay=req.TonMay,
        TonThucTe=req.TonThucTe,
        ChenhLech=round(req.TonThucTe - req.TonMay, 2),
        LyDo=req.LyDo
    )
    db.add(audit)
    
    # Cập nhật số lượng tồn kho thực tế nếu có
    tk = db.query(models.TonKho).filter(
        models.TonKho.MaCN == req.MaCN,
        models.TonKho.MaNL == req.MaNL
    ).first()
    if tk:
        tk.SoLuongTon = req.TonThucTe

    db.commit()
    db.refresh(audit)
    return {"status": "success", "message": "Đã lưu bảng kiểm kê kho thành công", "data": audit}

# 4. Lấy danh sách yêu cầu hủy món / hủy bill chờ duyệt
@router.get("/void-requests")
def get_void_requests(branch_id: str = "CN01", db: Session = Depends(get_db)):
    requests = db.query(models.YeuCauHuy).filter(
        models.YeuCauHuy.MaCN == branch_id
    ).order_by(models.YeuCauHuy.MaYeuCau.desc()).all()
    return requests

# 5. Phê duyệt hoặc từ chối hủy món bằng mã PIN của Quản lý chi nhánh
@router.post("/void-approval")
def approve_void_request(req: schemas.VoidApprovalRequest, db: Session = Depends(get_db)):
    # Xác thực mã PIN Quản lý: CN1: 8888, CN2: 9999, Admin: 1111
    valid_pins = {
        "CN01": ["8888", "1111", "1234"],
        "CN02": ["9999", "1111", "1234"]
    }
    allowed = valid_pins.get(req.MaCN, ["8888", "1111"])
    if req.PinCode not in allowed:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Mã PIN Quản Lý không chính xác! (Chi nhánh {req.MaCN} yêu cầu mã PIN cấp quyền)"
        )

    item = db.query(models.YeuCauHuy).filter(models.YeuCauHuy.MaYeuCau == req.MaYeuCau).first()
    if not item:
        # Tạo bản ghi log duyệt mới
        item = models.YeuCauHuy(
            MaYeuCau=req.MaYeuCau,
            MaCN=req.MaCN,
            MaHD=req.MaHD or "HD_UNSPECIFIED",
            TenMon=req.TenMon or "Món hủy",
            SoTien=req.SoTien or 0.0,
            ThuNgan=req.ThuNgan or "Thu ngân quầy",
            LyDo=req.LyDo or "Quản lý duyệt hủy trực tiếp",
            ThoiGian=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            TrangThai="DaDuyet" if req.Action == "APPROVE" else "TuChoi"
        )
        db.add(item)
    else:
        item.TrangThai = "DaDuyet" if req.Action == "APPROVE" else "TuChoi"

    db.commit()
    return {
        "status": "success",
        "action": req.Action,
        "message": f"Đã {'PHÊ DUYỆT' if req.Action == 'APPROVE' else 'TỪ CHỐI'} yêu cầu hủy thành công!"
    }

# 6. Chốt két tiền và nộp biên bản Z-Report từ quầy POS
@router.post("/cash-drawer/z-report")
def submit_z_report(req: schemas.ZReportRequest, db: Session = Depends(get_db)):
    z_report = models.ChotCaKetTien(
        MaChotCa=f"ZR_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}",
        MaCN=req.MaCN,
        CaLam=req.CaLam,
        ThuNgan=req.ThuNgan,
        TienDauCa=req.TienDauCa,
        TienThuTrongCa=req.TienThuTrongCa,
        ChiKhanCap=req.ChiKhanCap,
        TienLyThuyet=req.TienLyThuyet,
        TienThucDem=req.TienThucDem,
        ChenhLech=round(req.TienThucDem - req.TienLyThuyet, 2),
        ThoiGian=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        GhiChu=req.GhiChu
    )
    db.add(z_report)
    db.commit()
    db.refresh(z_report)
    return {
        "status": "success",
        "message": "Đã lưu biên bản chốt két tiền Z-Report thành công",
        "data": z_report
    }
