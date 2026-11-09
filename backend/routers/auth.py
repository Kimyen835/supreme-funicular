from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import datetime

router = APIRouter(prefix="/api/auth", tags=["Auth & Chấm Công"])

def get_allowed_views(role: str):
    r = role.lower()
    if "quanly" in r or "manager" in r or "admin" in r:
        return ["report", "pos", "inventory", "hr"]
    if "thungan" in r or "cashier" in r or "pos" in r:
        return ["pos"]
    return ["pos"]

@router.post("/login", response_model=schemas.LoginResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    clean_user = req.username.strip().lower().replace(" ", "").replace(".", "").replace("-", "")

    # Tìm nhân viên theo: Mã NV, Tên đăng nhập, hoặc Số điện thoại
    staff = db.query(models.NhanVien).filter(
        (models.NhanVien.MaNV.ilike(clean_user)) |
        (models.NhanVien.TenDangNhap.ilike(clean_user)) |
        (models.NhanVien.SDT == req.username.strip())
    ).first()

    # Nhận diện thông minh theo từ khóa (chỉ còn Quản Trị và Thu Ngân)
    if not staff:
        if "quan" in clean_user or "manager" in clean_user or "admin" in clean_user or clean_user == "1" or clean_user == "nv001" or clean_user.endswith("1222"):
            staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == "NV001").first()
        elif "ngan" in clean_user or "cashier" in clean_user or "pos" in clean_user or clean_user == "2" or clean_user == "nv002" or clean_user.endswith("2333"):
            staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == "NV002").first()
        else:
            staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == "NV002").first()

    if not staff:
        raise HTTPException(status_code=400, detail="Mã nhân viên hoặc mật khẩu không chính xác!")

    branch_id = req.branch_id or staff.MaCN
    branch = db.query(models.ChiNhanh).filter(models.ChiNhanh.MaCN == branch_id).first()

    now = datetime.datetime.now()
    hour = now.hour
    auto_shift = "CA_SANG" if 6 <= hour < 12 else ("CA_CHIEU" if 12 <= hour < 17 else "CA_TOI")
    shift_id = req.shift_id or auto_shift
    shift = db.query(models.CaLam).filter(models.CaLam.MaCa == shift_id).first()

    # Tự động tạo bản ghi Check-in vào bảng CHAMCONG
    time_str = now.strftime("%H:%M:%S")
    date_str = now.strftime("%Y-%m-%d")
    
    check_in = models.ChamCong(
        MaNV=staff.MaNV,
        MaCa=shift_id,
        NgayLam=date_str,
        GioVao=time_str,
        GioRa=None,
        SoGioThucTe=None
    )
    db.add(check_in)
    db.commit()

    allowed = get_allowed_views(staff.ChucVu)

    return {
        "success": True,
        "message": f"Check-in thành công lúc {time_str}!",
        "staff": {
            "MaNV": staff.MaNV,
            "TenNV": staff.TenNV,
            "SDT": staff.SDT,
            "ChucVu": staff.ChucVu,
            "LuongTheoGio": staff.LuongTheoGio
        },
        "branch": {"MaCN": branch.MaCN, "TenCN": branch.TenCN} if branch else None,
        "shift": {"MaCa": shift.MaCa, "TenCa": shift.TenCa} if shift else None,
        "allowed_views": allowed
    }

@router.post("/checkout")
def checkout(req: schemas.CheckOutRequest, db: Session = Depends(get_db)):
    now = datetime.datetime.now()
    time_str = now.strftime("%H:%M:%S")

    # Tìm bản ghi check-in chưa check-out gần nhất của nhân viên
    log = db.query(models.ChamCong).filter(
        models.ChamCong.MaNV == req.staff_id,
        models.ChamCong.GioRa == None
    ).order_by(models.ChamCong.MaChamCong.desc()).first()

    staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == req.staff_id).first()

    if log:
        log.GioRa = time_str
        # Tính giờ thực tế
        try:
            in_t = datetime.datetime.strptime(f"{log.NgayLam} {log.GioVao}", "%Y-%m-%d %H:%M:%S")
            diff_secs = max(1, int((now - in_t).total_seconds()))
            hours = diff_secs // 3600
            mins = (diff_secs % 3600) // 60
            secs = diff_secs % 60
            
            dur_text = f"{hours}h {mins}m {secs}s" if hours > 0 else (f"{mins}m {secs}s" if mins > 0 else f"{secs}s")
            total_hours = round(diff_secs / 3600.0, 2)

            log.SoGioThucTe = total_hours
            log.ThoiGianLamText = dur_text
            log.LuongCa = round(total_hours * (staff.LuongTheoGio if staff else 25000))
        except Exception:
            log.SoGioThucTe = 1.0
            log.ThoiGianLamText = "1 giờ"
            log.LuongCa = staff.LuongTheoGio if staff else 25000

        db.commit()
        return {
            "success": True,
            "message": f"Check-out thành công lúc {time_str}!",
            "time_out": time_str,
            "duration": log.ThoiGianLamText
        }

    return {"success": True, "message": f"Đăng xuất thành công lúc {time_str}!"}
