from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import datetime
import re

router = APIRouter(prefix="/api/pos", tags=["Bán Hàng POS & Bàn"])

@router.get("/menu")
def get_menu(db: Session = Depends(get_db)):
    categories = db.query(models.DanhMuc).all()
    items = db.query(models.Mon).all()
    sizes = db.query(models.KichCo).all()
    mon_sizes = db.query(models.MonSize).all()

    return {
        "categories": [{"MaDM": c.MaDM, "TenDM": c.TenDM} for c in categories],
        "items": [{"MaMon": m.MaMon, "TenMon": m.TenMon, "MaDM": m.MaDM, "HinhAnh": m.HinhAnh} for m in items],
        "sizes": [{"MaSize": s.MaSize, "TenSize": s.TenSize} for s in sizes],
        "mon_sizes": [{"MaMonSize": ms.MaMonSize, "MaMon": ms.MaMon, "MaSize": ms.MaSize, "GiaBan": ms.GiaBan} for ms in mon_sizes]
    }

@router.get("/tables")
def get_tables(branch_id: str = "CN01", db: Session = Depends(get_db)):
    tables = db.query(models.Ban).filter(models.Ban.MaCN == branch_id).all()
    return [
        {
            "MaBan": t.MaBan,
            "SoBan": t.SoBan,
            "KhuVuc": t.KhuVuc,
            "MaCN": t.MaCN,
            "TrangThai": t.TrangThai,
            "YeuCauThanhToan": bool(t.YeuCauThanhToan)
        }
        for t in tables
    ]

@router.post("/transfer-table")
def transfer_table(req: schemas.TableTransferRequest, db: Session = Depends(get_db)):
    source = db.query(models.Ban).filter(models.Ban.MaBan == req.SourceTableId).first()
    target = db.query(models.Ban).filter(models.Ban.MaBan == req.TargetTableId).first()

    if not source or not target:
        raise HTTPException(status_code=404, detail="Không tìm thấy bàn yêu cầu!")

    if target.TrangThai == "CoKhach":
        raise HTTPException(status_code=400, detail="Bàn đích hiện đang có khách!")

    source.TrangThai = "Trong"
    source.YeuCauThanhToan = 0
    target.TrangThai = "CoKhach"
    db.commit()

    return {"success": True, "message": f"Đã chuyển từ {source.SoBan} sang {target.SoBan} thành công!"}

