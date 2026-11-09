from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import datetime

router = APIRouter(prefix="/api/hr", tags=["Nhân Sự & Bảng Lương"])
employees_router = APIRouter(prefix="/api/employees", tags=["Quản Lý Nhân Viên (Employees API)"])

def get_staff_helper(branch_id: str = None, exclude_admin: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.NhanVien)
    if branch_id and branch_id != "ALL":
        query = query.filter(models.NhanVien.MaCN == branch_id)
        # Tuyệt đối không hiển thị tài khoản Admin cấp cao nhất khi lọc theo chi nhánh
        query = query.filter(models.NhanVien.ChucVu != "SUPER_ADMIN")
    elif exclude_admin:
        query = query.filter(models.NhanVien.ChucVu != "SUPER_ADMIN")
    staff = query.all()
    return [
        {
            "MaNV": s.MaNV,
            "TenNV": s.TenNV,
            "GioiTinh": s.GioiTinh or "Nam",
            "DiaChi": s.DiaChi or "",
            "SDT": s.SDT or "",
            "ChucVu": s.ChucVu,
            "LuongTheoGio": s.LuongTheoGio or 25000.0,
            "TenDangNhap": s.TenDangNhap,
            "MaCN": s.MaCN,
            "TrangThai": s.TrangThai or "Đang làm việc"
        }
        for s in staff
    ]

