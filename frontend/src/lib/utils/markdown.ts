import { marked } from "marked";
import hljs from "highlight.js";
import React from "react";

// 必选：代码高亮样式
import "highlight.js/styles/github-dark.min.css";

// 配置marked（只初始化一次）
marked.use({
    renderer: {
        code(token: any) {
            try {
                const text = token.text;
                const lang = token.lang;
                const language = hljs.getLanguage(lang || "")
                    ? lang || ""
                    : "plaintext";
                const highlightedCode = hljs.highlight(text, {
                    language,
                }).value;

                // 生成语言标签
                const langLabel = lang
                    ? lang.charAt(0).toUpperCase() + lang.slice(1)
                    : "Plain Text";

                // 构建带有语言标签、复制按钮和展开/收起功能的代码块
                // 使用 data 属性存储代码内容，避免引号转义问题
                const escapedCode = text
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
                return `<div class="code-block-container"><div class="code-block-header"><div class="code-block-language-container"><span class="code-block-language">${langLabel}</span><button class="code-block-toggle" aria-label="Toggle code block">▼</button></div><button class="code-block-copy" data-code="${escapedCode}">Copy</button></div><pre class="hljs"><code class="language-${language}">${highlightedCode}</code></pre></div>`;
            } catch (err) {
                return `<pre><code>${token.text}</code></pre>`;
            }
        },
    },
});

/**
 * 将Markdown转换为React元素
 * @param markdown Markdown字符串
 * @returns 转换后的React元素
 */
export function markdownToReact(markdown: string): React.ReactElement {
    if (!markdown) return React.createElement("div");

    // 解析markdown（使用同步版本）
    const html = marked.parse(markdown) as string;

    return React.createElement("div", {
        dangerouslySetInnerHTML: {
            __html: html,
        },
    });
}

/**
 * 将Markdown转换为HTML
 * @param markdown Markdown字符串
 * @returns 转换后的HTML字符串
 */
export function markdownToHtml(markdown: string): string {
    if (!markdown) return "";

    // 解析markdown（使用同步版本）
    return marked.parse(markdown) as string;
}
