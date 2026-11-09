# HỆ THỐNG QUẢN LÝ QUÁN / CHUỖI QUÁN CAFE (COFFEE POS & CHAIN MANAGEMENT)
## DANH MỤC TÀI LIỆU PHÂN TÍCH & THIẾT KẾ (PHIÊN BẢN CHUẨN 16 BẢNG)

Hệ thống được thiết kế theo chuẩn nghiệp vụ F&B thực tế (POS, KDS, Kho nguyên liệu định lượng BOM, Chấm công & Tính lương) với **16 Bảng CSDL Chuẩn Hóa 3NF**:

| STT | Tài liệu | Nội dung chi tiết |
| :---: | :--- | :--- |
| **00** | [00_TONG_QUAN_KIEN_TRUC_CHUOI.md](./00_TONG_QUAN_KIEN_TRUC_CHUOI.md) | Kiến trúc tổng quan hệ thống, Tác nhân (Actors) và Ma trận phân quyền (RBAC). |
| **01** | [01_NGHIEP_VU_BAN_HANG_POS_KDS.md](./01_NGHIEP_VU_BAN_HANG_POS_KDS.md) | Bán hàng POS, Quản lý bàn (`BAN`), Khách hàng (`KHACHHANG`), Hóa đơn (`HOADON`, `CHITIETHOADON`), In bill & tem ly. |
| **02** | [02_NGHIEP_VU_MENU_DINH_LUONG_BOM.md](./02_NGHIEP_VU_MENU_DINH_LUONG_BOM.md) | Danh mục (`DANHMUC`), Món (`MON`), Kích cỡ (`KICHCO`), Giá theo Size (`MON_SIZE`), Công thức định lượng (`CONGTHUC`, `NGUYENLIEU`). |
| **03** | [03_NGHIEP_VU_KHO_VA_DIEU_CHUYEN.md](./03_NGHIEP_VU_KHO_VA_DIEU_CHUYEN.md) | Quản lý tồn kho chi nhánh (`TONKHO`), Nhà cung cấp (`NHACUNGCAP`), Phiếu kho đa năng (`PHIEUKHO`, `CHITIETPHIEUKHO`) cho Nhập/Xuất hủy/Điều chuyển. |
| **04** | [04_NGHIEP_VU_NHAN_SU_CA_LAM_LUONG.md](./04_NGHIEP_VU_NHAN_SU_CA_LAM_LUONG.md) | Nhân viên (`NHANVIEN`), Ca làm (`CALAM`), Chấm công thực tế (`CHAMCONG`), Bảng chốt lương tháng (`BANGLUONG`). |
| **05** | [05_NGHIEP_VU_KHACH_HANG_LOYALTY.md](./05_NGHIEP_VU_KHACH_HANG_LOYALTY.md) | Chương trình tích điểm thành viên toàn chuỗi, chiết khấu và ưu đãi khách hàng. |
| **06** | [06_MO_HINH_DU_LIEU_ERD_DATABASE.md](./06_MO_HINH_DU_LIEU_ERD_DATABASE.md) | Mô hình CSDL ERD hoàn chỉnh, Từ điển dữ liệu 16 bảng chi tiết và các ràng buộc toàn vẹn. |

---

### Các công cụ xem trực quan:
* 🌐 **Xem ERD trên trình duyệt:** [http://localhost:8080/xem_erd.html](http://localhost:8080/xem_erd.html) hoặc file [xem_erd.html](./xem_erd.html)
* 📊 **Mã nguồn PlantUML chuẩn:** [erd_diagram.puml](./erd_diagram.puml)
