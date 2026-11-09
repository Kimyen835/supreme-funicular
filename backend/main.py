from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from seed_data import init_db_and_seed
import sys
import os

# Đảm bảo đường dẫn import đúng module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers import auth, pos, kds, inventory, hr, reports, branch_manager, finance

app = FastAPI(
    title="Hệ Thống Quản Lý Chuỗi Quán Cafe (Coffee Chain API)",
    description="Hệ thống Backend RESTful API hoàn chỉnh kết nối 16 bảng CSDL: POS, KDS Barista, Kho & Định Lượng BOM, Chấm Công, Bảng Lương, Doanh Thu.",
    version="1.0.0"
)

# Kích hoạt CORS để Frontend (port 5000, 3000,...) gọi API thoải mái
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Nạp database & seed dữ liệu mẫu khi khởi động
@app.on_event("startup")
def startup_event():
    init_db_and_seed()

# Tích hợp các router chức năng
app.include_router(auth.router)
app.include_router(pos.router)
app.include_router(kds.router)
app.include_router(inventory.router)
app.include_router(hr.router)
app.include_router(hr.employees_router)
app.include_router(hr.shifts_router)
app.include_router(reports.router)
app.include_router(branch_manager.router)
app.include_router(finance.router)

from fastapi.staticfiles import StaticFiles

# API Info
@app.get("/api")
def api_info():
    return {
        "system": "Hệ Thống Quản Lý Chuỗi Quán Cafe (Coffee Chain API)",
        "status": "Running",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

# Mount giao diện Frontend trực tiếp vào ứng dụng web
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