@router.post("/call-bill")
def call_bill(table_id: str, db: Session = Depends(get_db)):
    table = db.query(models.Ban).filter(models.Ban.MaBan == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Không tìm thấy bàn!")

    table.YeuCauThanhToan = 1
    db.commit()
    return {"success": True, "message": f"Đã bật chuông báo tính tiền cho {table.SoBan}!"}

@router.get("/customer/search")
def search_customer_by_phone(phone: str, db: Session = Depends(get_db)):
    phone_clean = re.sub(r"\D", "", phone or "")
    if len(phone_clean) != 10:
        return {"found": False, "message": "Số điện thoại phải đủ 10 chữ số"}

    cust = db.query(models.KhachHang).filter(models.KhachHang.SDT == phone_clean).first()
    if cust:
        pts = cust.DiemTichLuy or 0
        if pts >= 5000:
            hang = "Kim Cương (VIP)"
        elif pts >= 1000:
            hang = "Vàng (Thân thiết)"
        elif pts >= 300:
            hang = "Bạc"
        else:
            hang = "Thành viên"

        return {
            "found": True,
            "customer": {
                "MaKH": cust.MaKH,
                "TenKH": cust.TenKH,
                "SDT": cust.SDT,
                "DiemTichLuy": pts,
                "HangKhachHang": hang
            }
        }
    return {"found": False, "message": "Không tìm thấy khách hàng"}

@router.post("/order")
def create_order(req: schemas.CreateOrderRequest, db: Session = Depends(get_db)):
    if not req.Items:
        raise HTTPException(status_code=400, detail="Đơn hàng trống!")

    subtotal = sum(item.GiaBan * item.SoLuong for item in req.Items)
    discount = req.DiscountAmount or 0.0
    final_total = max(0.0, subtotal - discount)

    now = datetime.datetime.now()
    time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    ma_hd = f"HD_{int(now.timestamp())}"

    # Xử lý thông tin khách hàng (tìm hoặc tự tạo khách mới)
    ma_kh = req.MaKH
    if req.CustomerPhone:
        phone_clean = re.sub(r"\D", "", req.CustomerPhone)
        if phone_clean:
            if len(phone_clean) != 10:
                raise HTTPException(status_code=400, detail="Số điện thoại khách hàng phải đủ 10 chữ số!")
            existing_cust = db.query(models.KhachHang).filter(models.KhachHang.SDT == phone_clean).first()
            if existing_cust:
                ma_kh = existing_cust.MaKH
            elif req.CustomerName:
                ma_kh = f"KH_{int(now.timestamp())}"
                new_cust = models.KhachHang(
                    MaKH=ma_kh,
                    TenKH=req.CustomerName.strip(),
                    SDT=phone_clean,
                    DiemTichLuy=0
                )
                db.add(new_cust)
                db.flush()

    # Xử lý Bàn / Thẻ bàn theo 4 quy tắc bắt buộc:
    # 1. Take away: khóa/bỏ qua bàn và số thẻ bàn
    # 2. Dùng tại chỗ: Loại trừ lẫn nhau giữa số thẻ bàn gõ tay và chọn bàn
    ma_ban = None
    so_the_ban = None

    if req.LoaiDonHang == "TakeAway":
        ma_ban = None
        so_the_ban = "Mang Về"
    else:
        # Dùng tại chỗ: Chỉ lấy 1 dữ liệu duy nhất
        if req.SoTheBan and req.SoTheBan.strip() and req.SoTheBan.strip() != "Mang Về":
            so_the_ban = req.SoTheBan.strip()
            ma_ban = None
        elif req.MaBan:
            ma_ban = req.MaBan
            so_the_ban = None
        else:
            so_the_ban = "Tại Quán"

    # 1. Lưu Hóa Đơn
    new_hd = models.HoaDon(
        MaHD=ma_hd,
        MaCN=req.MaCN,
        MaBan=ma_ban,
        SoTheBan=so_the_ban,
        MaNV=req.MaNV,
        MaKH=ma_kh,
        NgayLap=time_str,
        TongTien=subtotal,
        GiamGia=discount,
        TongThanhToan=final_total,
        KhachTra=final_total,
        HinhThucTT=req.PaymentMethod,
        TrangThai="HoanThanh"
    )
    db.add(new_hd)

    # 2. Lưu Chi Tiết & Tự Động Trừ Tồn Kho Theo BOM
    for item in req.Items:
        cthd = models.ChiTietHoaDon(
            MaHD=ma_hd,
            MaMonSize=item.MaMonSize,
            SoLuong=item.SoLuong,
            DonGia=item.GiaBan,
            ThanhTien=item.GiaBan * item.SoLuong,
            GhiChu=item.GhiChu or ""
        )
        db.add(cthd)

        # Trừ tồn kho tự động theo công thức pha chế
        recipes = db.query(models.CongThuc).filter(models.CongThuc.MaMonSize == item.MaMonSize).all()
        for r in recipes:
            stock = db.query(models.TonKho).filter(
                models.TonKho.MaCN == req.MaCN,
                models.TonKho.MaNL == r.MaNL
            ).first()
            if stock:
                consumed = r.SoLuongTieuHao * item.SoLuong
                stock.SoLuongTon = max(0.0, stock.SoLuongTon - consumed)

    # 3. Giải phóng bàn ăn nếu có
    if req.MaBan:
        table = db.query(models.Ban).filter(models.Ban.MaBan == req.MaBan).first()
        if table:
            table.TrangThai = "Trong"
            table.YeuCauThanhToan = 0

    # 4. Tích điểm khách hàng (1 điểm mỗi 10.000đ)
    if ma_kh:
        cust = db.query(models.KhachHang).filter(models.KhachHang.MaKH == ma_kh).first()
        if cust:
            earned = int(final_total // 10000)
            cust.DiemTichLuy = (cust.DiemTichLuy or 0) + earned

    db.commit()

    return {
        "success": True,
        "message": "Thanh toán & xuất hóa đơn thành công!",
        "MaHD": ma_hd,
        "TongThanhToan": final_total,
        "NgayLap": time_str
    }

# ==============================================================================
# 5. DANH SÁCH ĐƠN HÀNG ĐÃ BÁN (LỊCH SỬ HÓA ĐƠN) - TUÂN THỦ PHÂN QUYỀN CHI NHÁNH
# ==============================================================================
@router.get("/orders")
def get_orders_history(
    branch_id: str = "CN01",
    date_filter: str = "today", # today, shift, all
    page: int = 1,
    page_size: int = 10,
    search: str = None,
    payment_method: str = None,
    db: Session = Depends(get_db)
):
    import math

    query = db.query(models.HoaDon).filter(models.HoaDon.TrangThai == "HoanThanh")

    # 1. Phân quyền chi nhánh (Branch isolation): Chỉ trả về đơn của chi nhánh được phép
    if branch_id and branch_id != "ALL":
        query = query.filter(models.HoaDon.MaCN == branch_id)

    # 2. Lọc thời gian / ca làm việc
    now = datetime.datetime.now()
    today_str = now.strftime("%Y-%m-%d")

    if date_filter == "today":
        query = query.filter(models.HoaDon.NgayLap.like(f"{today_str}%"))
    elif date_filter == "shift":
        # Ca Sáng: 06:00 - 14:00 | Ca Chiều: 14:00 - 22:00
        query = query.filter(models.HoaDon.NgayLap.like(f"{today_str}%"))
        if now.hour < 14:
            query = query.filter(models.HoaDon.NgayLap <= f"{today_str} 14:00")
        else:
            query = query.filter(models.HoaDon.NgayLap >= f"{today_str} 14:00")

    # 3. Lọc phương thức thanh toán
    if payment_method and payment_method != "ALL":
        query = query.filter(models.HoaDon.HinhThucTT == payment_method)

    # 4. Tìm kiếm tự do theo Mã đơn, Thẻ bàn, hoặc Số bàn
    if search and search.strip():
        term = f"%{search.strip()}%"
        # Tìm thêm theo SĐT hoặc Tên khách
        cust_ids = [c.MaKH for c in db.query(models.KhachHang).filter(
            (models.KhachHang.SDT.like(term)) | (models.KhachHang.TenKH.like(term))
        ).all()]

        filters = [
            models.HoaDon.MaHD.like(term),
            models.HoaDon.SoTheBan.like(term),
            models.HoaDon.MaBan.like(term)
        ]
        if cust_ids:
            filters.append(models.HoaDon.MaKH.in_(cust_ids))

        from sqlalchemy import or_
        query = query.filter(or_(*filters))

    # Sắp xếp mới nhất lên đầu
    query = query.order_by(models.HoaDon.NgayLap.desc())

    total_count = query.count()
    all_filtered = query.all()
    total_revenue = sum([h.TongThanhToan for h in all_filtered])

    # Phân trang (Pagination)
    offset = max(0, (page - 1) * page_size)
    invoices = query.offset(offset).limit(page_size).all()

    # Dữ liệu xuất chi tiết
    orders_data = []
    for h in invoices:
        cust = db.query(models.KhachHang).filter(models.KhachHang.MaKH == h.MaKH).first() if h.MaKH else None
        item_count = db.query(models.ChiTietHoaDon).filter(models.ChiTietHoaDon.MaHD == h.MaHD).count()
        branch = db.query(models.ChiNhanh).filter(models.ChiNhanh.MaCN == h.MaCN).first() if h.MaCN else None

        # Phân loại hiển thị
        is_takeaway = (h.SoTheBan == "Mang Về") or (not h.MaBan and not h.SoTheBan)
        order_type_str = "TakeAway" if is_takeaway else "DungTaiCho"

        orders_data.append({
            "MaHD": h.MaHD,
            "MaCN": h.MaCN,
            "TenCN": branch.TenCN if branch else h.MaCN,
            "MaBan": h.MaBan,
            "SoTheBan": h.SoTheBan,
            "LoaiDonHang": order_type_str,
            "MaNV": h.MaNV,
            "MaKH": h.MaKH,
            "CustomerName": cust.TenKH if cust else "Khách lẻ vãng lai",
            "CustomerPhone": cust.SDT if cust else "",
            "NgayLap": h.NgayLap,
            "TongTien": h.TongTien,
            "GiamGia": h.GiamGia or 0.0,
            "TongThanhToan": h.TongThanhToan,
            "KhachTra": h.KhachTra or h.TongThanhToan,
            "HinhThucTT": h.HinhThucTT,
            "TrangThai": h.TrangThai,
            "ItemCount": item_count
        })

    total_pages = max(1, math.ceil(total_count / page_size)) if total_count > 0 else 1

    return {
        "success": True,
        "branch_id": branch_id,
        "total_count": total_count,
        "total_revenue": total_revenue,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "orders": orders_data
    }

@router.get("/order/{order_id}")
def get_order_detail(order_id: str, db: Session = Depends(get_db)):
    hd = db.query(models.HoaDon).filter(models.HoaDon.MaHD == order_id).first()
    if not hd:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy hóa đơn {order_id}!")

    cust = db.query(models.KhachHang).filter(models.KhachHang.MaKH == hd.MaKH).first() if hd.MaKH else None
    staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == hd.MaNV).first() if hd.MaNV else None
    branch = db.query(models.ChiNhanh).filter(models.ChiNhanh.MaCN == hd.MaCN).first() if hd.MaCN else None

    # Lấy danh sách chi tiết các món đã bán
    details = db.query(models.ChiTietHoaDon).filter(models.ChiTietHoaDon.MaHD == order_id).all()
    items = []
    for d in details:
        ms = db.query(models.MonSize).filter(models.MonSize.MaMonSize == d.MaMonSize).first()
        mon = db.query(models.Mon).filter(models.Mon.MaMon == ms.MaMon).first() if ms else None
        size = db.query(models.KichCo).filter(models.KichCo.MaSize == ms.MaSize).first() if ms else None

        items.append({
            "MaCTHD": d.MaCTHD,
            "MaMonSize": d.MaMonSize,
            "TenMon": mon.TenMon if mon else d.MaMonSize,
            "TenSize": size.TenSize if size else "",
            "SoLuong": d.SoLuong,
            "DonGia": d.DonGia,
            "GiaBan": d.DonGia,
            "ThanhTien": d.ThanhTien,
            "GhiChu": d.GhiChu or ""
        })

    is_takeaway = (hd.SoTheBan == "Mang Về") or (not hd.MaBan and not hd.SoTheBan)

    return {
        "success": True,
        "invoice": {
            "MaHD": hd.MaHD,
            "MaCN": hd.MaCN,
            "TenCN": branch.TenCN if branch else hd.MaCN,
            "MaBan": hd.MaBan,
            "SoTheBan": hd.SoTheBan,
            "LoaiDonHang": "TakeAway" if is_takeaway else "DungTaiCho",
            "MaNV": hd.MaNV,
            "TenNV": staff.TenNV if staff else hd.MaNV,
            "MaKH": hd.MaKH,
            "CustomerName": cust.TenKH if cust else "Khách lẻ vãng lai",
            "CustomerPhone": cust.SDT if cust else "",
            "DiemTichLuy": cust.DiemTichLuy if cust else 0,
            "NgayLap": hd.NgayLap,
            "TongTien": hd.TongTien,
            "GiamGia": hd.GiamGia or 0.0,
            "TongThanhToan": hd.TongThanhToan,
            "KhachTra": hd.KhachTra or hd.TongThanhToan,
            "TienKhachDua": hd.KhachTra or hd.TongThanhToan,
            "TienThoiLai": max(0.0, (hd.KhachTra or hd.TongThanhToan) - hd.TongThanhToan),
            "HinhThucTT": hd.HinhThucTT,
            "TrangThai": hd.TrangThai
        },
        "items": items
    }
