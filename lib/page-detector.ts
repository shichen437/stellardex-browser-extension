export async function isArticlePage(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]?.id) {
        resolve(false);
        return;
      }

      const url = tabs[0].url;
      if (!url || !(/^https?:\/\//i.test(url))) {
        resolve(false);
        return;
      }

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => {
            function checkMetadata(): boolean {
              if (document.querySelector('article')) {
                return true;
              }
            
              const metaTags = document.getElementsByTagName('meta');
              for (const meta of metaTags) {
                if (meta.getAttribute('property') === 'og:type' && meta.getAttribute('content') === 'article') {
                  return true;
                }
                if (meta.getAttribute('property') === 'article:published_time') {
                  return true;
                }
              }
            
              return false;
            }
            
            function checkUrlAndLayout(): boolean {
              const url = window.location.href;
              const urlPatterns = [
                /\/article\//,
                /\/post\//,
                /\/blog\//,
                /\/news\//,
                /\d{4}\/\d{2}\/\d{2}/,
              ];
            
              if (urlPatterns.some(pattern => pattern.test(url))) {
                return true;
              }
            
              const hasHeader = document.querySelector('header, .header, #header');
              const hasContent = document.querySelector('main, .content, #content, .post-content, .article-content');
              const hasFooter = document.querySelector('footer, .footer, #footer');
            
              return !!(hasHeader && hasContent && hasFooter);
            }
            
            function checkDomStructure(): boolean {
              const articleContainers = [
                'article',
                '.post',
                '.article',
                '.blog-post',
                '.entry-content',
                '.post-content',
                '.article-content'
              ];
            
              for (const selector of articleContainers) {
                const container = document.querySelector(selector);
                if (container) {
                  const textLength = container.textContent?.length || 0;
                  if (textLength > 300) {
                    return true;
                  }
            
                  const paragraphs = container.querySelectorAll('p');
                  if (paragraphs.length > 2) {
                    return true;
                  }
                }
              }
            
              return false;
            }

            return checkMetadata() || checkUrlAndLayout() || checkDomStructure();
          }
        });

        resolve(results[0]?.result || false);
      } catch (error) {
        console.error('Failed to detect article page:', error);
        resolve(false);
      }
    });
  });
}