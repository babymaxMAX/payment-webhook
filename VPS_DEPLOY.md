# 🛠️ Деплой на собственный VPS - Полный контроль

## Когда выбрать VPS?
✅ Нужен полный контроль
✅ Хотите минимальную стоимость
✅ Планируете масштабирование
✅ Нужна максимальная надежность

## 🇷🇺 Российские VPS провайдеры

### Рекомендуемые:
1. **TimeWeb** - от 199₽/мес, простая панель
2. **Selectel** - от 250₽/мес, надежные
3. **RuVDS** - от 200₽/мес, быстрые
4. **Beget** - от 180₽/мес, хорошая поддержка

## 📋 Пошаговый деплой на VPS:

### 1️⃣ Заказ VPS

**Минимальные требования:**
- **RAM:** 512MB (рекомендуется 1GB)
- **SSD:** 10GB
- **OS:** Ubuntu 20.04/22.04

### 2️⃣ Подключение к серверу

```bash
# Подключение по SSH
ssh root@ваш-ip-адрес
```

### 3️⃣ Установка Node.js

```bash
# Обновление системы
apt update && apt upgrade -y

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Проверка
node --version
npm --version
```

### 4️⃣ Установка дополнительных пакетов

```bash
# Git, PM2, Nginx
apt install git nginx -y
npm install -g pm2

# Настройка firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

### 5️⃣ Загрузка проекта

```bash
# Создание пользователя для приложения
adduser webhook
usermod -aG sudo webhook
su webhook
cd /home/webhook

# Клонирование проекта
git clone https://github.com/ВАШ_ЛОГИН/payment-webhook.git
cd payment-webhook

# Установка зависимостей
npm install
```

### 6️⃣ Настройка переменных окружения

```bash
# Создание .env файла
nano .env
```

Содержимое .env:
```
PORT=3000
WEBHOOK_SECRET=ваш_секретный_ключ
NODE_ENV=production
```

### 7️⃣ Запуск с PM2

```bash
# Запуск приложения
pm2 start server.js --name webhook

# Автозапуск при перезагрузке
pm2 startup
pm2 save
```

### 8️⃣ Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/webhook
```

Конфигурация Nginx:
```nginx
server {
    listen 80;
    server_name ваш-домен.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Активация сайта
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9️⃣ SSL сертификат (HTTPS)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d ваш-домен.ru
```

## 🎯 Результат

**Ваш webhook URL:**
```
https://ваш-домен.ru/webhook/payment
```

## 🔄 Обновление кода

```bash
cd /home/webhook/payment-webhook
git pull origin main
npm install
pm2 restart webhook
```

## 📊 Мониторинг

```bash
# Логи приложения
pm2 logs webhook

# Статус
pm2 status

# Мониторинг системы
htop
```

## 💰 Примерная стоимость

- **VPS:** 200-500₽/месяц
- **Домен:** 200-500₽/год
- **Итого:** ~300₽/месяц

## ✅ Преимущества VPS

- Полный контроль
- Максимальная производительность
- Можно разместить несколько проектов
- Собственные базы данных
- Custom конфигурации
