# PRD / BRD
## Ứng dụng học Toán tiểu học có AI tạo đề, chấm điểm và hỗ trợ học tập

**Phiên bản:** 1.1  
**Trạng thái:** Draft for MVP  
**Phạm vi phát hành đầu tiên:** Công khai cho **lớp 2**, nhưng kiến trúc và dữ liệu hỗ trợ cấu hình **lớp 1–5**  
**Ngôn ngữ:** Tiếng Việt

---

# 1. Tổng quan tài liệu

## 1.1. Mục đích
Tài liệu này mô tả yêu cầu nghiệp vụ (BRD) và yêu cầu sản phẩm (PRD) cho một ứng dụng học Toán tiểu học có tích hợp AI, với các mục tiêu chính:

- Tạo bài tập/đề luyện tập tự động
- Chấm điểm tự động
- Giải thích lỗi sai ngắn gọn, dễ hiểu
- Cá nhân hóa lộ trình luyện tập theo năng lực học sinh
- Hỗ trợ phụ huynh theo dõi tiến bộ học tập

Phiên bản đầu tiên tập trung ra mắt cho **học sinh lớp 2**, nhưng hệ thống được thiết kế theo hướng **config-driven**, không hardcode riêng lớp 2, để có thể mở rộng sang lớp 1–5 thuận lợi.

## 1.2. Phạm vi tài liệu
Tài liệu này bao gồm:

- Mục tiêu kinh doanh và mục tiêu sản phẩm
- Đối tượng người dùng
- Phạm vi MVP
- Yêu cầu nghiệp vụ và chức năng
- Thiết kế nội dung học tập
- Vai trò của AI trong hệ thống
- Mô hình dữ liệu sơ bộ
- Kiến trúc công nghệ đề xuất
- Định hướng triển khai trên Vercel
- Rủi ro, KPI và lộ trình thực hiện

## 1.3. Tầm nhìn sản phẩm
Trở thành ứng dụng **trợ lý học Toán tiểu học** giúp trẻ:

- học đúng kiến thức,
- luyện tập đúng trình độ,
- hiểu vì sao mình sai,
- tiến bộ dần theo lộ trình phù hợp.

Thông điệp giá trị cốt lõi:

> Mỗi ngày 10–15 phút, bé luyện Toán đúng trình độ, được chấm ngay và biết vì sao mình sai.

---

# 2. Bối cảnh và vấn đề

## 2.1. Bối cảnh
Phụ huynh thường gặp khó khăn khi:

- tìm bài tập phù hợp trình độ của con,
- không có thời gian tự soạn bài,
- khó giải thích lại lỗi sai theo cách trẻ dễ hiểu,
- khó theo dõi con đang yếu ở chủ đề nào.

Giáo viên hoặc trung tâm cũng gặp khó khăn khi:

- cần nhiều đề luyện tập theo mức độ khác nhau,
- chấm bài thủ công tốn thời gian,
- khó phân tích lỗi sai của từng học sinh.

## 2.2. Vấn đề cần giải quyết
Phần lớn sản phẩm hiện có rơi vào một trong hai nhóm:

- ngân hàng bài tập tĩnh, ít cá nhân hóa,
- hoặc lạm dụng AI quá tự do, dẫn đến tạo đề sai, chấm thiếu ổn định.

Sản phẩm cần giải quyết các bài toán sau:

1. Tạo bài tập đúng phạm vi chương trình học.
2. Chấm bài nhanh, chính xác, ổn định.
3. Giải thích lỗi sai theo ngôn ngữ đơn giản, phù hợp trẻ em.
4. Cho phụ huynh thấy rõ điểm mạnh/yếu và tiến bộ của con.
5. Có nền tảng dữ liệu và kiến trúc đủ linh hoạt để mở rộng sang nhiều khối lớp.

---

# 3. Mục tiêu kinh doanh và mục tiêu sản phẩm

## 3.1. Mục tiêu kinh doanh
- Ra mắt MVP hẹp nhưng có giá trị sử dụng thực tế cao.
- Thu hút nhóm người dùng đầu tiên là phụ huynh có con học lớp 2.
- Kiểm chứng mức độ giữ chân và sẵn sàng trả phí.
- Tạo nền tảng dữ liệu học tập để mở rộng sang các lớp khác.

## 3.2. Mục tiêu sản phẩm
- Cho phép phụ huynh hoặc học sinh tạo bộ bài tập theo chủ đề.
- Học sinh làm bài trực tiếp trên ứng dụng.
- Hệ thống chấm tự động và phản hồi ngay sau khi nộp bài.
- Ghi nhận lịch sử học tập và hiển thị tiến bộ.
- AI hỗ trợ sinh nội dung và phản hồi có kiểm soát.

## 3.3. Chỉ số thành công giai đoạn MVP
- Tỷ lệ hoàn thành bài tập > 70%
- Tỷ lệ chấm đúng với đáp án chuẩn > 98% đối với bài trắc nghiệm/điền số
- Tỷ lệ phụ huynh quay lại trong 7 ngày > 30%
- Tỷ lệ học sinh làm ít nhất 3 buổi/tuần > 25%
- Thời gian tạo 1 bộ bài < 10 giây
- Tỷ lệ câu hỏi lỗi nội dung < 1%

