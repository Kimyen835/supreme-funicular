# TÀI LIỆU 02: MENU, GIÁ THEO SIZE & CÔNG THỨC ĐỊNH LƯỢNG (BOM)

---

## 1. CẤU TRÚC MENU ĐẶC THÙ NGÀNH F&B (THEO SIZE)

Trong quán cà phê, hầu hết đồ uống đều có nhiều kích cỡ (Size S, M, L) với **giá bán khác nhau** và **định lượng nguyên vật liệu khác nhau**. 

Để chuẩn hóa cơ sở dữ liệu và không làm "rác" danh mục món, hệ thống sử dụng mô hình 6 bảng chuẩn:

```
[DANHMUC] ── 1:N ──> [MON] ── 1:N ──> [MON_SIZE] <── N:1 ── [KICHCO]
                                          │
                                         1:N
                                          ▼
                                     [CONGTHUC] <── N:1 ── [NGUYENLIEU]
```

---

## 2. Ý NGHĨA TỪNG BẢNG DỮ LIỆU

1. **`DANHMUC` (Danh mục):** Phân nhóm món (`MaDM`, `TenDM`). Ví dụ: *Cà phê truyền thống*, *Trà trái cây*, *Đá xay - Freeze*, *Bánh ngọt*.
2. **`MON` (Món cơ sở):** Thông tin gốc của món (`MaMon`, `TenMon`, `MaDM`, `HinhAnh`, `TrangThai`). Ví dụ: *Cà phê sữa Sài Gòn*.
3. **`KICHCO` (Size):** Danh mục kích cỡ chuẩn (`MaSize`, `TenSize`). Ví dụ: `S` (Nhỏ), `M` (Vừa), `L` (Lớn).
4. **`MON_SIZE` (Món theo kích cỡ & Giá bán):** Khóa chính `MaMonSize`, lưu giá bán niêm yết cho từng size của món:
   * `CF_SUA_S`: Cà phê sữa - Size S - Giá: **29.000 VNĐ**
   * `CF_SUA_M`: Cà phê sữa - Size M - Giá: **35.000 VNĐ**
   * `CF_SUA_L`: Cà phê sữa - Size L - Giá: **42.000 VNĐ**
5. **`NGUYENLIEU` (Nguyên vật liệu):** Danh mục vật tư thô (`MaNL`, `TenNL`, `DonViTinh`, `NguongBao`). Ví dụ: *Cà phê hạt Robusta (gam)*, *Sữa đặc (ml)*, *Sữa tươi thanh trùng (ml)*.
6. **`CONGTHUC` (Định lượng pha chế - BOM):** Khóa chính kết hợp `(MaMonSize, MaNL)`. Quy định rõ 1 ly kích cỡ cụ thể cần bao nhiêu gam/ml nguyên liệu.

---

## 3. BẢNG VÍ DỤ ĐỊNH LƯỢNG THỰC TẾ

| Mã Món Size (`MaMonSize`) | Tên Món & Size | Nguyên Liệu (`MaNL`) | Tiêu Hao (`SoLuongTieuHao`) | ĐVT |
| :--- | :--- | :--- | :---: | :---: |
| `CF_SUA_S` | Cà phê sữa - Size S | Hạt Cafe Robusta | 20 | gam |
| `CF_SUA_S` | Cà phê sữa - Size S | Sữa đặc | 25 | ml |
| `CF_SUA_S` | Cà phê sữa - Size S | Ly nhựa Size S | 1 | cái |
| `CF_SUA_L` | Cà phê sữa - Size L | Hạt Cafe Robusta | 30 | gam |
| `CF_SUA_L` | Cà phê sữa - Size L | Sữa đặc | 40 | ml |
| `CF_SUA_L` | Cà phê sữa - Size L | Ly nhựa Size L | 1 | cái |
| `TRA_DAO_M` | Trà đào cam sả - Size M | Trà đen túi lọc | 1 | túi |
| `TRA_DAO_M` | Trà đào cam sả - Size M | Nước cốt đào | 30 | ml |
| `TRA_DAO_M` | Trà đào cam sả - Size M | Đào ngâm | 2 | miếng |

---

## 4. CƠ CHẾ TRỪ TỒN KHO TỰ ĐỘNG

Khi một hóa đơn được thanh toán thành công:
1. Hệ thống đọc danh sách `MaMonSize` và `SoLuong` trong `CHITIETHOADON`.
2. Tra cứu định lượng tương ứng trong bảng `CONGTHUC`.
3. Tính tổng lượng nguyên vật liệu tiêu hao:
   $$\text{Lượng trừ} = \text{SoLuong} \times \text{SoLuongTieuHao}$$
4. Thực thi trừ trực tiếp vào bảng `TONKHO` tại chi nhánh đó:
   ```sql
   UPDATE TONKHO
   SET SoLuongTon = SoLuongTon - @LuongTru
   WHERE MaCN = @MaCN AND MaNL = @MaNL;
   ```
5. Nếu `SoLuongTon` sau khi trừ nhỏ hơn hoặc bằng `NguongBao` trong bảng `NGUYENLIEU`, hệ thống gửi thông báo cảnh báo cho Quản lý cửa hàng để nhập thêm nguyên liệu.
