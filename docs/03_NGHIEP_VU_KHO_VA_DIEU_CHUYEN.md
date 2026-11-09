# TÀI LIỆU 03: QUẢN LÝ KHO, NHẬP XUẤT & ĐIỀU CHUYỂN

---

## 1. MÔ TẢ TỔNG QUAN

Để tránh việc sinh ra quá nhiều bảng rời rạc (Bảng Nhập riêng, Bảng Xuất riêng, Bảng Chuyển riêng), hệ thống áp dụng **Design Pattern "Phiếu Kho Đa Năng"** với đúng 4 bảng:

```
[NHACUNGCAP] ── 0..1:N ──> [PHIEUKHO] ── 1:N ──> [CHITIETPHIEUKHO] <── N:1 ── [NGUYENLIEU]
                                │                                                    │
                                N:1                                                 1:N
                                ▼                                                    ▼
                            [CHINHANH] ──────────────── 1:N ──────────────────> [TONKHO]
```

---

## 2. Ý NGHĨA CÁC BẢNG DỮ LIỆU

1. **`TONKHO` (Tồn kho theo chi nhánh):** Khóa chính kết hợp `(MaCN, MaNL)`. Lưu trữ số lượng tồn thực tế của từng loại nguyên liệu tại từng chi nhánh.
2. **`NHACUNGCAP` (Nhà cung cấp):** Thông tin đơn vị giao nguyên liệu (`MaNCC`, `TenNCC`, `SDT`).
3. **`PHIEUKHO` (Phiếu kho đa năng):** Khóa chính `MaPhieu`, lưu thông tin phiếu với trường phân loại `LoaiPhieu`:
   * `NHAP`: Nhập hàng từ Nhà cung cấp.
   * `XUAT_HUY`: Xuất hủy nguyên liệu hết date, hư hỏng, pha thử máy.
   * `CHUYEN_KHO`: Điều chuyển nguyên liệu sang chi nhánh khác trong chuỗi.
4. **`CHITIETPHIEUKHO`:** Khóa chính kết hợp `(MaPhieu, MaNL)`, lưu số lượng và đơn giá của từng nguyên liệu trên phiếu kho.

---

## 3. CƠ CHẾ XỬ LÝ THEO TỪNG LOẠI PHIẾU KHO

### 3.1. Phiếu Nhập Hàng (`LoaiPhieu = 'NHAP'`)
* Người thực hiện: Thủ kho / Quản lý chi nhánh.
* Thông tin cần có: Chọn `MaNCC` (Nhà cung cấp), nhập số lượng và giá nhập.
* Tác động tồn kho:
  $$\text{SoLuongTon}_{\text{mới}} = \text{SoLuongTon}_{\text{cũ}} + \text{SoLuongNhap}$$

### 3.2. Phiếu Xuất Hủy / Hao Hụt (`LoaiPhieu = 'XUAT_HUY'`)
* Áp dụng khi: Sữa tươi thanh trùng hết hạn sử dụng, hoa quả hỏng, bột cafe rơi vãi trong quá trình căn chỉnh máy pha.
* Người thực hiện: Barista lập phiếu, Quản lý chi nhánh duyệt.
* Tác động tồn kho:
  $$\text{SoLuongTon}_{\text{mới}} = \text{SoLuongTon}_{\text{cũ}} - \text{SoLuongHuy}$$

### 3.3. Phiếu Điều Chuyển Liên Chi Nhánh (`LoaiPhieu = 'CHUYEN_KHO'`)
* Áp dụng khi: Chi nhánh A sắp hết sữa, cần chuyển từ Chi nhánh B sang.
* Quy trình:
  1. Chi nhánh B tạo phiếu xuất chuyển kho $\rightarrow$ Hệ thống trừ tồn kho tại Chi nhánh B.
  2. Khi hàng sang tới nơi, Chi nhánh A xác nhận nhận đủ $\rightarrow$ Hệ thống tạo phiếu nhập nhận chuyển kho và cộng tồn kho tại Chi nhánh A.

---

## 4. KIỂM KÊ & CÂN BẰNG KHO CUỐI NGÀY

Vào cuối mỗi ngày làm việc:
1. Nhân viên kiểm đếm thực tế (cân số kg hạt cafe, đếm số hộp sữa còn lại trong tủ mát).
2. Nhập số liệu thực tế vào hệ thống:
   $$\text{Chênh lệch} = \text{Số lượng thực tế} - \text{Số lượng tồn trên hệ thống}$$
   * Nếu chênh lệch âm (thiếu hụt): Hệ thống tự sinh phiếu `XUAT_HUY` với lý do *"Hao hụt kiểm kê"*.
   * Đảm bảo sang ngày mới, số tồn trên phần mềm luôn khớp 100% với thực tế trong tủ lạnh.