---

# 4. Đối tượng người dùng

## 4.1. Nhóm người dùng chính

### A. Học sinh tiểu học
Trong MVP, chỉ công khai cho **lớp 2**.

Nhu cầu:
- làm bài dễ hiểu,
- thao tác đơn giản,
- nhận kết quả và phản hồi ngay,
- có cảm giác được khích lệ.

Đặc điểm:
- khả năng đọc hiểu còn hạn chế,
- dễ mất tập trung,
- cần giao diện ít chữ, rõ ràng, trực quan.

### B. Phụ huynh
Nhu cầu:
- tạo bài cho con nhanh,
- biết con yếu phần nào,
- duy trì thói quen học mỗi ngày,
- không phải tự tìm bài và tự chấm.

### C. Giáo viên / trung tâm
Không phải trọng tâm của MVP, nhưng kiến trúc nên tính sẵn để mở rộng.

Nhu cầu trong tương lai:
- tạo đề theo chủ đề,
- giao bài cho nhóm học sinh,
- xem báo cáo theo lớp.

## 4.2. Persona mẫu

### Persona 1: Phụ huynh
- Có con học lớp 2
- Bận rộn, ít thời gian soạn bài
- Muốn công cụ luyện Toán tại nhà 10–15 phút/ngày
- Quan tâm đến tiến bộ thực tế hơn là chỉ điểm số

### Persona 2: Học sinh
- 7–8 tuổi
- Thích giao diện đơn giản, vui, có phần thưởng nhẹ
- Không thích bài quá dài hoặc quá nhiều chữ
- Cần phản hồi ngắn, rõ, dễ hiểu

---

# 5. Phạm vi sản phẩm MVP

## 5.1. Phạm vi chức năng chính
MVP gồm 5 nhóm chức năng:

1. Quản lý tài khoản phụ huynh và hồ sơ học sinh
2. Tạo bài tập theo chủ đề Toán
3. Học sinh làm bài trên app
4. Chấm tự động và giải thích lỗi sai
5. Dashboard tiến bộ cơ bản cho phụ huynh

## 5.2. Ngoài phạm vi MVP
Các tính năng sau chưa ưu tiên ở giai đoạn đầu:

- chấm bài từ ảnh viết tay,
- OCR chữ viết tay,
- chatbot mở hoàn toàn,
- lớp học nhiều học sinh cho giáo viên,
- video bài giảng dài,
- game hóa phức tạp,
- thi đấu thời gian thực,
- học offline hoàn chỉnh.

---

# 6. Phạm vi học thuật cho giai đoạn đầu

## 6.1. Định hướng triển khai
Hệ thống phải hỗ trợ cấu hình **lớp 1–5**, nhưng phiên bản public đầu tiên chỉ bật **lớp 2**.

Điều này có nghĩa:
- dữ liệu curriculum của lớp 1–5 có thể được seed sẵn,
- chỉ lớp 2 được hiển thị ra sản phẩm ở giai đoạn đầu,
- khi muốn mở rộng, chỉ cần bật cấu hình chứ không sửa core logic.

## 6.2. Chủ đề ưu tiên cho lớp 2 trong MVP
Đề xuất tập trung vào các chủ đề có thể chuẩn hóa tốt:

1. **Số và phép tính**
   - đọc, viết, so sánh số trong phạm vi phù hợp lớp 2
   - cộng có nhớ
   - trừ có nhớ
   - nhân, chia cơ bản
   - bảng cửu chương mức cơ bản

2. **Điền số / tìm số còn thiếu**
   - điền số vào chỗ trống
   - tìm thành phần chưa biết đơn giản

3. **Toán có lời văn 1 bước**
   - cộng/trừ trong tình huống thực tế đơn giản
   - nhân/chia cơ bản trong ngữ cảnh quen thuộc

4. **Hình học cơ bản**
   - nhận diện hình đơn giản
   - đếm đoạn thẳng, hình cơ bản mức nhẹ

5. **Đo lường cơ bản**
   - độ dài
   - thời gian đơn giản
   - đơn vị quen thuộc

## 6.3. Dạng bài trong MVP
- Trắc nghiệm 4 lựa chọn
- Điền đáp án số
- Chọn đáp án đúng
- Toán lời văn ngắn, trả lời bằng số hoặc chọn đáp án

## 6.4. Dạng chưa làm trong MVP
- tự luận dài,
- trình bày nhiều bước bằng văn bản,
- chấm ảnh viết tay,
- nhập biểu thức tự do,
- bài hình học phức tạp.

---

# 7. Đề xuất giá trị cốt lõi

Sản phẩm cần tạo khác biệt bằng 4 điểm:

