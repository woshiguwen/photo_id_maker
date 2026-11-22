# 照相馆 · 证件照工坊

一个无需登录、无需上传照片的浏览器端证件照编辑器。使用 React、TypeScript、Vite 和 Konva 构建。

## 开发

```bash
npm install
npm run dev
```

## 功能

- 导入本地 JPG、PNG、WebP 图片；支持拖放。
- 小一寸、标准一寸、大一寸、1.5 寸（33 × 48 mm）、小二寸、标准二寸和自定义尺寸裁剪；表格预设同时提供 mm、cm 和 pixel 单位，并显示厘米尺寸、300 DPI 像素尺寸及常见用途。
- 拖动、缩放和旋转照片，旋转时显示网格辅助对齐；确定裁剪后进入照片调整和排版。
- 色相、色温、亮度和对比度调整。
- 通过吸管采样背景，使用 CIELAB 感知色差和可调宽容度替换白、蓝、红、浅蓝或自定义底色；支持画笔手动擦除残留背景，笔迹可撤销并同步导出。
- 画布支持 50%–200% 预览缩放，缩放控件不改变照片裁剪和导出尺寸。
- 自动计算 5 寸、6 寸、7 寸、A4 和自定义相纸的照片数量；支持横向/纵向，照片组在相纸上居中排列，预览数量与导出排布一致。
- 自定义相纸尺寸范围为 30–300 mm。
- 页面支持简体中文、英语、繁体中文、日语和韩语，可在右上角切换语言；选择会保存在当前浏览器中。
- 单张照片及相纸排版可导出为 PNG、JPG 或 WebP；按 300 DPI 计算像素尺寸。
- 裁剪与照片调整支持撤销；根据屏幕宽度切换桌面和手机布局。

照片仅在本地浏览器内处理，不会上传，也不依赖外部字体服务。背景替换根据采样颜色的 CIELAB 感知色差，从照片边缘开始识别连续背景区域，并提供宽容度与限定在照片区域内的手动擦除工具；复杂场景、发丝边缘和与背景相近且连通的衣物仍可能需要更专业的分割工具。导出像素尺寸按 300 DPI 计算；浏览器生成文件的分辨率元数据可能不同，冲印时请选择“实际尺寸”，并确认打印尺寸。

## Docker 部署

以下步骤针对 **Debian 13、服务器已有 Nginx、80/443 正在服务其他网站** 的部署方式。容器只监听服务器本机的 `127.0.0.1:8080`，外部请求由 Nginx 根据域名转发；不要把容器端口直接开放到公网，也不要覆盖其他网站的 Nginx 配置。

### 1. DNS 指向服务器

在域名 DNS 管理处添加 `id.coyer.top` 的 `A` 记录，指向服务器公网 IPv4 地址。如果服务器配置了公网 IPv6，再添加正确的 `AAAA` 记录。等待 DNS 生效后继续。

### 2. 安装 Docker 和 Compose 插件

如果服务器尚未安装 Docker，使用 Docker 官方 Debian 软件源安装 Engine 与 Compose 插件：

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker compose version
```

服务器需要能访问 Docker 官方软件源，并且 80/443 防火墙规则保持现状。无需为本应用新增公网端口规则。

### 3. 从 GitHub 拉取并启动网站容器

以下示例把代码放在 `/opt/photo_id_maker`。如果代码仓库为私有仓库，请先配置服务器的 GitHub SSH Key 或其他只读拉取凭据。

```bash
sudo mkdir -p /opt/photo_id_maker
sudo chown "$USER":"$(id -gn)" /opt/photo_id_maker
git clone https://github.com/woshiguwen/photo_id_maker.git /opt/photo_id_maker
cd /opt/photo_id_maker
```

默认端口为 `8080`。如果该端口已被占用，创建本地 `.env` 并改用空闲端口；`.env` 不会提交到 Git：

```bash
printf 'PORT=8080\n' > .env
```

启动并构建：

```bash
sudo docker compose up -d --build
sudo docker compose ps
curl -I http://127.0.0.1:8080
```

最后一条命令应返回 `HTTP/1.1 200 OK`。如使用其他端口，下面 Nginx 配置中的 `8080` 也要改成相同端口。

### 4. 在现有 Nginx 中添加域名转发

仓库提供了一个只针对 `id.coyer.top` 的 HTTP 反向代理配置：[deploy/nginx-id.coyer.top.conf](./deploy/nginx-id.coyer.top.conf)。在 Debian 常见的 `sites-available` 布局下安装并启用它：

```bash
sudo cp deploy/nginx-id.coyer.top.conf /etc/nginx/sites-available/id.coyer.top
sudo ln -s /etc/nginx/sites-available/id.coyer.top /etc/nginx/sites-enabled/id.coyer.top
sudo nginx -t
sudo systemctl reload nginx
```

这会增加新的 `server_name id.coyer.top`，不会替换现有网站配置。若你的 Nginx 使用 `conf.d` 或其他配置目录，把同一配置文件放到该目录并确保主配置包含它；若该站点链接已存在，不要重复执行 `ln -s`。

此时可先通过 `http://id.coyer.top` 检查域名转发。如果无法访问，检查 DNS 是否已指向本机、80 端口是否可达，以及 `curl -I http://127.0.0.1:8080` 是否成功。

### 5. 为新域名启用 HTTPS

若服务器的 Certbot 已安装并使用 Nginx 插件，为该域名单独签发证书并配置 HTTPS：

```bash
sudo certbot --nginx -d id.coyer.top
sudo nginx -t
sudo systemctl reload nginx
```

按提示选择将 HTTP 重定向至 HTTPS。若还未安装 Certbot，可在 Debian 13 上执行：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d id.coyer.top
```

证书签发要求 DNS 已解析到本服务器，并且外部可访问服务器的 80 端口。完成后访问 `https://id.coyer.top`。如果现有 Nginx/证书由其他面板或 ACME 客户端管理，请继续使用原有证书管理方式，不要让多个工具同时改写同一个站点配置。

### 6. 后续更新代码

每次发布后在服务器执行：

```bash
cd /opt/photo_id_maker
git pull --ff-only
sudo docker compose up -d --build
sudo docker compose ps
```

Nginx 仍然转发到同一个本机端口，通常不需要重载 Nginx。查看应用日志：

```bash
sudo docker compose logs -f photo-id-maker
```

停止应用容器但保留代码：

```bash
cd /opt/photo_id_maker
sudo docker compose down
```

Docker 使用多阶段构建：Node.js 阶段安装依赖并生成静态资源，Nginx 容器只发布构建产物；应用无需后端、数据库或持久化存储。

## 构建

```bash
npm run build
npm run lint
```
