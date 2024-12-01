(function () {
  const currentUrl = window.location.href;

  // Tìm config phù hợp với URL hiện tại
  const siteConfig = siteConfigs.find(config => currentUrl.startsWith(config.url));

  if (siteConfig) {
    // Tạo button sử dụng jQuery
    const $button = $("<button>")
      .text("Get Markdown Content")
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
        const { content, title } = siteConfig;

        // Lấy nội dung và tiêu đề sử dụng jQuery
        const $titleElement = $(title);
        const $contentElement = $(content);

        if ($titleElement.length && $contentElement.length) {
          const extractedTitle = $titleElement.text().trim(); // Sử dụng text() thay cho html()
          const extractedContent = $contentElement.html().trim();
          // TODO: Sử dụng Showdown để chuyển đổi HTML sang Markdown
          let contentMd;
          try {
            const converter = new showdown.Converter(); // Tạo đối tượng converter
            contentMd = converter.makeMarkdown(extractedContent, document); // Chuyển đổi HTML sang Markdown
          } catch (error) {
            console.error("Lỗi khi chuyển đổi sang Markdown:", error);
            contentMd = "Lỗi khi chuyển đổi Markdown";
          }
          // // Log ra console
          contentMd = updateHeaderLevel(contentMd)
          let fullContentMD = `# ${extractedTitle}\n${contentMd}`
          console.log(fullContentMD)
        } else {
          alert("Không thể tìm thấy nội dung hoặc tiêu đề trên trang này.");
        }
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
