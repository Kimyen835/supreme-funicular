from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import datetime

router = APIRouter(tags=["Quản Lý Tài Chính & Dòng Tiền (Finance API)"])

def is_auto_receipt(pt: models.PhieuThu) -> bool:
    if pt.LoaiPhieu and pt.LoaiPhieu.lower() in ["tudong", "auto", "he_thong"]:
        return True
    code = pt.MaPhieuThu or ""
    lydo = (pt.LyDo or "").lower()
    if code.startswith("PT_HD") or code.startswith("PT_POS"):
        return True
    if any(k in lydo for k in ["hóa đơn", "hoa don", "pos", "bán lẻ", "ban le", "doanh thu bán lẻ"]):
        return True
    return False

def is_auto_payment(pc: models.PhieuChi) -> bool:
    if pc.LoaiPhieu and pc.LoaiPhieu.lower() in ["tudong", "auto", "he_thong"]:
        return True
    code = pc.MaPhieuChi or ""
    lydo = (pc.LyDo or "").lower()
    if code.startswith("PC_LUONG"):
        return True
    if any(k in lydo for k in ["lương", "luong", "chi trả lương", "bảng lương"]):
        return True
    return False

def seed_finance_data_if_empty(db: Session):
    models.Base.metadata.create_all(bind=db.get_bind())
    if db.query(models.PhieuThu).count() == 0:
        db.add_all([
            models.PhieuThu(
                MaPhieuThu="PT_001", MaCN="CN01", MaNV="NV002", TenNV="Lê Thu Ngân",
                NgayThu="2026-10-14 18:00", SoTien=399000.0,
                LyDo="Doanh thu bán lẻ POS tiền mặt", PhuongThuc="TienMat",
                NguoiNop="Khách hàng vãng lai", LoaiPhieu="TuDong"
            ),
            models.PhieuThu(
                MaPhieuThu="PT_002", MaCN="CN01", MaNV="NV002", TenNV="Lê Thu Ngân",
                NgayThu="2026-10-14 18:05", SoTien=412000.0,
                LyDo="Doanh thu bán lẻ POS chuyển khoản", PhuongThuc="ChuyenKhoan",
                NguoiNop="Khách thanh toán VietQR", LoaiPhieu="TuDong"
            ),
            models.PhieuThu(
                MaPhieuThu="PT_003", MaCN="CN02", MaNV="NV004", TenNV="Võ Thu Ngân",
                NgayThu="2026-10-14 18:00", SoTien=447000.0,
                LyDo="Doanh thu bán lẻ POS CN2", PhuongThuc="ChuyenKhoan",
                NguoiNop="Khách hàng POS", LoaiPhieu="TuDong"
            )
        ])
    if db.query(models.PhieuChi).count() == 0:
        db.add_all([
            models.PhieuChi(
                MaPhieuChi="PC_001", MaCN="CN01", MaNV="NV006", TenNV="Nguyễn Quản Lý",
                NgayChi="2026-10-15 09:30", SoTien=85000.0,
                LyDo="Chi khẩn cấp mua đá pha chế và túi nylon", PhuongThuc="TienMat",
                NguoiNhan="Đại lý đá sạch Q.1", LoaiPhieu="ThuCong"
            ),
            models.PhieuChi(
                MaPhieuChi="PC_002", MaCN="CN01", MaNV="NV001", TenNV="Trần Chủ Chuỗi",
                NgayChi="2026-10-12 15:00", SoTien=2100000.0,
                LyDo="Thanh toán tiền nhập sữa tươi Dalat Milk", PhuongThuc="ChuyenKhoan",
                NguoiNhan="Vinamilk TP.HCM", LoaiPhieu="ThuCong"
            )
        ])
    if db.query(models.SoQuy).count() == 0:
        db.add_all([
            models.SoQuy(
                MaSoQuy="SQ_001", MaCN="CN01", NgayGiaoDich="2026-10-14 08:30",
                LoaiGiaoDich="Thu", SoTienThu=1000000.0, SoTienChi=0.0, TonQuy=1000000.0,
                HinhThucTT="TienMat", MaPhieuThu="PT_000", MaPhieuChi=None,
                DienGiai="Tiền mặt đầu ca ngày 14/10"
            ),
            models.SoQuy(
                MaSoQuy="SQ_002", MaCN="CN01", NgayGiaoDich="2026-10-14 18:00",
                LoaiGiaoDich="Thu", SoTienThu=399000.0, SoTienChi=0.0, TonQuy=1399000.0,
                HinhThucTT="TienMat", MaPhieuThu="PT_001", MaPhieuChi=None,
                DienGiai="Thu tiền bán hàng POS ca 14/10"
            ),
            models.SoQuy(
                MaSoQuy="SQ_003", MaCN="CN01", NgayGiaoDich="2026-10-14 18:05",
                LoaiGiaoDich="Thu", SoTienThu=412000.0, SoTienChi=0.0, TonQuy=1811000.0,
                HinhThucTT="ChuyenKhoan", MaPhieuThu="PT_002", MaPhieuChi=None,
                DienGiai="Thu chuyển khoản QR ngân hàng POS"
            ),
            models.SoQuy(
                MaSoQuy="SQ_004", MaCN="CN01", NgayGiaoDich="2026-10-15 09:30",
                LoaiGiaoDich="Chi", SoTienThu=0.0, SoTienChi=85000.0, TonQuy=1726000.0,
                HinhThucTT="TienMat", MaPhieuThu=None, MaPhieuChi="PC_001",
                DienGiai="Chi khẩn cấp mua đá và túi đựng mang đi"
            )
        ])
    db.commit()