1. **Đề bài đúng chuẩn và có kiểm soát**
2. **Chấm nhanh và chính xác**
3. **Giải thích lỗi sai dễ hiểu với trẻ**
4. **Cá nhân hóa mức độ luyện tập**

---

# 8. Yêu cầu nghiệp vụ (BRD)

## 8.1. Nghiệp vụ tạo bài tập
Phụ huynh có thể tạo một bộ bài tập bằng cách chọn:

- lớp học
- chủ đề
- số câu
- mức độ khó
- dạng bài

Hệ thống phải:
- sinh bộ câu hỏi tương ứng,
- đảm bảo câu hỏi phù hợp với chủ đề,
- sinh đáp án chuẩn,
- sinh lời giải ngắn,
- lưu bài tập để học sinh làm và xem lại.

## 8.2. Nghiệp vụ làm bài
Học sinh có thể:
- mở một bộ bài tập,
- xem từng câu hoặc toàn bộ câu,
- nhập/chọn đáp án,
- nộp bài sau khi hoàn thành,
- nhận kết quả ngay.

## 8.3. Nghiệp vụ chấm bài
Sau khi học sinh nộp bài, hệ thống phải:
- chấm từng câu,
- tính tổng điểm,
- xác định đúng/sai,
- ghi nhận thời gian làm bài,
- phân loại lỗi phổ biến nếu có.

## 8.4. Nghiệp vụ phản hồi
Với các câu sai, hệ thống cần:
- hiển thị đáp án đúng,
- giải thích ngắn gọn,
- đưa ra gợi ý dễ hiểu.

Ví dụ:
- “Con cần cộng hàng đơn vị trước nhé.”
- “Bài này là phép trừ nên số lượng sẽ ít đi.”

## 8.5. Nghiệp vụ theo dõi tiến bộ
Phụ huynh có thể xem:
- số bài đã làm,
- điểm trung bình,
- chủ đề mạnh/yếu,
- các lỗi sai thường gặp,
- lịch sử học theo ngày.

## 8.6. Nghiệp vụ gợi ý bài tiếp theo
Dựa trên kết quả gần đây, hệ thống gợi ý:
- bài cùng chủ đề ở mức dễ hơn nếu trẻ sai nhiều,
- bài cùng chủ đề ở mức cao hơn nếu trẻ làm tốt,
- bài ôn lại chủ đề trẻ còn yếu.

---

# 9. Yêu cầu sản phẩm (PRD)

## 9.1. F1. Đăng ký / đăng nhập
### Mô tả
Phụ huynh tạo tài khoản và đăng nhập vào hệ thống.

### Yêu cầu
- đăng ký bằng email hoặc số điện thoại,
- đăng nhập an toàn,
- quên mật khẩu,
- xác thực cơ bản.

### Ưu tiên
Cao

## 9.2. F2. Tạo hồ sơ học sinh
### Mô tả
Phụ huynh tạo hồ sơ cho con.

### Dữ liệu cần có
- tên hiển thị
- lớp học
- ngày sinh (tùy chọn)
- mục tiêu học (tùy chọn)

### Ưu tiên
Cao

## 9.3. F3. Chọn chủ đề và tạo bộ bài tập
### Mô tả
Phụ huynh hoặc học sinh chọn:
- lớp học,
- chủ đề,
- số câu,
- mức độ khó,
- dạng bài.

Sau đó hệ thống tạo bài tập tự động.

### Yêu cầu chi tiết
- Có sẵn danh sách chủ đề theo lớp
- Có preset nhanh:
  - luyện 5 phút
  - luyện 10 câu
  - ôn tập chủ đề yếu
- Tạo bài trong thời gian ngắn
- Cho phép lưu bộ bài

### Ưu tiên
Rất cao

## 9.4. F4. Màn hình làm bài
### Mô tả
Học sinh làm bài trực tiếp trên app.

### Yêu cầu chi tiết
- Giao diện đơn giản, chữ lớn
- Mỗi câu hỏi rõ ràng
- Có thể chuyển câu tiếp theo
- Có thanh tiến trình
- Có nút nộp bài

### Ưu tiên
Rất cao

## 9.5. F5. Chấm điểm tự động
### Mô tả
Hệ thống chấm sau khi học sinh nộp bài.

### Yêu cầu chi tiết
- Chấm đúng/sai theo đáp án chuẩn
- Tính tổng số câu đúng
- Tính tỷ lệ đúng
- Tính điểm theo thang chuẩn
- Lưu kết quả cho báo cáo

### Ưu tiên
Rất cao

## 9.6. F6. Phản hồi và giải thích lỗi sai
### Mô tả
Sau khi chấm, hệ thống hiển thị:
- câu đúng/sai,
- đáp án đúng,
- giải thích ngắn,
- gợi ý ôn tập.

### Yêu cầu chi tiết
- Ngôn ngữ dễ hiểu với trẻ 7–8 tuổi
- Không quá dài
- Không dùng thuật ngữ khó
- Có thể hiển thị mẹo làm bài

### Ưu tiên
Rất cao

