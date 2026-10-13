# WEEK 7 – ỨNG DỤNG ĐẶT PHÒNG HỌC

## 1. Room Model đã được thêm field nào?

Mô hình `Room` được bổ sung hai trường:

- `building`: Lưu thông tin tòa nhà chứa phòng học.
- `floor`: Lưu thông tin tầng của phòng học.

Hai trường này giúp ứng dụng hiển thị thông tin phòng và lọc phòng theo tòa nhà.

## 2. Vì sao sửa floor trên Firebase Console mà app tự cập nhật?

Ứng dụng sử dụng `onSnapshot()` của Firebase Firestore để lắng nghe các thay đổi trong collection `rooms` theo thời gian thực.

Khi sửa trường `floor` trên Firebase Console, Firestore thông báo dữ liệu mới cho ứng dụng. Listener nhận dữ liệu cập nhật và giao diện tự động hiển thị thông tin mới mà không cần tải lại ứng dụng thủ công.

## 3. Booking payload đã được thêm field nào?

Booking payload được bổ sung trường:

- `bookedBy`: Lưu tên người đặt phòng.

Ngoài ra, thông tin booking còn bao gồm mã phòng (`roomId`), tên phòng (`roomName`), tòa nhà (`building`), ca đặt phòng (`slot`), mục đích sử dụng (`purpose`) và thời gian tạo (`createdAt`).

## 4. bookedBy được lưu vào Firestore như thế nào?

Khi người dùng đặt phòng, ứng dụng sử dụng hàm `addDoc()` để thêm thông tin booking vào collection `bookings` trên Firebase Firestore.

Tên người đặt được xử lý bằng `trim()` trước khi lưu:

```tsx
bookedBy: bookedBy.trim()
```

Việc sử dụng `trim()` giúp loại bỏ khoảng trắng ở đầu và cuối tên người đặt trước khi lưu vào Firestore.

## 5. Building filter hoạt động trên dữ liệu nào?

Bộ lọc tòa nhà hoạt động trên danh sách phòng được lấy từ Firebase Firestore và lưu trong mảng `rooms` ở ứng dụng.

Ứng dụng sử dụng trường `building` để lọc phòng theo lựa chọn của người dùng:

- `ALL`: Hiển thị phòng thuộc tất cả các tòa nhà.
- `Block A`: Chỉ hiển thị phòng thuộc tòa nhà A.
- `Block B`: Chỉ hiển thị phòng thuộc tòa nhà B.

Bộ lọc `Available Only` có thể kết hợp với bộ lọc tòa nhà để chỉ hiển thị các phòng còn trống trong tòa nhà được chọn.

## 6. Extension đã chọn là gì?

Extension được chọn là **Available Only Filter** – bộ lọc chỉ hiển thị phòng còn trống.

Khi bật bộ lọc, ứng dụng chỉ hiển thị những phòng có trường `available = true`.

Khi tắt bộ lọc, ứng dụng hiển thị các phòng theo bộ lọc tòa nhà đã chọn mà không giới hạn theo trạng thái còn trống.

## 7. Vì sao Phone B thấy booking do Phone A tạo?

Phone A và Phone B cùng lắng nghe collection `bookings` trên Firebase Firestore thông qua `onSnapshot()`.

Khi Phone A tạo booking mới, dữ liệu được lưu vào Firestore. Firestore thông báo thay đổi đến các listener đang hoạt động, vì vậy Phone B cũng nhận được booking mới và cập nhật danh sách mà không cần tải lại ứng dụng thủ công.

## 8. Week 7 đã ngăn double booking chưa? Vì sao?

**Chưa ngăn chặn hoàn toàn việc đặt trùng phòng.**

Ứng dụng có kiểm tra trạng thái `available` trước khi tạo booking. Tuy nhiên, nếu hai thiết bị cùng kiểm tra một phòng đang trống và đồng thời gửi yêu cầu đặt phòng, cả hai vẫn có thể tạo booking.

Để ngăn chặn việc đặt trùng một cách đáng tin cậy, cần bổ sung cơ chế kiểm tra và cập nhật trạng thái phòng một cách nguyên tử, chẳng hạn sử dụng Firestore Transaction hoặc xử lý xác nhận đặt phòng ở phía máy chủ.

## Kết luận

Trong Week 7, ứng dụng được bổ sung thông tin tòa nhà, tầng, tên người đặt phòng, bộ lọc tòa nhà và bộ lọc phòng còn trống. Ứng dụng sử dụng Firebase Firestore với `onSnapshot()` để cập nhật dữ liệu phòng và booking theo thời gian thực trên nhiều thiết bị.