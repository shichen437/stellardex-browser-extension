import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Settings, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useConnection } from "@/lib/api";
import { waitForTranslations } from "@/lib/i18n";
import { getTheme, applyTheme, watchSystemTheme } from "@/lib/theme";
import { isArticlePage } from "@/lib/page-detector";
import "@/styles/globals.css";
import { t } from "@/lib/i18n";

function ConnectionForm({
  onSuccess,
  initialUrl,
  initialApiKey,
}: {
  onSuccess?: () => void;
  initialUrl?: string;
  initialApiKey?: string;
}) {
  const [url, setUrl] = useState(initialUrl || "");
  const [apiKey, setApiKey] = useState(initialApiKey || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setConnection = useConnection(
    (state: {
      setConnection: (url: string, apiKey: string) => Promise<void>;
    }) => state.setConnection
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await setConnection(url, apiKey);
      onSuccess?.();
    } catch (err) {
      setError(t("error.connection"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium mb-1 text-muted-foreground"
          >
            {t("connect.fields.url")}
          </label>
          <Input
            id="url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium mb-1 text-muted-foreground"
          >
            {t("connect.fields.apiKey")}
          </label>
          <Input
            id="apiKey"
            type="password"
            placeholder={t("connect.placeholder.apiKey")}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="min-h-5">
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("connect.loading")}
          </>
        ) : (
          t("connect.submit")
        )}
      </Button>
    </form>
  );
}

function BookmarkForm() {
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isArticle, setIsArticle] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { url, apiKey, saveBookmark } = useConnection();
  const isConnected = useConnection(
    (state: { isConnected: boolean }) => state.isConnected
  );

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.title) {
        setTitle(tabs[0].title);
      }
      const articleDetected = await isArticlePage();
      setIsArticle(articleDetected);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.url) {
        throw new Error(t("error.getPageUrl"));
      }

      const [{ result: content }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => {
          return new Promise((resolve) => {
            const checkContent = () => {
              const article = document.querySelector("article");
              const mainContent =
                document.querySelector(".article-content") ||
                document.querySelector(".post-content") ||
                document.querySelector("main");
              return article?.textContent || mainContent?.textContent;
            };

            const initialContent = checkContent();
            if (initialContent) {
              resolve(document.documentElement.outerHTML);
              return;
            }

            // 设置超时时间
            const timeout = setTimeout(() => {
              observer.disconnect();
              resolve(document.documentElement.outerHTML);
            }, 5000);

            // 使用 MutationObserver 监听内容变化
            const observer = new MutationObserver(() => {
              const content = checkContent();
              if (content) {
                clearTimeout(timeout);
                observer.disconnect();
                resolve(document.documentElement.outerHTML);
              }
            });

            observer.observe(document.body, {
              childList: true,
              subtree: true,
            });
          });
        },
      });

      await saveBookmark(title, label, tab.url, content?.toString() || "");
      setSuccess(true);
      setLabel("");
    } catch (err: any) {
      setError(err?.message || t("error.save"));
      if (err?.message === "Unauthorized") {
        useConnection.getState().resetConnection();
        setShowSettings(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSettings) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("setting")}</h2>
          {isConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              {t("back")}
            </Button>
          )}
        </div>
        <ConnectionForm
          onSuccess={() => setShowSettings(false)}
          initialUrl={url}
          initialApiKey={apiKey}
        />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <div>
          <label
            htmlFor="bookmark-title"
            className="block text-sm font-medium mb-1 text-muted-foreground"
          >
            {t("bookmark.fields.title")}
          </label>
          <Input
            id="bookmark-title"
            type="text"
            placeholder={t("bookmark.placeholder.title")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="bookmark-label"
            className="block text-sm font-medium mb-1 text-muted-foreground"
          >
            {t("bookmark.fields.label")}
          </label>
          <Input
            id="bookmark-label"
            type="text"
            placeholder={t("bookmark.placeholder.label")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 min-h-8">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && (
          <p className="text-sm text-green-500">{t("bookmark.success")}</p>
        )}
        {isArticle === false && (
          <p className="text-sm text-yellow-500">{t("error.notArticlePage")}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isArticle === false || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("bookmark.loading")}
          </>
        ) : (
          t("bookmark.save")
        )}
      </Button>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="text-sm text-muted-foreground truncate max-w-[220px]">
          {url}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowSettings(true)}
          title={t("setting")}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

function Popup() {
  const [isLoaded, setIsLoaded] = useState(false);
  const isConnected = useConnection(
    (state: { isConnected: boolean }) => state.isConnected
  );

  useEffect(() => {
    Promise.all([
      getTheme().then((theme) => {
        applyTheme(theme);
      }),
      waitForTranslations(),
    ]).then(() => {
      setIsLoaded(true);
    });

    // 监听系统主题变化
    watchSystemTheme();
  }, []);

  if (!isLoaded) {
    return (
      <div className="w-[320px] h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-[320px] p-4 bg-popover">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Stellardex</h1>
          <ThemeToggle />
        </div>
        {isConnected ? <BookmarkForm /> : <ConnectionForm />}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