## 9.7. F7. Dashboard tiến bộ cho phụ huynh
### Mô tả
Hiển thị tình hình học tập của con.

### Chỉ số hiển thị
- số bài đã làm
- điểm trung bình
- tỷ lệ đúng
- chủ đề mạnh
- chủ đề cần luyện thêm
- lịch sử gần đây

### Ưu tiên
Cao

## 9.8. F8. Gợi ý bài học tiếp theo
### Mô tả
Hệ thống đề xuất bài tập kế tiếp dựa trên lịch sử làm bài.

### Logic cơ bản
- Nếu trẻ sai nhiều ở chủ đề A → gợi ý luyện lại A mức dễ/vừa
- Nếu trẻ đúng nhiều liên tiếp ở chủ đề B → tăng độ khó hoặc chuyển dạng bài mới

### Ưu tiên
Trung bình cao

## 9.9. F9. Quản trị ngân hàng câu hỏi và blueprint
### Mô tả
Hệ thống cần có kho câu hỏi/template để đảm bảo AI không sinh đề hoàn toàn tự do.

### Yêu cầu
- Lưu chủ đề, mức độ khó, dạng bài
- Có template và rule sinh dữ liệu
- Có validator kiểm tra kết quả trước khi phát hành cho người dùng

### Ưu tiên
Rất cao

---

# 10. Use case chính

## UC1. Phụ huynh tạo bài tập cho con
**Tác nhân:** Phụ huynh

**Luồng chính:**
1. Đăng nhập
2. Chọn hồ sơ học sinh
3. Chọn lớp, chủ đề, số câu, mức độ khó
4. Nhấn “Tạo bài”
5. Hệ thống sinh bộ bài
6. Học sinh bắt đầu làm

**Kết quả mong đợi:**
- Bài được tạo đúng chủ đề và đúng phạm vi lớp
- Có đáp án và lời giải chuẩn trong hệ thống

## UC2. Học sinh làm bài và nộp
**Tác nhân:** Học sinh

**Luồng chính:**
1. Mở bài tập
2. Trả lời từng câu
3. Nhấn nộp bài
4. Hệ thống xác nhận và chấm

**Kết quả mong đợi:**
- Không mất dữ liệu
- Kết quả trả về nhanh

## UC3. Phụ huynh xem kết quả
**Tác nhân:** Phụ huynh

**Luồng chính:**
1. Mở lịch sử bài làm
2. Chọn 1 bài vừa hoàn thành
3. Xem số câu đúng/sai
4. Xem các câu sai và giải thích
5. Xem chủ đề cần luyện thêm

## UC4. Hệ thống gợi ý bài tiếp theo
**Tác nhân:** Hệ thống

**Luồng chính:**
1. Phân tích lịch sử gần đây
2. Xác định chủ đề yếu
3. Gợi ý bộ bài mới phù hợp
4. Hiển thị ở trang chủ

---

# 11. Định hướng nội dung và sư phạm

## 11.1. Nguyên tắc nội dung
- Bám chuẩn kiến thức từng lớp
- Đơn giản, rõ ràng
- Không gây hiểu sai
- Số liệu phù hợp độ tuổi
- Ngôn ngữ dễ đọc, thân thiện

## 11.2. Nguyên tắc phản hồi cho trẻ
- Ngắn gọn
- Mang tính khích lệ
- Không phán xét
- Có hướng dẫn sửa sai

Ví dụ:
- Không nên: “Sai hoàn toàn.”
- Nên: “Con thử cộng lại hàng đơn vị trước nhé.”

## 11.3. Nguyên tắc UI cho trẻ
- chữ to,
- khoảng cách rõ,
- ít chữ trên một màn hình,
- nút bấm lớn,
- màu sắc thân thiện,
- phần thưởng nhẹ như sticker hoặc sao.

---

# 12. Vai trò của AI trong hệ thống

## 12.1. Mục tiêu sử dụng AI
AI được sử dụng cho 3 mục đích chính:

### A. Sinh nội dung có kiểm soát
AI hỗ trợ:
- viết lại đề bài tự nhiên hơn,
- đổi ngữ cảnh cho đa dạng,
- tạo lời giải ngắn gọn,
- tạo gợi ý cho học sinh.

### B. Giải thích lỗi sai
AI diễn giải lỗi sai bằng ngôn ngữ phù hợp với trẻ.

### C. Gợi ý lộ trình luyện tập
AI hoặc rule engine đề xuất bài tiếp theo dựa trên lịch sử làm bài.

## 12.2. Nguyên tắc sử dụng AI
- AI không phải nguồn quyết định duy nhất cho đúng/sai ở bài cơ bản.
- Chấm điểm phải ưu tiên **rule-based**.
- AI chỉ hỗ trợ phần diễn đạt, giải thích, đa dạng hóa nội dung và gợi ý.
- Tất cả câu sinh ra phải qua **validator**.

## 12.3. Điều không nên làm
Không nên:
- để AI tự do quyết định phạm vi kiến thức theo web search,
- để AI vừa sinh đề vừa tự chấm mà không có validator,
- để AI tự suy đoán curriculum.