# ==============================================================================
# PHIẾU THU APIs
# ==============================================================================
@router.get("/api/phieu-thu")
@router.get("/api/phieuthu")
@router.get("/api/finance/phieu-thu")
def get_receipts(branch_id: str = None, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    query = db.query(models.PhieuThu)
    if branch_id and branch_id != "ALL":
        query = query.filter(models.PhieuThu.MaCN == branch_id)
    receipts = query.order_by(models.PhieuThu.NgayThu.desc()).all()
    return [
        {
            "MaPhieuThu": r.MaPhieuThu,
            "MaCN": r.MaCN,
            "MaChiNhanh": r.MaCN,
            "MaNV": r.MaNV,
            "TenNV": r.TenNV,
            "NgayThu": r.NgayThu,
            "SoTien": r.SoTien,
            "LyDo": r.LyDo,
            "PhuongThuc": r.PhuongThuc,
            "NguoiNop": r.NguoiNop,
            "LoaiPhieu": r.LoaiPhieu or ("TuDong" if is_auto_receipt(r) else "ThuCong"),
            "IsAuto": is_auto_receipt(r),
            "NguoiCapNhat": r.NguoiCapNhat,
            "NgayCapNhat": r.NgayCapNhat,
            "LichSuChinhSua": r.LichSuChinhSua
        }
        for r in receipts
    ]

@router.get("/api/phieu-thu/{id}")
@router.get("/api/phieuthu/{id}")
@router.get("/api/finance/phieu-thu/{id}")
def get_receipt_by_id(id: str, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    r = db.query(models.PhieuThu).filter(models.PhieuThu.MaPhieuThu == id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy Phiếu Thu với mã: {id}")
    return {
        "MaPhieuThu": r.MaPhieuThu,
        "MaCN": r.MaCN,
        "MaChiNhanh": r.MaCN,
        "MaNV": r.MaNV,
        "TenNV": r.TenNV,
        "NgayThu": r.NgayThu,
        "SoTien": r.SoTien,
        "LyDo": r.LyDo,
        "PhuongThuc": r.PhuongThuc,
        "NguoiNop": r.NguoiNop,
        "LoaiPhieu": r.LoaiPhieu or ("TuDong" if is_auto_receipt(r) else "ThuCong"),
        "IsAuto": is_auto_receipt(r),
        "NguoiCapNhat": r.NguoiCapNhat,
        "NgayCapNhat": r.NgayCapNhat,
        "LichSuChinhSua": r.LichSuChinhSua
    }

@router.put("/api/phieu-thu/{id}")
@router.patch("/api/phieu-thu/{id}")
@router.put("/api/phieuthu/{id}")
@router.patch("/api/phieuthu/{id}")
@router.put("/api/finance/phieu-thu/{id}")
def update_receipt(id: str, req: schemas.PhieuThuUpdateRequest, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    r = db.query(models.PhieuThu).filter(models.PhieuThu.MaPhieuThu == id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy Phiếu Thu: {id}")

    auto_flag = is_auto_receipt(r)

    # Ràng buộc nghiệp vụ: Phiếu tự động từ hệ thống (hóa đơn POS) KHÔNG ĐƯỢC PHÉP sửa Số tiền, Ngày thu, Phương thức
    if auto_flag:
        if req.SoTien is not None and abs(req.SoTien - r.SoTien) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Phiếu thu '{id}' được sinh TỰ ĐỘNG từ hệ thống (Hóa đơn POS). Tuyệt đối không cho phép sửa đổi 'Số tiền' để tránh sai lệch doanh thu và đối soát!"
            )
        if req.NgayThu is not None and req.NgayThu != r.NgayThu:
            raise HTTPException(
                status_code=400,
                detail=f"Phiếu thu '{id}' được sinh TỰ ĐỘNG từ hệ thống. Không cho phép sửa đổi 'Ngày thu'!"
            )
        if req.PhuongThuc is not None and req.PhuongThuc != r.PhuongThuc:
            raise HTTPException(
                status_code=400,
                detail=f"Phiếu thu '{id}' được sinh TỰ ĐỘNG từ hệ thống. Không cho phép sửa đổi 'Phương thức' thanh toán!"
            )

    # Ghi nhận các trường được phép sửa
    old_amount = r.SoTien
    if req.NguoiNop is not None:
        r.NguoiNop = req.NguoiNop.strip()
    if req.LyDo is not None:
        r.LyDo = req.LyDo.strip()

    # Phiếu THỦ CÔNG: Cho phép sửa toàn bộ thông tin
    if not auto_flag:
        if req.SoTien is not None and req.SoTien > 0:
            r.SoTien = req.SoTien
        if req.PhuongThuc is not None:
            r.PhuongThuc = req.PhuongThuc
        if req.NgayThu is not None:
            r.NgayThu = req.NgayThu
        if req.MaCN is not None:
            r.MaCN = req.MaCN

    # Cập nhật thông tin Audit (kiểm toán)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user_name = req.NguoiCapNhat or "Quản lý"
    r.NguoiCapNhat = user_name
    r.NgayCapNhat = now_str
    audit_note = f"[{now_str}] {user_name} cập nhật"
    if r.LichSuChinhSua:
        r.LichSuChinhSua = f"{r.LichSuChinhSua} | {audit_note}"
    else:
        r.LichSuChinhSua = audit_note

    # Đồng bộ sang Sổ Quỹ (SOQUY) nếu có giao dịch tương ứng
    sq = db.query(models.SoQuy).filter(models.SoQuy.MaPhieuThu == id).first()
    if sq:
        sq.DienGiai = r.LyDo
        if not auto_flag and req.SoTien is not None and req.SoTien > 0:
            sq.SoTienThu = r.SoTien
        if not auto_flag and req.PhuongThuc is not None:
            sq.HinhThucTT = r.PhuongThuc

    db.commit()
    db.refresh(r)

    return {
        "status": "success",
        "message": f"Cập nhật Phiếu Thu {id} thành công!",
        "data": {
            "MaPhieuThu": r.MaPhieuThu,
            "MaCN": r.MaCN,
            "NgayThu": r.NgayThu,
            "SoTien": r.SoTien,
            "LyDo": r.LyDo,
            "PhuongThuc": r.PhuongThuc,
            "NguoiNop": r.NguoiNop,
            "LoaiPhieu": r.LoaiPhieu or ("TuDong" if auto_flag else "ThuCong"),
            "IsAuto": auto_flag,
            "NguoiCapNhat": r.NguoiCapNhat,
            "NgayCapNhat": r.NgayCapNhat,
            "LichSuChinhSua": r.LichSuChinhSua
        }
    }

@router.post("/api/phieu-thu")
@router.post("/api/phieuthu")
@router.post("/api/finance/phieu-thu")
def create_receipt(req: schemas.PhieuThuCreateRequest, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    count = db.query(models.PhieuThu).count()
    new_id = req.MaPhieuThu or f"PT_{count + 1:03d}"

    new_pt = models.PhieuThu(
        MaPhieuThu=new_id,
        MaCN=req.MaCN,
        MaNV=req.MaNV or "NV001",
        TenNV=req.TenNV or "Quản Lý",
        NgayThu=req.NgayThu or now_str,
        SoTien=req.SoTien,
        LyDo=req.LyDo,
        PhuongThuc=req.PhuongThuc or "TienMat",
        NguoiNop=req.NguoiNop,
        LoaiPhieu=req.LoaiPhieu or "ThuCong",
        NguoiCapNhat=req.TenNV or "Quản Lý",
        NgayCapNhat=now_str
    )
    db.add(new_pt)

    # Ghi nhận vào Sổ Quỹ
    last_sq = db.query(models.SoQuy).order_by(models.SoQuy.MaSoQuy.desc()).first()
    ton_cu = last_sq.TonQuy if last_sq else 1000000.0
    new_ton = ton_cu + req.SoTien
    sq_count = db.query(models.SoQuy).count()

    new_sq = models.SoQuy(
        MaSoQuy=f"SQ_{sq_count + 1:03d}",
        MaCN=req.MaCN,
        NgayGiaoDich=req.NgayThu or now_str,
        LoaiGiaoDich="Thu",
        SoTienThu=req.SoTien,
        SoTienChi=0.0,
        TonQuy=new_ton,
        HinhThucTT=req.PhuongThuc or "TienMat",
        MaPhieuThu=new_id,
        MaPhieuChi=None,
        DienGiai=req.LyDo
    )
    db.add(new_sq)
    db.commit()
    db.refresh(new_pt)

    return {
        "status": "success",
        "message": f"Tạo Phiếu Thu {new_id} thành công!",
        "data": {
            "MaPhieuThu": new_pt.MaPhieuThu,
            "MaCN": new_pt.MaCN,
            "NgayThu": new_pt.NgayThu,
            "SoTien": new_pt.SoTien,
            "LyDo": new_pt.LyDo,
            "PhuongThuc": new_pt.PhuongThuc,
            "NguoiNop": new_pt.NguoiNop,
            "LoaiPhieu": new_pt.LoaiPhieu
        }
    }

# ==============================================================================
# PHIẾU CHI APIs
# ==============================================================================
@router.get("/api/phieu-chi")
@router.get("/api/phieuchi")
@router.get("/api/finance/phieu-chi")
def get_payments(branch_id: str = None, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    query = db.query(models.PhieuChi)
    if branch_id and branch_id != "ALL":
        query = query.filter(models.PhieuChi.MaCN == branch_id)
    payments = query.order_by(models.PhieuChi.NgayChi.desc()).all()
    return [
        {
            "MaPhieuChi": p.MaPhieuChi,
            "MaCN": p.MaCN,
            "MaChiNhanh": p.MaCN,
            "MaNV": p.MaNV,
            "TenNV": p.TenNV,
            "NgayChi": p.NgayChi,
            "SoTien": p.SoTien,
            "LyDo": p.LyDo,
            "PhuongThuc": p.PhuongThuc,
            "NguoiNhan": p.NguoiNhan,
            "LoaiPhieu": p.LoaiPhieu or ("TuDong" if is_auto_payment(p) else "ThuCong"),
            "IsAuto": is_auto_payment(p),
            "NguoiCapNhat": p.NguoiCapNhat,
            "NgayCapNhat": p.NgayCapNhat,
            "LichSuChinhSua": p.LichSuChinhSua
        }
        for p in payments
    ]

@router.get("/api/phieu-chi/{id}")
@router.get("/api/phieuchi/{id}")
@router.get("/api/finance/phieu-chi/{id}")
def get_payment_by_id(id: str, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    p = db.query(models.PhieuChi).filter(models.PhieuChi.MaPhieuChi == id).first()
    if not p:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy Phiếu Chi với mã: {id}")
    return {
        "MaPhieuChi": p.MaPhieuChi,
        "MaCN": p.MaCN,
        "MaChiNhanh": p.MaCN,
        "MaNV": p.MaNV,
        "TenNV": p.TenNV,
        "NgayChi": p.NgayChi,
        "SoTien": p.SoTien,
        "LyDo": p.LyDo,
        "PhuongThuc": p.PhuongThuc,
        "NguoiNhan": p.NguoiNhan,
        "LoaiPhieu": p.LoaiPhieu or ("TuDong" if is_auto_payment(p) else "ThuCong"),
        "IsAuto": is_auto_payment(p),
        "NguoiCapNhat": p.NguoiCapNhat,
        "NgayCapNhat": p.NgayCapNhat,
        "LichSuChinhSua": p.LichSuChinhSua
    }

@router.put("/api/phieu-chi/{id}")
@router.patch("/api/phieu-chi/{id}")
@router.put("/api/phieuchi/{id}")
@router.patch("/api/phieuchi/{id}")
@router.put("/api/finance/phieu-chi/{id}")
def update_payment(id: str, req: schemas.PhieuChiUpdateRequest, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    p = db.query(models.PhieuChi).filter(models.PhieuChi.MaPhieuChi == id).first()
    if not p:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy Phiếu Chi: {id}")

    auto_flag = is_auto_payment(p)

    # Ràng buộc nghiệp vụ: Phiếu tự động từ hệ thống (chi trả lương) KHÔNG ĐƯỢC PHÉP sửa Số tiền, Ngày chi, Phương thức
    if auto_flag:
        if req.SoTien is not None and abs(req.SoTien - p.SoTien) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Phiếu chi '{id}' được sinh TỰ ĐỘNG từ hệ thống (Chi trả lương). Tuyệt đối không cho phép sửa đổi 'Số tiền' để tránh sai lệch đối soát sổ quỹ!"
            )
        if req.NgayChi is not None and req.NgayChi != p.NgayChi:
            raise HTTPException(
                status_code=400,
                detail=f"Phiếu chi '{id}' được sinh TỰ ĐỘNG từ hệ thống. Không cho phép sửa đổi 'Ngày chi'!"
            )
        if req.PhuongThuc is not None and req.PhuongThuc != p.PhuongThuc:
            raise HTTPException(
                status_code=400,
                detail=f"Phiếu chi '{id}' được sinh TỰ ĐỘNG từ hệ thống. Không cho phép sửa đổi 'Phương thức' chi tiền!"
            )

    # Cập nhật thông tin diễn giải
    if req.NguoiNhan is not None:
        p.NguoiNhan = req.NguoiNhan.strip()
    if req.LyDo is not None:
        p.LyDo = req.LyDo.strip()

    # Phiếu THỦ CÔNG: Cho phép sửa toàn bộ thông tin
    if not auto_flag:
        if req.SoTien is not None and req.SoTien > 0:
            p.SoTien = req.SoTien
        if req.PhuongThuc is not None:
            p.PhuongThuc = req.PhuongThuc
        if req.NgayChi is not None:
            p.NgayChi = req.NgayChi
        if req.MaCN is not None:
            p.MaCN = req.MaCN

    # Cập nhật thông tin Audit
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    user_name = req.NguoiCapNhat or "Quản lý"
    p.NguoiCapNhat = user_name
    p.NgayCapNhat = now_str
    audit_note = f"[{now_str}] {user_name} cập nhật"
    if p.LichSuChinhSua:
        p.LichSuChinhSua = f"{p.LichSuChinhSua} | {audit_note}"
    else:
        p.LichSuChinhSua = audit_note

    # Đồng bộ sang Sổ Quỹ (SOQUY) nếu có giao dịch tương ứng
    sq = db.query(models.SoQuy).filter(models.SoQuy.MaPhieuChi == id).first()
    if sq:
        sq.DienGiai = p.LyDo
        if not auto_flag and req.SoTien is not None and req.SoTien > 0:
            sq.SoTienChi = p.SoTien
        if not auto_flag and req.PhuongThuc is not None:
            sq.HinhThucTT = p.PhuongThuc

    db.commit()
    db.refresh(p)

    return {
        "status": "success",
        "message": f"Cập nhật Phiếu Chi {id} thành công!",
        "data": {
            "MaPhieuChi": p.MaPhieuChi,
            "MaCN": p.MaCN,
            "NgayChi": p.NgayChi,
            "SoTien": p.SoTien,
            "LyDo": p.LyDo,
            "PhuongThuc": p.PhuongThuc,
            "NguoiNhan": p.NguoiNhan,
            "LoaiPhieu": p.LoaiPhieu or ("TuDong" if auto_flag else "ThuCong"),
            "IsAuto": auto_flag,
            "NguoiCapNhat": p.NguoiCapNhat,
            "NgayCapNhat": p.NgayCapNhat,
            "LichSuChinhSua": p.LichSuChinhSua
        }
    }

@router.post("/api/phieu-chi")
@router.post("/api/phieuchi")
@router.post("/api/finance/phieu-chi")
def create_payment(req: schemas.PhieuChiCreateRequest, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    count = db.query(models.PhieuChi).count()
    new_id = req.MaPhieuChi or f"PC_{count + 1:03d}"

    new_pc = models.PhieuChi(
        MaPhieuChi=new_id,
        MaCN=req.MaCN,
        MaNV=req.MaNV or "NV001",
        TenNV=req.TenNV or "Quản Lý",
        NgayChi=req.NgayChi or now_str,
        SoTien=req.SoTien,
        LyDo=req.LyDo,
        PhuongThuc=req.PhuongThuc or "TienMat",
        NguoiNhan=req.NguoiNhan,
        LoaiPhieu=req.LoaiPhieu or "ThuCong",
        NguoiCapNhat=req.TenNV or "Quản Lý",
        NgayCapNhat=now_str
    )
    db.add(new_pc)

    # Ghi nhận trừ vào Sổ Quỹ
    last_sq = db.query(models.SoQuy).order_by(models.SoQuy.MaSoQuy.desc()).first()
    ton_cu = last_sq.TonQuy if last_sq else 1000000.0
    new_ton = ton_cu - req.SoTien
    sq_count = db.query(models.SoQuy).count()

    new_sq = models.SoQuy(
        MaSoQuy=f"SQ_{sq_count + 1:03d}",
        MaCN=req.MaCN,
        NgayGiaoDich=req.NgayChi or now_str,
        LoaiGiaoDich="Chi",
        SoTienThu=0.0,
        SoTienChi=req.SoTien,
        TonQuy=new_ton,
        HinhThucTT=req.PhuongThuc or "TienMat",
        MaPhieuThu=None,
        MaPhieuChi=new_id,
        DienGiai=req.LyDo
    )
    db.add(new_sq)
    db.commit()
    db.refresh(new_pc)

    return {
        "status": "success",
        "message": f"Tạo Phiếu Chi {new_id} thành công!",
        "data": {
            "MaPhieuChi": new_pc.MaPhieuChi,
            "MaCN": new_pc.MaCN,
            "NgayChi": new_pc.NgayChi,
            "SoTien": new_pc.SoTien,
            "LyDo": new_pc.LyDo,
            "PhuongThuc": new_pc.PhuongThuc,
            "NguoiNhan": new_pc.NguoiNhan,
            "LoaiPhieu": new_pc.LoaiPhieu
        }
    }

# ==============================================================================
# SỔ QUỸ (SOQUY) APIs
# ==============================================================================
@router.get("/api/so-quy")
@router.get("/api/soquy")
@router.get("/api/finance/so-quy")
def get_cashbook(branch_id: str = None, db: Session = Depends(get_db)):
    seed_finance_data_if_empty(db)
    query = db.query(models.SoQuy)
    if branch_id and branch_id != "ALL":
        query = query.filter(models.SoQuy.MaCN == branch_id)
    records = query.order_by(models.SoQuy.NgayGiaoDich.desc()).all()
    return [
        {
            "MaSoQuy": s.MaSoQuy,
            "MaCN": s.MaCN,
            "NgayGiaoDich": s.NgayGiaoDich,
            "LoaiGiaoDich": s.LoaiGiaoDich,
            "SoTienThu": s.SoTienThu,
            "SoTienChi": s.SoTienChi,
            "TonQuy": s.TonQuy,
            "HinhThucTT": s.HinhThucTT,
            "MaPhieuThu": s.MaPhieuThu,
            "MaPhieuChi": s.MaPhieuChi,
            "DienGiai": s.DienGiai
        }
        for s in records
    ]
