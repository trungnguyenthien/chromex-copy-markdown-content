// Tệp: libs/common.js

// Cập nhật cấp độ tiêu đề Markdown
export function updateHeaderLevel(contentMd) {
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

// Loại bỏ các thẻ HTML khỏi nội dung Markdown
export function removeAllHtmlTag(contentMd) {
  return contentMd.replace(/<[^>]*>/g, (match) => {
    const imgMatch = match.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/);
    if (imgMatch) {
      const src = imgMatch[1];
      return `<img src="${src}" width="60%">`;
    }
    return "";
  });
}

// Loại bỏ các đoạn xuống dòng liên tiếp (3 lần trở lên)
export function removeMultipleEndline(contentMd) {
  return contentMd.replace(/\n{3,}/g, "\n\n");
}

// Phân tích nội dung HTML và chuyển đổi sang Markdown
export function parseContentMD(contentHtml, contentUrl = null) {
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
    const extractedContent = $contentElement.html().trim();

    let contentMd;
    try {
      const converter = new showdown.Converter();
      contentMd = converter.makeMarkdown(extractedContent, document);
    } catch (error) {
      console.error("Lỗi khi chuyển đổi sang Markdown:", error);
      contentMd = "Lỗi khi chuyển đổi Markdown";
    }

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

// Sao chép nội dung vào clipboard
export async function copyToClipboard(content) {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error("Lỗi khi sao chép vào clipboard:", err);
    return false;
  }
}
