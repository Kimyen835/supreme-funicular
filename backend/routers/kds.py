from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import schemas
import datetime

router = APIRouter(prefix="/api/kds", tags=["Quầy Barista (KDS)"])

# Hàng đợi pha chế lưu trữ bộ nhớ thực tế
kds_tickets: List[Dict[str, Any]] = [
    {
        "orderId": "OD_101",
        "tableId": "B01",
        "tableName": "Bàn 01",
        "time": "08:15:20",
        "status": "DangPhaChe",
        "sender": "Nguyễn Phục Vụ",
        "items": [
            {"TenMon": "Cà Phê Sữa Sài Gòn", "TenSize": "L", "SoLuong": 1, "GiaBan": 39000},
            {"TenMon": "Bạc Xỉu 3 Tầng", "TenSize": "M", "SoLuong": 1, "GiaBan": 35000}
        ]
    },
    {
        "orderId": "OD_102",
        "tableId": None,
        "tableName": "Mang về (Takeaway)",
        "time": "08:25:40",
        "status": "ChoPhaChe",
        "sender": "Lê Thu Ngân",
        "items": [
            {"TenMon": "Trà Đào Cam Sả", "TenSize": "L", "SoLuong": 2, "GiaBan": 45000},
            {"TenMon": "Matcha Đá Xay Thạch", "TenSize": "M", "SoLuong": 1, "GiaBan": 48000}
        ]
    }
]

@router.get("/tickets")
def get_kds_tickets():
    return kds_tickets

@router.post("/send")
def send_to_kitchen(req: schemas.SendToKitchenRequest):
    now = datetime.datetime.now()
    ticket_id = f"OD_{int(now.timestamp()) % 10000}"
    
    ticket = {
        "orderId": ticket_id,
        "tableId": req.tableId,
        "tableName": req.tableName,
        "time": now.strftime("%H:%M:%S"),
        "status": "ChoPhaChe",
        "sender": req.sender,
        "items": [item.dict() for item in req.items]
    }
    kds_tickets.insert(0, ticket)
    return {"success": True, "message": f"Đã gửi đơn {req.tableName} sang quầy Barista!", "ticket": ticket}

@router.post("/status")
def update_ticket_status(req: schemas.UpdateKdsStatusRequest):
    for ticket in kds_tickets:
        if ticket["orderId"] == req.ticketId:
            ticket["status"] = req.status
            return {"success": True, "message": f"Đã cập nhật trạng thái đơn {req.ticketId} thành {req.status}!"}
    raise HTTPException(status_code=404, detail="Không tìm thấy phiếu pha chế!")

@router.delete("/tickets/{ticket_id}")
def complete_ticket(ticket_id: str):
    global kds_tickets
    kds_tickets = [t for t in kds_tickets if t["orderId"] != ticket_id]
    return {"success": True, "message": f"Đã hoàn thành và giao đồ uống đơn {ticket_id}!"}
