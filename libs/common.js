// Tệp: libs/common.js

// Cập nhật cấp độ tiêu đề Markdown
function updateHeaderLevel(contentMd) {
  const lines = contentMd.split("\n");
  const updatedLines = [];
  let minHeaderLevel = Infinity;

  lines.forEach((line) => {
    const match = line.match(/^(#+)\s/);
    if (match) {
      const headerLevel = match[1].length;
      minHeaderLevel = Math.min(minHeaderLevel, headerLevel);
    }
  });

  const baseLevel = 2;
  lines.forEach((line) => {
    const match = line.match(/^(#+)\s/);
    if (match) {
      const headerLevel = match[1].length;
      const adjustedLevel = headerLevel - minHeaderLevel + baseLevel;
      updatedLines.push(`${"#".repeat(adjustedLevel)}${line.slice(headerLevel)}`);
    } else {
      updatedLines.push(line);
    }
  });

  return updatedLines.join("\n");
}

function removeHtmlTag(contentMd) {
  const tags = ["button", "script", "style"]; // Các tag cần loại bỏ

  // Tạo DOM parser để xử lý HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentMd, "text/html");

  // Duyệt qua tất cả các thẻ trong danh sách `tags`
  tags.forEach(tag => {
    const elements = doc.body.querySelectorAll(tag); // Tìm tất cả các thẻ thuộc `tag`
    elements.forEach(el => {
      // Skip nếu thẻ nằm trong <code>
      if (el.closest("code")) {
        return; // Bỏ qua xử lý
      }
      el.remove(); // Loại bỏ thẻ
    });
  });

  // Trả về HTML đã xử lý
  return doc.body.innerHTML;
}

function removeAllHtmlTag(contentMd) {
  const excludeTags = ["precode", "pre", "code"]; // Các thẻ không bị loại bỏ

  // Biến lưu trạng thái nếu đang trong thẻ <code>
  let insideCodeBlock = false;

  return contentMd.replace(/<\/?[^>]*>/g, (match) => {
    // Kiểm tra nếu thẻ là <code> hoặc </code> để cập nhật trạng thái
    if (match.match(/^<code\b/)) {
      insideCodeBlock = true;
    } else if (match.match(/^<\/code>/)) {
      insideCodeBlock = false;
    }

    // Bỏ qua xử lý nếu đang trong thẻ <code>
    if (insideCodeBlock) {
      return match;
    }

    // Kiểm tra nếu thẻ thuộc excludeTags
    const tagMatch = match.match(/^<\/?([a-zA-Z0-9]+)\b/); // Lấy tên thẻ
    if (tagMatch && excludeTags.includes(tagMatch[1].toLowerCase())) {
      return match; // Giữ nguyên thẻ nếu thuộc danh sách excludeTags
    }

    // Xử lý đặc biệt cho thẻ <img>
    const imgMatch = match.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/);
    if (imgMatch) {
      const src = imgMatch[1];
      return `<img src="${src}" width="60%">`;
    }

    // Loại bỏ các thẻ khác
    return "";
  });
}

// Loại bỏ các đoạn xuống dòng liên tiếp (3 lần trở lên)
function removeMultipleEndline(contentMd) {
  return contentMd.replace(/\n{3,}/g, "\n\n");
}

// Phân tích nội dung HTML và chuyển đổi sang Markdown
function parseContentMD(contentHtml, contentUrl = null) {
  const currentUrl = contentUrl || window.location.href;
  const siteConfig = siteConfigs.find(config => currentUrl.startsWith(config.url));

  if (!siteConfig) {
    console.error("Không tìm thấy cấu hình cho URL:", currentUrl);
    return { url: currentUrl, title: null, content: null };
  }

  const { content, title } = siteConfig;
  const $html = $("<div>").html(contentHtml);
  const $titleElement = $html.find(title);
  const $contentElement = $html.find(content);

  if ($titleElement.length && $contentElement.length) {
    const extractedTitle = $titleElement.text().trim();
    let extractedContent = $contentElement.html().trim();
    extractedContent = unwrapSpanInCode(extractedContent)
    extractedContent = removeHtmlTag(extractedContent)
    extractedContent = removeAttr(extractedContent)
    extractedContent = removeDiv(extractedContent)
    
    let contentMd;
    try {
      const converter = new showdown.Converter({
        ghCodeBlocks: true,          // Hỗ trợ khối mã dạng GitHub-style (```)
        omitExtraWLInCodeBlocks: false,
        simpleLineBreaks: true,      // Hỗ trợ xuống dòng đơn giản
        noHeaderId: true,            // Không tự thêm ID vào tiêu đề
        tables: true,                // Hỗ trợ bảng
        strikethrough: true,         // Hỗ trợ gạch ngang
        tasklists: true,              // Hỗ trợ danh sách công việc
      });
      contentMd = converter.makeMarkdown(extractedContent);
    } catch (error) {
      console.error("Lỗi khi chuyển đổi sang Markdown:", error);
      contentMd = "Lỗi khi chuyển đổi Markdown";
    }

    contentMd = updateHeaderLevel(contentMd);
    // contentMd = removeAllHtmlTag(contentMd);
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

// Sao chép nội dung vào clipboard
async function copyToClipboard(content) {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error("Lỗi khi sao chép vào clipboard:", err);
    return false;
  }
}

function removeAttr(contentHtml) {
  /**
   * contentHtml: string có định dạng HTML.
   * Loại bỏ tất cả các attr trong các thẻ, trừ `src` và `href`.
   * Skip xử lý cho các thẻ thuộc `excludeTags`.
   */
  // Tạo DOM parser để xử lý HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentHtml, "text/html");

  const excludeTags = ["code"]; // Các thẻ không bị xử lý

  // Duyệt qua tất cả các phần tử trong tài liệu
  doc.body.querySelectorAll("*").forEach((el) => {
    // Lấy tên thẻ (lowercase để so khớp chính xác)
    const tagName = el.tagName.toLowerCase();

    // Skip nếu thẻ thuộc excludeTags hoặc nằm trong <code>
    if (excludeTags.includes(tagName) || el.closest("code")) {
      return;
    }

    // Lấy danh sách tất cả các attr của phần tử
    const attributes = Array.from(el.attributes);

    // Loại bỏ tất cả các attr, trừ `src` và `href`
    attributes.forEach(attr => {
      if (attr.name !== "src" && attr.name !== "href") {
        el.removeAttribute(attr.name);
      }
    });
  });

  // Trả về HTML đã xử lý từ body
  return doc.body.innerHTML;
}

function unwrapSpanInCode(contentHtml) {
  /**
   * contentHtml: string có định dạng HTML.
   * Unwrap tất cả các tag <span> trong các thẻ <code>.
   */
  // Tạo DOM parser để xử lý HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentHtml, "text/html");

  // Lấy tất cả các thẻ <code>
  const codeElements = doc.querySelectorAll("code");

  // Duyệt qua từng thẻ <code>
  codeElements.forEach((codeElement) => {
    // Lấy tất cả các thẻ <span> bên trong <code>
    const spanElements = codeElement.querySelectorAll("span");

    // Unwrap từng <span>
    spanElements.forEach((spanElement) => {
      while (spanElement.firstChild) {
        spanElement.parentNode.insertBefore(spanElement.firstChild, spanElement);
      }
      spanElement.remove(); // Xóa thẻ <span>
    });
  });

  // Trả về HTML đã xử lý
  return doc.body.innerHTML;
}

function removeDiv(contentHtml) {
  /**
   * Skip xử lý đối với các element thuộc thẻ <code>.
   * Unwrap các thẻ <div>.
   * contentHtml: string có định dạng HTML.
   */
  // Tạo DOM parser để xử lý HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(contentHtml, "text/html");

  // Tìm tất cả các thẻ <div>
  const divElements = doc.body.querySelectorAll("div");

  // Duyệt qua từng thẻ <div>
  divElements.forEach(div => {
    // Kiểm tra nếu thẻ <div> nằm bên trong thẻ <code>, bỏ qua xử lý
    if (div.closest("code")) {
      return; // Skip xử lý
    }

    // Unwrap thẻ <div>
    while (div.firstChild) {
      div.parentNode.insertBefore(div.firstChild, div); // Di chuyển các child nodes ra ngoài
    }
    div.remove(); // Xóa thẻ <div>
  });

  // Trả về HTML đã xử lý từ body
  return doc.body.innerHTML;
}