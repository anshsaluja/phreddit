
export function parseMarkdownLinks(text) {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let isValid = true;
    let errors = [];
  

    const invalidPattern = /\[[^\]]*\]\((?!https?:\/\/)/g;
    if (invalidPattern.test(text)) {
      isValid = false;
      errors.push("Invalid hyperlink format. URLs must start with http:// or https://.");
    }
  

    const emptyParts = /\[\]\((.*?)\)|\[([^\]]+)\]\(\)/g;
    if (emptyParts.test(text)) {
      isValid = false;
      errors.push("Hyperlink text and URL must not be empty.");
    }
  

    const parsedText = text.replace(regex, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
    return { parsedText, isValid, errors };
  }
  