def create_staff_helper(req: schemas.StaffCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(models.NhanVien).filter(
        (models.NhanVien.MaNV == req.MaNV) | (models.NhanVien.TenDangNhap == req.TenDangNhap)
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Mã nhân viên (MaNV) hoặc Tên đăng nhập (TenDangNhap) đã tồn tại trong hệ thống!"
        )

    new_staff = models.NhanVien(
        MaNV=req.MaNV,
        TenNV=req.TenNV,
        GioiTinh=req.GioiTinh or "Nam",
        DiaChi=req.DiaChi or "",
        SDT=req.SDT or "",
        ChucVu=req.ChucVu,
        LuongTheoGio=req.LuongTheoGio or 25000.0,
        TenDangNhap=req.TenDangNhap,
        MatKhau=req.MatKhau or "1234",
        MaCN=req.MaCN or "CN01",
        TrangThai=req.TrangThai or "Đang làm việc"
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    return {
        "status": "success",
        "message": f"Thêm nhân viên mới {new_staff.TenNV} thành công!",
        "data": {
            "MaNV": new_staff.MaNV,
            "TenNV": new_staff.TenNV,
            "GioiTinh": new_staff.GioiTinh,
            "DiaChi": new_staff.DiaChi,
            "SDT": new_staff.SDT,
            "ChucVu": new_staff.ChucVu,
            "LuongTheoGio": new_staff.LuongTheoGio,
            "TenDangNhap": new_staff.TenDangNhap,
            "MaCN": new_staff.MaCN,
            "TrangThai": new_staff.TrangThai
        }
    }

def update_staff_helper(staff_id: str, req: schemas.StaffUpdateRequest, db: Session = Depends(get_db)):
    staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên với mã: " + staff_id)

    if req.TenNV is not None:
        staff.TenNV = req.TenNV
    if req.GioiTinh is not None:
        staff.GioiTinh = req.GioiTinh
    if req.DiaChi is not None:
        staff.DiaChi = req.DiaChi
    if req.SDT is not None:
        staff.SDT = req.SDT
    if req.ChucVu is not None:
        staff.ChucVu = req.ChucVu
    if req.LuongTheoGio is not None:
        staff.LuongTheoGio = req.LuongTheoGio
    if req.TenDangNhap is not None:
        staff.TenDangNhap = req.TenDangNhap
    if req.MatKhau is not None:
        staff.MatKhau = req.MatKhau
    if req.MaCN is not None:
        staff.MaCN = req.MaCN
    if req.TrangThai is not None:
        staff.TrangThai = req.TrangThai

    db.commit()
    db.refresh(staff)
    return {
        "status": "success",
        "message": f"Cập nhật thông tin nhân viên {staff.TenNV} thành công!",
        "data": {
            "MaNV": staff.MaNV,
            "TenNV": staff.TenNV,
            "GioiTinh": staff.GioiTinh,
            "DiaChi": staff.DiaChi,
            "SDT": staff.SDT,
            "ChucVu": staff.ChucVu,
            "LuongTheoGio": staff.LuongTheoGio,
            "TenDangNhap": staff.TenDangNhap,
            "MaCN": staff.MaCN,
            "TrangThai": staff.TrangThai
        }
    }

def delete_staff_disabled_helper(id: str):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Chức năng xóa cứng (Hard Delete) nhân viên đã bị vô hiệu hóa để bảo đảm toàn vẹn dữ liệu hệ thống (Hóa đơn, Chấm công, Bảng lương, Phiếu kho). Vui lòng cập nhật Trạng thái làm việc thành 'Đã nghỉ việc' (Soft Delete)."
    )

# Routes on /api/hr/staff
@router.get("/staff")
def get_staff_list(branch_id: str = None, exclude_admin: bool = False, db: Session = Depends(get_db)):
    return get_staff_helper(branch_id, exclude_admin, db)

@router.post("/staff")
def create_staff(req: schemas.StaffCreateRequest, db: Session = Depends(get_db)):
    return create_staff_helper(req, db)

@router.put("/staff/{staff_id}")
def update_staff(staff_id: str, req: schemas.StaffUpdateRequest, db: Session = Depends(get_db)):
    return update_staff_helper(staff_id, req, db)

@router.delete("/staff/{staff_id}")
def delete_staff(staff_id: str):
    return delete_staff_disabled_helper(staff_id)

# Routes on /api/employees
@employees_router.get("")
@employees_router.get("/")
def get_employees_list(branch_id: str = None, exclude_admin: bool = False, db: Session = Depends(get_db)):
    return get_staff_helper(branch_id, exclude_admin, db)

@employees_router.post("")
@employees_router.post("/")
def create_employee(req: schemas.StaffCreateRequest, db: Session = Depends(get_db)):
    return create_staff_helper(req, db)

@employees_router.put("/{id}")
def update_employee(id: str, req: schemas.StaffUpdateRequest, db: Session = Depends(get_db)):
    return update_staff_helper(id, req, db)

@employees_router.delete("/{id}")
def delete_employee(id: str):
    return delete_staff_disabled_helper(id)

@router.get("/timelog")
def get_timelogs(branch_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.ChamCong)
    if branch_id and branch_id != "ALL":
        # Lọc theo nhân viên thuộc chi nhánh
        staff_ids = [s.MaNV for s in db.query(models.NhanVien).filter(models.NhanVien.MaCN == branch_id).all()]
        query = query.filter(models.ChamCong.MaNV.in_(staff_ids))
    logs = query.order_by(models.ChamCong.MaChamCong.desc()).limit(30).all()
    result = []
    for l in logs:
        nv = db.query(models.NhanVien).filter(models.NhanVien.MaNV == l.MaNV).first()
        ca = db.query(models.CaLam).filter(models.CaLam.MaCa == l.MaCa).first()
        result.append({
            "MaChamCong": l.MaChamCong,
            "MaNV": l.MaNV,
            "TenNV": nv.TenNV if nv else l.MaNV,
            "CaLam": ca.TenCa if ca else l.MaCa,
            "NgayLam": l.NgayLam,
            "GioVao": l.GioVao,
            "GioRa": l.GioRa,
            "ThoiGianLamText": l.ThoiGianLamText or (f"{l.SoGioThucTe} giờ" if l.SoGioThucTe else "---"),
            "LuongCa": l.LuongCa or (round(l.SoGioThucTe * nv.LuongTheoGio) if (l.SoGioThucTe and nv) else 0)
        })
    return result

@router.post("/calculate-payroll")
def calculate_payroll(req: schemas.CalculatePayrollRequest, db: Session = Depends(get_db)):
    staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == req.MaNV).first()
    logs = db.query(models.ChamCong).filter(
        models.ChamCong.MaNV == req.MaNV,
        models.ChamCong.SoGioThucTe != None
    ).all()

    total_hours = round(sum(l.SoGioThucTe for l in logs), 2) if logs else 0.0
    base_rate = staff.LuongTheoGio if staff else 25000.0
    base_salary = round(total_hours * base_rate)
    net_pay = base_salary + req.PhuCap + req.ThuongPhat

    ma_bl = f"BL_{req.Nam}{str(req.Thang).zfill(2)}_{req.MaNV}"
    bl = models.BangLuong(
        MaBangLuong=ma_bl,
        MaNV=req.MaNV,
        Thang=req.Thang,
        Nam=req.Nam,
        TongGioLam=total_hours,
        LuongTheoGio=base_rate,
        PhuCap=req.PhuCap,
        ThuongPhat=req.ThuongPhat,
        ThucLinh=net_pay
    )
    db.add(bl)
    db.commit()

    return {
        "success": True,
        "message": f"Đã tính lương tháng {req.Thang}/{req.Nam} cho {staff.TenNV if staff else req.MaNV}!",
        "payroll": {
            "MaBangLuong": ma_bl,
            "TenNV": staff.TenNV if staff else req.MaNV,
            "TongGioLam": total_hours,
            "LuongTheoGio": base_rate,
            "LuongThucTe": base_salary,
            "PhuCap": req.PhuCap,
            "ThuongPhat": req.ThuongPhat,
            "ThucLinh": net_pay
        }
    }

