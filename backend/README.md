# HƯỚNG DẪN BACKEND FASTAPI & DATABASE (CAFE CHAIN MANAGEMENT)

---

## 1. Tổng quan
Hệ thống Backend được xây dựng bằng **Python FastAPI + SQLAlchemy + SQLite**, kết nối và xử lý toàn bộ 16 bảng dữ liệu theo thiết kế chuẩn chuỗi cà phê:
- **`cafe.db`**: CSDL SQLite lưu trữ toàn bộ dữ liệu thực tế.
- **RESTful API**: Chuẩn JSON, hỗ trợ CORS gọi từ mọi Frontend.
- **Tài liệu Swagger UI tương tác trực tiếp**: `http://127.0.0.1:8000/docs`.

---

## 2. Cấu trúc thư mục Backend

```
c:\CAFE4\backend\
│── database.py        # Cấu hình kết nối SQLite (cafe.db) & quản lý Session
│── models.py          # Khai báo 16 bảng dữ liệu ORM (SQLAlchemy)
│── schemas.py         # Kiểm định dữ liệu đầu vào / đầu ra (Pydantic)
│── seed_data.py       # Tự động khởi tạo bảng & nạp dữ liệu mẫu ban đầu
│── main.py            # Khởi chạy FastAPI App, CORS & nạp các router
│── cafe.db            # File cơ sở dữ liệu SQLite
└── routers/
    │── auth.py        # Đăng nhập, Check-in / Check-out, RBAC
    │── pos.py         # Sơ đồ bàn, Ghi order, Chuyển bàn, Thanh toán
    │── kds.py         # Quầy Barista (Hàng đợi KDS, cập nhật pha chế)
    │── inventory.py   # Quản lý kho, Trừ BOM tự động, Nhập kho
    │── hr.py          # Chấm công, Bảng lương, Tính lương ca
    └── reports.py     # Báo cáo doanh thu, Top món, Phương thức TT
```

---

## 3. Danh sách các API chính

| Nhóm API | Phương thức | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Đăng nhập bằng Mã NV / SĐT / Tên. Tự động Check-in ca |
| | `POST` | `/api/auth/checkout` | Check-out ra ca, tính chính xác thời gian & lương ca |
| **POS** | `GET` | `/api/pos/menu` | Lấy danh mục, món, size ly và giá niêm yết |
| | `GET` | `/api/pos/tables` | Lấy sơ đồ bàn & trạng thái (Trống / Có khách / Đòi bill) |
| | `POST` | `/api/pos/transfer-table` | Chuyển toàn bộ món từ bàn này sang bàn khác |
| | `POST` | `/api/pos/call-bill` | Báo chuông tính tiền bàn tới Thu ngân |
| | `POST` | `/api/pos/order` | Thu tiền, xuất hóa đơn, tự động trừ tồn kho theo BOM |
| **KDS** | `GET` | `/api/kds/tickets` | Danh sách các phiếu đồ uống chờ pha chế cho Barista |
| | `POST` | `/api/kds/send` | Phục vụ / Thu ngân gửi phiếu gọi món sang quầy Bar |
| | `POST` | `/api/kds/status` | Cập nhật tiến độ: *Đang pha* (`DangPhaChe`) |
| | `DELETE`| `/api/kds/tickets/{id}` | Hoàn thành và giao đồ uống |
| **Kho BOM**| `GET` | `/api/inventory/stock` | Danh sách tồn kho theo chi nhánh (kèm cảnh báo đỏ sắp hết) |
| | `POST` | `/api/inventory/import` | Nhập thêm nguyên liệu vào kho chi nhánh |
| | `GET` | `/api/inventory/recipes`| Xem định lượng công thức pha chế từng size |
| **Nhân sự**| `GET` | `/api/hr/timelog` | Lịch sử chấm công, giờ vào, giờ ra, lương ca |
| | `POST` | `/api/hr/calculate-payroll` | Chốt lương tháng nhân viên theo giờ làm thực tế |
| **Báo cáo**| `GET` | `/api/reports/dashboard`| Doanh thu, số hóa đơn, số ly, cơ cấu tiền mặt / QR / Thẻ |

---

## 4. Cách khởi chạy Backend

Mở terminal tại thư mục `c:\CAFE4\backend` và chạy:
```powershell
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- Mở tài liệu API Swagger để test trực tiếp trên trình duyệt: **`http://127.0.0.1:8000/docs`**
