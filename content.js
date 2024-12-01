(function () {
  const currentUrl = window.location.href;

  // Tìm config phù hợp với URL hiện tại
  const siteConfig = siteConfigs.find(config => currentUrl.startsWith(config.url));

  if (siteConfig) {
    // Tạo button sử dụng jQuery
    const $button = $("<button>")
      .text("Copy Markdown Content") // Đổi button thành "Copy Markdown Content"
      .css({
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: "9999",
        padding: "10px 15px",
        backgroundColor: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
      })
      .hover(
        function () {
          $(this).css("backgroundColor", "#0056b3");
        },
        function () {
          $(this).css("backgroundColor", "#007bff");
        }
      )
      .click(() => {
        const contentHtml = document.documentElement.innerHTML; // Toàn bộ nội dung trang hiện tại
        const result = parseContentMD(contentHtml);

        let fullContentMD = `# ${result.title}\n\n${result.content}`;
        console.log(fullContentMD);
        // Sử dụng hàm copyToClipboard
        copyToClipboard(fullContentMD).then((success) => {
          if (success) {
            alert("Copied to clipboard success!");
          } else {
            alert("Copy to clipboard failed.");
          }
        });
      });

    // Thêm button vào body
    $("body").append($button);
  }
})();

function updateHeaderLevel(contentMd) {
  // Tách các dòng của contentMd thành một mảng
  const lines = contentMd.split("\n");

  // Lưu trữ kết quả sau khi xử lý
  const updatedLines = [];

  // Cấp độ tiêu đề nhỏ nhất được tìm thấy
  let minHeaderLevel = Infinity;

  // Xác định cấp độ tiêu đề nhỏ nhất trong contentMd
  lines.forEach((line) => {
    const match = line.match(/^(#+)\s/); // Tìm các tiêu đề Markdown (ví dụ: ###)
    if (match) {
      const headerLevel = match[1].length; // Độ dài của chuỗi '#'
      minHeaderLevel = Math.min(minHeaderLevel, headerLevel);
    }
  });

  // Đặt cấp độ cơ sở mới là 2 ("##")
  const baseLevel = 2;

  // Điều chỉnh tiêu đề
  lines.forEach((line) => {
    const match = line.match(/^(#+)\s/);
    if (match) {
      const headerLevel = match[1].length;
      const adjustedLevel = headerLevel - minHeaderLevel + baseLevel; // Điều chỉnh cấp độ
      updatedLines.push(`${"#".repeat(adjustedLevel)}${line.slice(headerLevel)}`);
    } else {
      // Giữ nguyên các dòng không phải là tiêu đề
      updatedLines.push(line);
    }
  });

  // Ghép lại các dòng thành một chuỗi Markdown
  return updatedLines.join("\n");
}

function removeAllHtmlTag(contentMd) {
  // Hàm xử lý chuỗi Markdown
  return contentMd.replace(/<[^>]*>/g, (match) => {
    // Xử lý đặc biệt cho thẻ <img>
    const imgMatch = match.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/);
    if (imgMatch) {
      // Lấy URL từ thuộc tính src
      const src = imgMatch[1];
      return `<img src="${src}" width="60%">`; // Thay thế bằng định dạng mới
    }

    // Loại bỏ các thẻ HTML khác
    return "";
  });
}

function removeMultipleEndline(contentMd) {
  /**
   * Thay thế các đoạn xuống dòng liên tiếp (3 lần trở lên) bằng 2 lần xuống dòng (\n\n)
   */
  return contentMd.replace(/\n{3,}/g, "\n\n");
}

function parseContentMD(contentHtml, contentUrl = null) {
  /**
   * contentHtml: string chứa nội dung trang web ở HTML format.
   * contentUrl: đường dẫn của trang web, nếu null thì lấy đường dẫn trang hiện tại.
   * Trả về object: { url, title, content }
   */

  // Nếu contentUrl không được cung cấp, lấy đường dẫn trang hiện tại
  const currentUrl = contentUrl || window.location.href;

  // Tìm config phù hợp với URL hiện tại
  const siteConfig = siteConfigs.find(config => currentUrl.startsWith(config.url));

  if (!siteConfig) {
    console.error("Không tìm thấy cấu hình cho URL:", currentUrl);
    return { url: currentUrl, title: null, content: null };
  }

  const { content, title } = siteConfig;

  // Tạo DOM giả lập từ contentHtml
  const $html = $("<div>").html(contentHtml);

  // Lấy nội dung và tiêu đề sử dụng jQuery
  const $titleElement = $html.find(title);
  const $contentElement = $html.find(content);

  if ($titleElement.length && $contentElement.length) {
    const extractedTitle = $titleElement.text().trim(); // Sử dụng text() thay cho html()
    const extractedContent = $contentElement.html().trim();

    // Sử dụng Showdown để chuyển đổi HTML sang Markdown
    let contentMd;
    try {
      const converter = new showdown.Converter(); // Tạo đối tượng converter
      contentMd = converter.makeMarkdown(extractedContent, document); // Chuyển đổi HTML sang Markdown
    } catch (error) {
      console.error("Lỗi khi chuyển đổi sang Markdown:", error);
      contentMd = "Lỗi khi chuyển đổi Markdown";
    }

    // Gọi các hàm xử lý Markdown
    contentMd = updateHeaderLevel(contentMd);
    contentMd = removeAllHtmlTag(contentMd);
    contentMd = removeMultipleEndline(contentMd);

    return {
      url: currentUrl,
      title: extractedTitle,
      content: contentMd
    };
  } else {
    console.error("Không thể tìm thấy nội dung hoặc tiêu đề trên trang này.");
    return { url: currentUrl, title: null, content: null };
  }
}

async function copyToClipboard(content) {
  try {
    await navigator.clipboard.writeText(content);
    return true; // Sao chép thành công
  } catch (err) {
    console.error("Lỗi khi sao chép vào clipboard:", err);
    return false; // Sao chép thất bại
  }
}
