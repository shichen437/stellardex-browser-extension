import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 复制文件到 dist 目录
function copyFiles() {
  return {
    name: 'copy-files',
    closeBundle() {
      // 复制 manifest.json
      fs.copyFileSync('manifest.json', 'dist/manifest.json');
      
      // 确保目标目录存在
      fs.ensureDirSync('dist/assets/icons');
      fs.ensureDirSync('dist/locales');
      
      // 复制图标文件
      fs.copySync('assets/icons', 'dist/assets/icons', {
        overwrite: true
      });

      // 复制本地化文件
      fs.copySync('locales', 'dist/locales', {
        overwrite: true
      });

      console.log('Copied manifest.json, icons and locales to dist directory');
    }
  };
}

export default defineConfig({
  plugins: [react(), copyFiles()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/popup.html'),
        background: resolve(__dirname, 'background/background.js')
      },
      output: {
        entryFileNames: '[name]/[name].js',
        chunkFileNames: '[name]/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          } else if (/woff|woff2/.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name][extname]`;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    },
  },
});