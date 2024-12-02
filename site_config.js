const siteConfigs = [
  {
    url: "https://viblo.asia/",
    content: "div.md-contents",
    title: "h1.article-content__title",
    exclude: []
  },
  {
    url: "https://fxstudio.dev/",
    content: "div[class='post-article post-format']",
    title: "h1[class='title page-title']",
    exclude: [
      "div.post-info",
      "div.code-block.code-block-2",
      "#ez-toc-container",
      "div.fb-background-color",
      "style",
      "div[class='shared-counts-wrap after_content style-fancy']",
      "div.crp_related",
      "footer",
      "div.author-box",
      "div.clear",
      "div.contact-form"
    ]
  }
];