package com.m4n.backend.dto.request;

import com.m4n.backend.entity.ArticleType;
import com.m4n.backend.validation.HttpsUrl;
import jakarta.validation.constraints.*;

public record CreateArticleRequest(
        @NotBlank(message = "Vui lòng nhập tiêu đề.") @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự.") String title,
        @Size(max = 500, message = "Tóm tắt tối đa 500 ký tự.") String summary,
        @NotBlank(message = "Vui lòng nhập nội dung.") @Size(max = 30000, message = "Nội dung tối đa 30.000 ký tự.") String content,
        @NotNull(message = "Vui lòng chọn loại nội dung.") ArticleType type,
        @HttpsUrl @Size(max = 500, message = "URL ảnh tối đa 500 ký tự.") String imageUrl,
        @HttpsUrl @Size(max = 500, message = "URL video tối đa 500 ký tự.") String videoUrl,
        @Positive(message = "Sản phẩm liên kết không hợp lệ.") Long productId,
        @Positive(message = "Nghệ nhân liên kết không hợp lệ.") Long artisanId,
        @Positive(message = "Làng nghề liên kết không hợp lệ.") Long craftVillageId
) {}
