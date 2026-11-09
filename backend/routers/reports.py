from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/reports", tags=["Báo Cáo Doanh Thu"])

@router.get("/dashboard")
def get_dashboard_reports(branch_id: str = "ALL", db: Session = Depends(get_db)):
    query = db.query(models.HoaDon).filter(models.HoaDon.TrangThai == "HoanThanh")
    if branch_id and branch_id != "ALL":
        query = query.filter(models.HoaDon.MaCN == branch_id)
    invoices = query.all()

    total_revenue = sum(h.TongThanhToan for h in invoices)
    total_orders = len(invoices)
    
    # Chi tiết món để đếm số ly và top món
    invoice_ids = [h.MaHD for h in invoices]
    details = db.query(models.ChiTietHoaDon).filter(models.ChiTietHoaDon.MaHD.in_(invoice_ids)).all() if invoice_ids else []
    total_cups = sum(d.SoLuong for d in details)
    aov = round(total_revenue / total_orders) if total_orders > 0 else 0

    # Cơ cấu phương thức thanh toán
    cash_total = sum(h.TongThanhToan for h in invoices if h.HinhThucTT == "TienMat")
    qr_total = sum(h.TongThanhToan for h in invoices if h.HinhThucTT == "ChuyenKhoan")
    card_total = sum(h.TongThanhToan for h in invoices if h.HinhThucTT == "The")

    # Tóm tắt từng chi nhánh
    cn1_invoices = db.query(models.HoaDon).filter(models.HoaDon.TrangThai == "HoanThanh", models.HoaDon.MaCN == "CN01").all()
    cn2_invoices = db.query(models.HoaDon).filter(models.HoaDon.TrangThai == "HoanThanh", models.HoaDon.MaCN == "CN02").all()
    cn1_cards = db.query(models.Ban).filter(models.Ban.MaCN == "CN01", models.Ban.TrangThai == "CoKhach").count()
    cn2_cards = db.query(models.Ban).filter(models.Ban.MaCN == "CN02", models.Ban.TrangThai == "CoKhach").count()

    cn1_summary = {
        "revenue": sum(h.TongThanhToan for h in cn1_invoices),
        "orders": len(cn1_invoices),
        "cards_in_use": cn1_cards
    }
    cn2_summary = {
        "revenue": sum(h.TongThanhToan for h in cn2_invoices),
        "orders": len(cn2_invoices),
        "cards_in_use": cn2_cards
    }

    # Top món bán chạy
    product_stats = {}
    for d in details:
        if d.MaMonSize not in product_stats:
            ms = db.query(models.MonSize).filter(models.MonSize.MaMonSize == d.MaMonSize).first()
            mon = db.query(models.Mon).filter(models.Mon.MaMon == ms.MaMon).first() if ms else None
            kc = db.query(models.KichCo).filter(models.KichCo.MaSize == ms.MaSize).first() if ms else None
            product_stats[d.MaMonSize] = {
                "MaMonSize": d.MaMonSize,
                "TenMon": mon.TenMon if mon else d.MaMonSize,
                "TenSize": kc.TenSize if kc else (d.MaMonSize.split("_")[-1] if "_" in d.MaMonSize else "M"),
                "SoLuong": 0,
                "DoanhThu": 0
            }
        product_stats[d.MaMonSize]["SoLuong"] += d.SoLuong
        product_stats[d.MaMonSize]["DoanhThu"] += (d.ThanhTien or (d.SoLuong * d.DonGia))

    top_products = sorted(product_stats.values(), key=lambda x: x["SoLuong"], reverse=True)[:5]

    # Danh sách hóa đơn gần đây
    recent = []
    for h in sorted(invoices, key=lambda x: x.NgayLap, reverse=True)[:10]:
        staff = db.query(models.NhanVien).filter(models.NhanVien.MaNV == h.MaNV).first()
        cust = db.query(models.KhachHang).filter(models.KhachHang.MaKH == h.MaKH).first() if h.MaKH else None
        table = db.query(models.Ban).filter(models.Ban.MaBan == h.MaBan).first() if h.MaBan else None
        recent.append({
            "MaHD": h.MaHD,
            "NgayLap": h.NgayLap,
            "SoBan": table.SoBan if table else "Mang về",
            "TenNV": staff.TenNV if staff else h.MaNV,
            "TenKH": cust.TenKH if cust else "Khách lẻ",
            "TongThanhToan": h.TongThanhToan,
            "HinhThucTT": h.HinhThucTT
        })

    return {
        "branch_id": branch_id,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_cups": total_cups,
        "aov": aov,
        "cn1_summary": cn1_summary,
        "cn2_summary": cn2_summary,
        "top_products": top_products,
        "payment_breakdown": {
            "cash": {"amount": cash_total, "pct": round(cash_total / total_revenue * 100, 1) if total_revenue else 0},
            "qr": {"amount": qr_total, "pct": round(qr_total / total_revenue * 100, 1) if total_revenue else 0},
            "card": {"amount": card_total, "pct": round(card_total / total_revenue * 100, 1) if total_revenue else 0}
        },
        "recent_invoices": recent
    }