from fastapi.responses import Response

@router.get("/devices")
def get_devices(branch_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.ThietBiChamCong)
    if branch_id and branch_id != "ALL":
        query = query.filter(models.ThietBiChamCong.MaCN == branch_id)
    devices = query.all()
    if not devices:
        d1 = models.ThietBiChamCong(
            MaTB="TB01",
            TenTB="Ronald Jack Pro Cloud (Cửa Chính)",
            MaCN="CN01",
            SerialNumber="RJ-CN01-8899",
            IP_LAN="192.168.1.200",
            Protocol="ADMS / Cloud Push (Port 8000)",
            TrangThai="Online",
            LastSync="Vừa xong",
            TongLog=1248
        )
        d2 = models.ThietBiChamCong(
            MaTB="TB02",
            TenTB="ZKTeco SpeedFace Cloud (Quầy Thu Ngân)",
            MaCN="CN02",
            SerialNumber="ZK-CN02-7788",
            IP_LAN="192.168.2.200",
            Protocol="ADMS / Cloud Push (Port 8000)",
            TrangThai="Online",
            LastSync="Vừa xong",
            TongLog=896
        )
        db.add_all([d1, d2])
        db.commit()
        if branch_id and branch_id != "ALL":
            devices = [d for d in [d1, d2] if d.MaCN == branch_id]
        else:
            devices = [d1, d2]
    return devices

@router.post("/attendance/push")
def receive_attendance_push(
    staff_id: str,
    device_id: str,
    branch_id: str = "CN01",
    punch_type: str = "Check-in",
    db: Session = Depends(get_db)
):
    now = datetime.datetime.now()
    time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    date_str = now.strftime("%Y-%m-%d")
    hour_minute = now.strftime("%H:%M")

    hour = now.hour
    shift_id = "CA_SANG" if 6 <= hour < 12 else ("CA_CHIEU" if 12 <= hour < 17 else "CA_TOI")
    late_minutes = (now.minute - 30) if (hour == 6 and now.minute > 30) else (15 if hour > 6 and shift_id == "CA_SANG" else 0)

    log = models.ChamCongRawLog(
        MaLog=f"LOG_{int(now.timestamp())}",
        MaNV=staff_id,
        MaCN=branch_id,
        MaTB=device_id,
        ThoiGian=time_str,
        KieuQuet=punch_type,
        Status=f"Đi trễ {late_minutes}p" if late_minutes > 0 else "Đúng giờ"
    )
    db.add(log)

    dev = db.query(models.ThietBiChamCong).filter(models.ThietBiChamCong.MaTB == device_id).first()
    if dev:
        dev.LastSync = "Vừa xong"
        dev.TongLog = (dev.TongLog or 0) + 1

    cc = db.query(models.ChamCong).filter(
        models.ChamCong.MaNV == staff_id,
        models.ChamCong.NgayLam == date_str
    ).first()

    if not cc:
        cc = models.ChamCong(
            MaNV=staff_id,
            MaCa=shift_id,
            NgayLam=date_str,
            GioVao=hour_minute,
            GioRa="12:00",
            DiTrePhut=late_minutes,
            VeSomPhut=0,
            SoGioThucTe=max(1.0, 5.5 - (late_minutes / 60.0)),
            TrangThai=f"Đi trễ {late_minutes}p" if late_minutes > 0 else "Đúng giờ"
        )
        db.add(cc)
    
    db.commit()

    return {
        "success": True,
        "message": "Log vân tay nhận thành công trong 2 giây! (ADMS Real-time Push)",
        "sync_time": time_str
    }

