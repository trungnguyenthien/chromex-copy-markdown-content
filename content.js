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