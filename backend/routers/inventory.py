from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/inventory", tags=["Kho & Định Lượng BOM"])

@router.get("/stock")
def get_inventory_stock(branch_id: str = "CN01", db: Session = Depends(get_db)):
    stocks = db.query(models.TonKho).filter(models.TonKho.MaCN == branch_id).all()
    result = []
    for s in stocks:
        nl = db.query(models.NguyenLieu).filter(models.NguyenLieu.MaNL == s.MaNL).first()
        if nl:
            result.append({
                "MaNL": nl.MaNL,
                "TenNL": nl.TenNL,
                "DonViTinh": nl.DonViTinh,
                "SoLuongTon": s.SoLuongTon,
                "NguongBao": nl.NguongBao,
                "IsLowStock": s.SoLuongTon <= nl.NguongBao
            })
    return result

@router.post("/import")
def import_stock(req: schemas.StockImportRequest, db: Session = Depends(get_db)):
    stock = db.query(models.TonKho).filter(
        models.TonKho.MaCN == req.MaCN,
        models.TonKho.MaNL == req.MaNL
    ).first()

    if not stock:
        stock = models.TonKho(MaCN=req.MaCN, MaNL=req.MaNL, SoLuongTon=req.SoLuongNhap)
        db.add(stock)
    else:
        stock.SoLuongTon += req.SoLuongNhap

    db.commit()
    return {"success": True, "message": f"Đã nhập thêm {req.SoLuongNhap} vào kho chi nhánh {req.MaCN}!", "SoLuongTon": stock.SoLuongTon}

@router.get("/recipes")
def get_recipes(db: Session = Depends(get_db)):
    recipes = db.query(models.CongThuc).all()
    result = []
    for r in recipes:
        ms = db.query(models.MonSize).filter(models.MonSize.MaMonSize == r.MaMonSize).first()
        nl = db.query(models.NguyenLieu).filter(models.NguyenLieu.MaNL == r.MaNL).first()
        mon = db.query(models.Mon).filter(models.Mon.MaMon == ms.MaMon).first() if ms else None
        result.append({
            "MaMonSize": r.MaMonSize,
            "TenMon": mon.TenMon if mon else r.MaMonSize,
            "MaNL": r.MaNL,
            "TenNL": nl.TenNL if nl else r.MaNL,
            "SoLuongTieuHao": r.SoLuongTieuHao,
            "DonViTinh": nl.DonViTinh if nl else ""
        })
    return result