---

# 13. Nguồn kiến thức để AI bám vào

## 13.1. Kết luận định hướng
AI không nên tự “search web” để quyết định nội dung chương trình học.

Thay vào đó, hệ thống cần có **nguồn kiến thức nội bộ có cấu trúc** để AI bám vào, bao gồm:
- lớp học,
- chủ đề,
- kỹ năng,
- mục tiêu học tập,
- dạng bài cho phép,
- giới hạn số,
- quy tắc sinh đề,
- phong cách giải thích.

## 13.2. Cách lưu trữ nguồn kiến thức
Có 3 cách khả thi:

### Cách 1: Database
Phù hợp để:
- query theo lớp/chủ đề/kỹ năng,
- bật/tắt nội dung,
- quản trị nội dung bằng admin tool,
- theo dõi version.

### Cách 2: File config JSON/YAML
Phù hợp cho:
- seed dữ liệu ban đầu,
- quản lý nội dung bằng Git,
- review nội dung như tài liệu kỹ thuật.

### Cách 3: Kết hợp DB + file config
Đây là cách được khuyến nghị:
- file JSON/YAML là nguồn seed/version control,
- DB là source of truth cho runtime.

## 13.3. Ví dụ cấu trúc knowledge item
```json
{
  "grade": 2,
  "subject": "math",
  "topic": "addition_with_carry",
  "skill": "add_two_digit_numbers_with_carry",
  "learning_objective": "Học sinh thực hiện được phép cộng có nhớ trong phạm vi 100",
  "constraints": {
    "min_value": 0,
    "max_value": 100,
    "allow_carry": true,
    "max_steps": 1
  },
  "allowed_question_types": [
    "multiple_choice",
    "fill_in_blank",
    "word_problem_one_step"
  ],
  "language_rules": {
    "max_sentence_length": 20,
    "tone": "simple_child_friendly"
  }
}
```

## 13.4. Pipeline đề xuất khi tạo đề
1. Người dùng chọn lớp/chủ đề/dạng bài
2. Hệ thống đọc constraints từ DB/config
3. Hệ thống chọn blueprint phù hợp
4. AI sinh câu hỏi theo khung đó
5. Validator kiểm tra:
   - đúng chủ đề,
   - đúng đáp án,
   - đúng phạm vi số,
   - lời giải khớp đáp án,
   - ngôn ngữ phù hợp
6. Lưu đề vào hệ thống

---

# 14. Định hướng dùng Gemini trong giai đoạn thử nghiệm

## 14.1. Có thể dùng Gemini không?
Có thể dùng **Gemini** trong giai đoạn thử nghiệm để giảm chi phí và tăng tốc phát triển. Gemini phù hợp cho:
- viết lại đề bài,
- tạo lời giải ngắn,
- sinh feedback,
- hỗ trợ tạo dữ liệu mẫu,
- hỗ trợ content operations.

## 14.2. Không nên dùng Gemini cho phần nào?
Không nên giao toàn quyền cho Gemini ở các phần:
- quyết định curriculum,
- chấm đúng/sai tuyệt đối cho bài cơ bản,
- tự search web để quyết định kiến thức lớp học.

## 14.3. Kết luận
Gemini có thể là giải pháp hợp lý cho MVP/prototype, nhưng nên được đặt sau:
- rule-based generation,
- structured curriculum,
- validation layer.

---

# 15. Kiến trúc nghiệp vụ và luồng xử lý

## 15.1. Luồng tạo bài
1. Người dùng chọn lớp/chủ đề/số câu/mức độ khó
2. Hệ thống tải curriculum config tương ứng
3. Hệ thống chọn skill và blueprint
4. Sinh question instance
5. Tính đáp án chuẩn
6. AI viết lại câu chữ/lời giải/gợi ý nếu cần
7. Chạy validator
8. Lưu bộ bài
9. Trả về frontend

## 15.2. Luồng chấm bài
1. Nhận đáp án học sinh
2. So khớp với đáp án chuẩn
3. Tính điểm và tỷ lệ đúng
4. Xác định lỗi thường gặp
5. AI tạo feedback ngắn gọn
6. Lưu kết quả
7. Cập nhật learning progress
8. Gợi ý bài tiếp theo

---

# 16. Thiết kế cấu hình lớp theo hướng config-driven

## 16.1. Nguyên tắc
Không hardcode lớp 2 trong code hoặc service nghiệp vụ chính.

Hệ thống phải được thiết kế theo hướng:
- lớp là dữ liệu,
- chủ đề là dữ liệu,
- kỹ năng là dữ liệu,
- blueprint sinh đề là dữ liệu,
- lớp nào public hay chưa cũng là dữ liệu.

## 16.2. Phân chia DB và file config

### Nên lưu trong database
- danh sách lớp 1–5
- chủ đề theo từng lớp
- kỹ năng trong từng chủ đề
- trạng thái phát hành của từng lớp/chủ đề
- giới hạn số, rule sinh đề, difficulty
- mapping curriculum và blueprint
- feature flags theo lớp hoặc theo tenant
- prompt template nội dung học