@router.get("/payroll/export")
def export_payroll_csv(branch_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.BangLuong)
    if branch_id and branch_id != "ALL":
        staff_ids = [s.MaNV for s in db.query(models.NhanVien).filter(models.NhanVien.MaCN == branch_id).all()]
        query = query.filter(models.BangLuong.MaNV.in_(staff_ids))
    payrolls = query.all()
    csv_content = "\uFEFFMã NV,Kỳ Lương,Tổng Giờ Làm,Lương Theo Giờ,Phụ Cấp,Phạt Đi Trễ,Thực Lãnh,Trạng Thái\n"
    for p in payrolls:
        csv_content += f"{p.MaNV},Tháng {p.Thang}/{p.Nam},{p.TongGioLam},{p.LuongTheoGio},{p.PhuCap},{p.PhatDiTre or 0},{p.ThucLinh},{p.TrangThai}\n"
    
    filename = f"Bang_Luong_{branch_id if branch_id else 'ToanChuoi'}.csv"
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# -------------------------------------------------------------
# PHÂN CA LÀM VIỆC (SHIFT ASSIGNMENTS API)
# -------------------------------------------------------------
@router.get("/shifts/assignments")
@router.get("/shift-assignments")
@router.get("/phanca")
def get_shift_assignments(branch_id: str = None, db: Session = Depends(get_db)):
    models.Base.metadata.create_all(bind=db.get_bind())
    
    # Kiểm tra nếu chưa có phân ca nào thì seed dữ liệu mặc định
    if db.query(models.PhanCa).count() == 0:
        default_pcs = [
            models.PhanCa(MaPhanCa='PC01', MaNV='NV002', MaCN='CN01', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
            models.PhanCa(MaPhanCa='PC02', MaNV='NV003', MaCN='CN01', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
            models.PhanCa(MaPhanCa='PC03', MaNV='NV008', MaCN='CN01', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
            models.PhanCa(MaPhanCa='PC04', MaNV='NV006', MaCN='CN01', MaCa='CA_CHIEU', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
            models.PhanCa(MaPhanCa='PC05', MaNV='NV004', MaCN='CN02', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
            models.PhanCa(MaPhanCa='PC06', MaNV='NV005', MaCN='CN02', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
            models.PhanCa(MaPhanCa='PC07', MaNV='NV009', MaCN='CN02', MaCa='CA_SANG', Thu='Thứ 2', NgayLam='2026-10-15', TrangThai='DaDuyet'),
        ]
        db.add_all(default_pcs)
        db.commit()

    # Truy vấn JOIN giữa PHANCA và NHANVIEN (và CALAM) để select thêm Mã nhân viên (MaNV / employee_id)
    query = (
        db.query(
            models.PhanCa.MaPhanCa,
            models.PhanCa.MaNV.label("employee_id"),
            models.NhanVien.MaNV,
            models.NhanVien.TenNV,
            models.NhanVien.ChucVu,
            models.PhanCa.MaCN,
            models.PhanCa.MaCa,
            models.CaLam.TenCa,
            models.PhanCa.Thu,
            models.PhanCa.NgayLam,
            models.PhanCa.TrangThai,
        )
        .outerjoin(models.NhanVien, models.PhanCa.MaNV == models.NhanVien.MaNV)
        .outerjoin(models.CaLam, models.PhanCa.MaCa == models.CaLam.MaCa)
    )

    if branch_id and branch_id != "ALL":
        query = query.filter(models.PhanCa.MaCN == branch_id)

    rows = query.order_by(models.PhanCa.MaPhanCa.asc()).all()

    return [
        {
            "MaPhanCa": r.MaPhanCa,
            "MaNV": r.MaNV or r.employee_id,
            "employee_id": r.employee_id or r.MaNV,
            "TenNV": r.TenNV or r.employee_id or r.MaNV,
            "ChucVu": r.ChucVu,
            "MaCN": r.MaCN,
            "MaCa": r.MaCa,
            "TenCa": r.TenCa or r.MaCa,
            "Thu": r.Thu,
            "NgayLam": r.NgayLam,
            "TrangThai": r.TrangThai or "DaDuyet"
        }
        for r in rows
    ]

@router.post("/shifts/assignments")
@router.post("/shift-assignments")
@router.post("/phanca")
def create_shift_assignment(req: schemas.ShiftAssignmentCreateRequest, db: Session = Depends(get_db)):
    models.Base.metadata.create_all(bind=db.get_bind())
    
    count = db.query(models.PhanCa).count()
    new_id = req.MaPhanCa or f"PC0{count + 1}"
    
    new_pc = models.PhanCa(
        MaPhanCa=new_id,
        MaNV=req.MaNV,
        MaCN=req.MaCN,
        MaCa=req.MaCa,
        Thu=req.Thu,
        NgayLam=req.NgayLam,
        TrangThai=req.TrangThai or "DaDuyet"
    )
    db.add(new_pc)
    db.commit()
    db.refresh(new_pc)
    
    nv = db.query(models.NhanVien).filter(models.NhanVien.MaNV == req.MaNV).first()
    ca = db.query(models.CaLam).filter(models.CaLam.MaCa == req.MaCa).first()
    
    return {
        "status": "success",
        "message": f"Phân ca thành công cho {nv.TenNV if nv else req.MaNV}",
        "data": {
            "MaPhanCa": new_pc.MaPhanCa,
            "MaNV": new_pc.MaNV,
            "employee_id": new_pc.MaNV,
            "TenNV": nv.TenNV if nv else new_pc.MaNV,
            "MaCN": new_pc.MaCN,
            "MaCa": new_pc.MaCa,
            "TenCa": ca.TenCa if ca else new_pc.MaCa,
            "Thu": new_pc.Thu,
            "NgayLam": new_pc.NgayLam,
            "TrangThai": new_pc.TrangThai
        }
    }

@router.delete("/shifts/assignments/{id}")
@router.delete("/shift-assignments/{id}")
@router.delete("/phanca/{id}")
def delete_shift_assignment(id: str, db: Session = Depends(get_db)):
    pc = db.query(models.PhanCa).filter(models.PhanCa.MaPhanCa == id).first()
    if not pc:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy phân ca: {id}")
    db.delete(pc)
    db.commit()
    return {"status": "success", "message": f"Đã hủy phân ca {id} thành công!"}

# Root-level router for shifts assignments (/api/phanca, /api/shift-assignments, /api/shifts/assignments)
shifts_router = APIRouter(prefix="/api", tags=["Phân Ca Làm Việc (Shifts API)"])

@shifts_router.get("/shifts/assignments")
@shifts_router.get("/shift-assignments")
@shifts_router.get("/phanca")
def get_shift_assignments_root(branch_id: str = None, db: Session = Depends(get_db)):
    return get_shift_assignments(branch_id=branch_id, db=db)

@shifts_router.post("/shifts/assignments")
@shifts_router.post("/shift-assignments")
@shifts_router.post("/phanca")
def create_shift_assignment_root(req: schemas.ShiftAssignmentCreateRequest, db: Session = Depends(get_db)):
    return create_shift_assignment(req=req, db=db)

@shifts_router.delete("/shifts/assignments/{id}")
@shifts_router.delete("/shift-assignments/{id}")
@shifts_router.delete("/phanca/{id}")
def delete_shift_assignment_root(id: str, db: Session = Depends(get_db)):
    return delete_shift_assignment(id=id, db=db)


