# 🛠️ Building Executables with `node-tls-client` using `nexe`

> [!WARNING]  
> Prebuilt binaries for Node.js **v20 and later are not available** in `nexe` or `pkg`. You must build from source using the `--build` flag.

---

### 🔧 Build Script (Linux, Node.js v20.0.0):
```bash
nexe app.js -t linux-x64-20.0.0 --build
```

---

### 🔍 Breakdown of Command

| Flag                  | Description                                                 |
|-----------------------|-------------------------------------------------------------|
| `app.js`              | Your Node.js entry script                                   |
| `-t linux-x64-20.0.0` | Target platform: Linux, 64-bit, Node.js v20.0.0             |
| `--build`             | Builds Node.js from source (required for v20+, no prebuilts)|

---

> [!NOTE]  
> Replace the target triple if you're building for other platforms (e.g., `windows-x64-20.0.0`, `macos-x64-20.0.0`).