### Nên lưu trong file config
- app constants
- enum hệ thống
- ngưỡng scoring mặc định
- giới hạn timeout / retry
- cấu hình provider AI
- seed preset ban đầu

## 16.3. Cách làm khuyến nghị
- Trong DB tạo sẵn lớp 1–5
- Chỉ bật lớp 2 cho production ở giai đoạn đầu
- Dùng file JSON/YAML để seed curriculum vào DB
- DB là source of truth khi app chạy thực tế

---

# 17. Mô hình dữ liệu sơ bộ

## 17.1. Bảng users
- id
- email / phone
- password_hash
- role
- created_at
- updated_at

## 17.2. Bảng students
- id
- user_id
- name
- grade_id
- birth_date
- created_at
- updated_at

## 17.3. Bảng grades
- id
- code
- display_name
- order_index
- age_from
- age_to
- status
- is_enabled
- is_public
- created_at
- updated_at

## 17.4. Bảng subjects
- id
- code
- display_name
- is_enabled

## 17.5. Bảng curriculum_topics
- id
- subject_id
- grade_id
- code
- name
- description
- order_index
- status
- is_enabled

## 17.6. Bảng skills
- id
- topic_id
- code
- name
- description
- learning_objective
- difficulty_min
- difficulty_max
- is_enabled

## 17.7. Bảng question_blueprints
- id
- skill_id
- question_type
- template_type
- constraints_json
- answer_logic
- explanation_template
- validator_rules_json
- version
- is_enabled

## 17.8. Bảng questions
- id
- topic_id
- skill_id
- difficulty
- question_type
- content
- answer
- explanation
- metadata
- created_at

## 17.9. Bảng exams
- id
- student_id
- grade_id
- topic_id
- title
- difficulty
- total_questions
- created_by
- created_at

## 17.10. Bảng exam_items
- id
- exam_id
- question_id
- order_no

## 17.11. Bảng submissions
- id
- exam_id
- student_id
- started_at
- submitted_at
- score
- correct_count
- total_count
- duration_seconds

## 17.12. Bảng submission_answers
- id
- submission_id
- question_id
- student_answer
- is_correct
- feedback
- error_type

## 17.13. Bảng learning_progress
- id
- student_id
- topic_id
- mastery_level
- recent_accuracy
- recommended_next_action
- updated_at

## 17.14. Bảng grade_release_configs
- id
- grade_id
- is_public
- ai_generation_enabled
- auto_recommend_enabled
- feedback_level
- rollout_percentage

---

# 18. Luật nghiệp vụ quan trọng

## 18.1. Luật sinh đề
- Chỉ sinh câu nằm trong danh mục chủ đề của lớp tương ứng
- Mỗi câu phải có đúng 1 đáp án chuẩn
- Số liệu phải nằm trong phạm vi được phép
- Câu lời văn phải đủ dữ kiện
- Ngôn ngữ phải phù hợp độ tuổi

## 18.2. Luật chấm điểm
- Trắc nghiệm: so khớp đáp án chuẩn
- Điền số: normalize dữ liệu trước khi so khớp
- Không dùng LLM để quyết định đúng/sai ở câu cơ bản

## 18.3. Luật phản hồi
- Mỗi câu sai phải có ít nhất 1 phản hồi ngắn
- Phản hồi không quá dài
- Không dùng từ mang tính tiêu cực

## 18.4. Luật gợi ý bài tiếp theo
- Nếu accuracy < 50% trong 2 bài gần nhất cùng chủ đề → gợi ý học lại mức dễ
- Nếu accuracy > 80% trong 3 bài gần nhất → gợi ý tăng độ khó hoặc chuyển dạng

---

# 19. Yêu cầu chức năng chi tiết theo màn hình

## 19.1. Trang chủ
Hiển thị:
- hồ sơ học sinh
- bài gợi ý hôm nay
- bài gần đây
- tiến độ học tuần này

## 19.2. Màn hình chọn bài
Cho phép chọn:
- lớp
- chủ đề
- số câu
- mức độ khó
- dạng bài

## 19.3. Màn hình làm bài
Hiển thị:
- câu hỏi
- lựa chọn hoặc ô nhập
- số câu hiện tại / tổng số câu
- nút tiếp theo
- nút nộp bài

## 19.4. Màn hình kết quả
Hiển thị:
- tổng điểm
- số câu đúng
- lời khen động viên
- danh sách câu sai
- giải thích từng câu
- nút “Luyện lại”

## 19.5. Màn hình dashboard phụ huynh
Hiển thị:
- thống kê theo tuần
- biểu đồ đơn giản
- chủ đề cần cải thiện
- bài gợi ý tiếp theo

---

# 20. Yêu cầu phi chức năng

## 20.1. Hiệu năng
- Thời gian tải màn hình chính < 3 giây trong điều kiện mạng ổn định
- Thời gian tạo bộ bài < 10 giây
- Thời gian chấm bài < 3 giây với bộ bài cơ bản

