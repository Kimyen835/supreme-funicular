# TÀI LIỆU 05: KHÁCH HÀNG THÂN THIẾT & CHƯƠNG TRÌNH TÍCH ĐIỂM (LOYALTY)

---

## 1. MÔ TẢ TỔNG QUAN

Trong chuỗi quán cà phê, khách hàng là nguồn tài sản quý giá nhất. Khách hàng thân thiết có thể sử dụng số điện thoại của mình để **tích điểm và tiêu điểm tại bất kỳ chi nhánh nào trong chuỗi**.

```
[KHACHHANG] ── 0..1:N ──> [HOADON]
(MaKH, TenKH, SDT, DiemTichLuy)
```

---

## 2. CẤU TRÚC BẢNG `KHACHHANG`

Bảng `KHACHHANG` được thiết kế gọn nhẹ nhưng đầy đủ:
* `MaKH`: Mã khách hàng duy nhất (ví dụ: `KH0001`).
* `TenKH`: Tên của khách hàng.
* `SDT`: Số điện thoại nhận diện (Unique - Duy nhất trên toàn hệ thống).
* `DiemTichLuy`: Số điểm khả dụng hiện có của khách.

---

## 3. CƠ CHẾ TÍCH ĐIỂM & TIÊU ĐIỂM (EARN & BURN)

### 3.1. Tích điểm (Earn Points)
* Khi thanh toán hóa đơn thành công tại quầy POS, hệ thống căn cứ vào tổng tiền thanh toán của hóa đơn (`TongThanhToan` trong bảng `HOADON`):
  $$\text{Điểm cộng} = \left\lfloor \frac{\text{TongThanhToan}}{10.000} \right\rfloor$$
* **Ví dụ:** Hóa đơn thanh toán là 78.000 VNĐ $\rightarrow$ Khách được cộng ngay **7 điểm**.

### 3.2. Tiêu điểm (Burn Points)
* Khách hàng có thể quy đổi điểm tích lũy thành tiền giảm giá trực tiếp trên hóa đơn mua đồ uống:
  $$\text{1 điểm} = 1.000 \text{ VNĐ}$$
* **Ví dụ:** Khách đang có 25 điểm và yêu cầu dùng điểm $\rightarrow$ Thu ngân trừ **25.000 VNĐ** vào trường `GiamGia` trên bảng `HOADON`, và hệ thống tự động trừ 25 điểm trong bảng `KHACHHANG`.

---

## 4. LUỒNG TRA CỨU TẠI QUẦY THU NGÂN
1. Thu ngân hỏi số điện thoại khách hàng khi gọi món.
2. Nhập SĐT vào máy POS $\rightarrow$ Hệ thống thực hiện truy vấn:
   ```sql
   SELECT MaKH, TenKH, DiemTichLuy FROM KHACHHANG WHERE SDT = @SDT;
   ```
3. Nếu tìm thấy: Hiển thị tên khách và số điểm hiện có.
4. Nếu chưa có: Thu ngân bấm "Thêm nhanh khách mới" chỉ với Tên + SĐT trong vòng 3 giây để không làm gián đoạn hàng chờ gọi món.