## 20.2. Độ ổn định
- Hệ thống phải lưu đáp án tạm nếu người dùng rời màn hình ngắn hạn
- Không mất dữ liệu khi submit

## 20.3. Bảo mật
- Bảo vệ thông tin tài khoản và dữ liệu học sinh
- Mật khẩu được mã hóa
- Phân quyền hợp lý
- Hạn chế lưu dữ liệu nhạy cảm không cần thiết

## 20.4. Khả năng mở rộng
Kiến trúc phải cho phép mở rộng:
- lớp 3, 4, 5
- giáo viên / trung tâm
- môn học khác trong tương lai

## 20.5. Khả năng quan sát hệ thống
Cần log:
- thời gian tạo đề,
- lỗi sinh đề,
- lỗi chấm,
- tỷ lệ bài bị bỏ giữa chừng,
- tỷ lệ câu invalid.

---

# 21. Công nghệ đề xuất

## 21.1. Mục tiêu chọn stack
- nhanh ra MVP,
- ít DevOps,
- dễ triển khai,
- thuận tiện khi deploy trên Vercel,
- đủ linh hoạt để mở rộng.

## 21.2. Stack đề xuất
- **Frontend + Backend web:** Next.js
- **Ngôn ngữ:** TypeScript
- **Deploy:** Vercel
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth hoặc Clerk
- **ORM:** Prisma hoặc Drizzle
- **Storage:** Supabase Storage hoặc Vercel Blob
- **AI:** Gemini hoặc provider tương đương trong giai đoạn thử nghiệm
- **UI:** Tailwind CSS + shadcn/ui
- **Analytics:** PostHog
- **Email:** Resend (nếu cần)

## 21.3. Khuyến nghị chính
Phương án phù hợp nhất cho MVP:

- **Next.js full-stack**
- **Vercel**
- **Supabase**
- **Prisma**
- **Gemini/OpenAI**
- **Tailwind + shadcn/ui**

## 21.4. Vì sao không nên tách backend riêng quá sớm
Trong giai đoạn MVP, không cần tách frontend và backend thành hai hệ thống riêng nếu chưa có lý do rõ ràng.

Nên tận dụng:
- API routes trong Next.js
- server actions cho thao tác đơn giản
- serverless functions trên Vercel

Lợi ích:
- nhanh phát triển,
- dễ deploy,
- giảm chi phí vận hành,
- dễ maintain với team nhỏ.

---

# 22. Hướng triển khai trên Vercel

## 22.1. Mục tiêu
- một codebase triển khai nhanh,
- tự động build/deploy,
- dễ quản lý môi trường dev/staging/prod.

## 22.2. Định hướng
- App chạy trên **Vercel**
- Dữ liệu chạy trên **Supabase Postgres**
- Tệp có thể dùng **Supabase Storage** hoặc **Vercel Blob**
- Secrets quản lý bằng environment variables
- Curriculum seed quản lý bằng file JSON/YAML và import vào DB

## 22.3. Điều nên tránh
- hardcode logic lớp 2 trong code,
- để curriculum chính trong `.env`,
- tách microservice sớm khi chưa cần,
- để AI search web rồi quyết định nội dung học.

---

# 23. Cấu trúc seed/config đề xuất

Ví dụ file `curriculum.math.vi.json`:

```json
{
  "subject": "math",
  "grades": [
    {
      "code": "grade_1",
      "display_name": "Lớp 1",
      "enabled": false,
      "topics": []
    },
    {
      "code": "grade_2",
      "display_name": "Lớp 2",
      "enabled": true,
      "topics": [
        {
          "code": "addition_with_carry",
          "name": "Cộng có nhớ",
          "skills": [
            {
              "code": "add_2d_1d_with_carry",
              "name": "Cộng số có hai chữ số với số có một chữ số có nhớ",
              "question_types": ["multiple_choice", "fill_in_blank"],
              "constraints": {
                "min_value": 0,
                "max_value": 100,
                "allow_carry": true
              }
            }
          ]
        }
      ]
    }
  ]
}
```

Ứng dụng thực tế:
- file này được commit trong repo,
- review qua pull request,
- import vào DB qua seed script,
- DB là nguồn runtime chính.

---

# 24. Kế hoạch triển khai nội dung lớp

## 24.1. Giai đoạn đầu
- seed cấu trúc lớp 1–5 vào DB
- chỉ bật lớp 2 cho người dùng public
- chuẩn bị chủ đề lớp 2 thật chắc

## 24.2. Giai đoạn mở rộng
Khi muốn mở lớp 3:
- thêm topic/skill/blueprint lớp 3,
- bật `is_public = true`,
- không cần đổi core logic.

---

# 25. KPI sản phẩm

## 25.1. KPI sử dụng
- DAU / WAU
- số bài trung bình mỗi học sinh mỗi tuần
- thời lượng học trung bình mỗi phiên
- tỷ lệ nộp bài thành công

## 25.2. KPI học tập
- tỷ lệ đúng trung bình theo chủ đề
- tiến bộ accuracy sau 2 tuần
- số chủ đề từ yếu chuyển sang đạt

## 25.3. KPI AI / nội dung
- tỷ lệ câu hỏi hợp lệ sau validator
- tỷ lệ câu bị phụ huynh báo lỗi
- tỷ lệ phản hồi bị đánh giá khó hiểu
- thời gian trung bình sinh đề

## 25.4. KPI kinh doanh
- tỷ lệ chuyển đổi dùng thử sang trả phí
- tỷ lệ giữ chân 7 ngày / 30 ngày
- CAC và LTV ở giai đoạn tăng trưởng

---

# 26. Rủi ro và hướng xử lý

## 26.1. AI tạo sai câu
**Mức độ:** Rất cao

**Giải pháp:**
- template + rule trước, AI sau,
- validator tự động,
- review thủ công cho blueprint quan trọng.

## 26.2. AI giải thích quá khó hiểu
**Mức độ:** Cao

**Giải pháp:**
- giới hạn độ dài feedback,
- prompt riêng cho trẻ 7–8 tuổi,
- test với phụ huynh và học sinh thật.

## 26.3. UX không phù hợp trẻ em
**Mức độ:** Cao

**Giải pháp:**
- test prototype với trẻ,
- đơn giản hóa màn hình,
- giảm chữ và thao tác.

## 26.4. Không giữ chân người dùng
**Mức độ:** Trung bình cao

**Giải pháp:**
- bài tập ngắn,
- có lộ trình mỗi ngày,
- dashboard rõ ràng cho phụ huynh,
- gợi ý bài tiếp theo hợp lý.

## 26.5. Mở rộng khó
**Mức độ:** Trung bình

**Giải pháp:**
- map curriculum theo grade/topic/skill ngay từ đầu,
- tuyệt đối không hardcode riêng cho lớp 2.

---

# 27. Lộ trình triển khai đề xuất

## Giai đoạn 1: Discovery & Design
- chốt phạm vi lớp 2 public
- thiết kế curriculum-driven model cho lớp 1–5
- chốt user flow
- chốt schema dữ liệu
- tạo bộ blueprint đầu tiên

## Giai đoạn 2: Build MVP
- auth + hồ sơ học sinh
- module curriculum
- module tạo bài
- module làm bài
- module chấm điểm
- feedback
- dashboard cơ bản

## Giai đoạn 3: Internal QA
- test validator
- test chất lượng câu hỏi
- test độ đúng chấm điểm
- test UX với phụ huynh và 5–10 học sinh

## Giai đoạn 4: Pilot
- chạy thử với nhóm phụ huynh nhỏ
- thu feedback
- tối ưu chủ đề, lời giải, thời gian tạo đề

## Giai đoạn 5: Mở rộng
- thêm nhiều chủ đề lớp 2
- thêm gamification nhẹ
- chuẩn bị mở lớp 3

---

# 28. Tiêu chí nghiệm thu MVP

MVP được xem là đạt khi:
- Phụ huynh có thể tạo bài trong vài thao tác
- Học sinh làm bài thuận lợi trên điện thoại/tablet
- Hệ thống chấm ổn định với bài cơ bản
- Các câu sai có giải thích dễ hiểu
- Dashboard cho thấy ít nhất chủ đề mạnh/yếu
- Có một nhóm pilot dùng được trong thực tế

---

# 29. Kết luận

Sản phẩm nên đi theo hướng:

- **lớp 2 public trước, nhưng hệ thống hỗ trợ cấu hình lớp 1–5 ngay từ đầu**
- **AI có kiểm soát, không giao toàn quyền**
- **ưu tiên độ đúng, tính sư phạm và khả năng mở rộng**
- **phụ huynh là người trả tiền, học sinh là người dùng chính**

Chiến lược tốt nhất là:
- bắt đầu bằng các dạng toán dễ chuẩn hóa,
- xây hệ thống curriculum + chấm điểm thật ổn,
- dùng AI chủ yếu cho phần diễn đạt, giải thích và cá nhân hóa,
- sau đó mới mở rộng chủ đề, lớp học và các tính năng nâng cao.

---

# 30. Phụ lục: Quyết định kỹ thuật khuyến nghị

## 30.1. Quyết định nên chốt sớm
1. Dùng mô hình **config-driven curriculum**
2. Chỉ public lớp 2 ở MVP
3. Dùng **Next.js full-stack trên Vercel**
4. Dùng **Supabase Postgres** làm source of truth
5. Dùng **Prisma** để đẩy nhanh tốc độ dev
6. Dùng **Gemini** ở giai đoạn thử nghiệm cho generation/feedback
7. Không dùng AI để tự search web quyết định nội dung chương trình

## 30.2. Những thứ có thể làm sau
- OCR bài viết tay
- giáo viên/trung tâm
- mở rộng lớp 3–5
- gamification nâng cao
- adaptive learning phức tạp hơn
- worksheet PDF để in
