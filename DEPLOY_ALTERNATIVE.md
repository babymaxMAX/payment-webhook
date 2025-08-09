# 🚀 Альтернативный способ деплоя на Heroku (без CLI)

## Метод 1: Через GitHub + Heroku Dashboard

### 1️⃣ Загрузите код на GitHub

1. **Создайте репозиторий на GitHub:**
   - Перейдите на: https://github.com/new
   - Назовите репозиторий: `payment-webhook`
   - Нажмите "Create repository"

2. **Загрузите ваш код:**
   ```bash
   # В папке payment-webhook выполните:
   git remote add origin https://github.com/YOUR_USERNAME/payment-webhook.git
   git branch -M main
   git push -u origin main
   ```

### 2️⃣ Создайте приложение на Heroku

1. **Перейдите на:** https://dashboard.heroku.com/
2. **Зарегистрируйтесь/войдите**
3. **Нажмите "New" → "Create new app"**
4. **Введите имя приложения:** `your-webhook-name` (или оставьте автоматическое)
5. **Выберите регион:** United States или Europe
6. **Нажмите "Create app"**

### 3️⃣ Подключите GitHub

1. **В разделе "Deploy":**
   - Выберите "GitHub" как Deployment method
   - Подключите ваш GitHub аккаунт
   - Найдите репозиторий `payment-webhook`
   - Нажмите "Connect"

2. **Включите автоматический деплой:**
   - Поставьте галочку "Enable Automatic Deploys"
   - Выберите ветку `main`

### 4️⃣ Настройте переменные окружения

1. **Перейдите в раздел "Settings"**
2. **Нажмите "Reveal Config Vars"**
3. **Добавьте переменные:**
   ```
   KEY: WEBHOOK_SECRET
   VALUE: your_secret_from_payment_system
   
   KEY: ALLOWED_IPS
   VALUE: 192.168.1.1,10.0.0.1 (опционально)
   
   KEY: ALLOWED_ORIGINS  
   VALUE: https://yourdomain.com (опционально)
   ```

### 5️⃣ Запустите деплой

1. **В разделе "Deploy"**
2. **Нажмите "Deploy Branch"**
3. **Дождитесь завершения**

## Метод 2: Heroku Button (одним кликом)

### 🚀 Быстрый деплой через кнопку

1. **Добавьте этот файл в репозиторий:** `app.json` (уже создан)

2. **Создайте кнопку в README:**
   ```markdown
   [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
   ```

3. **Нажмите кнопку → автоматический деплой**

## 🎯 Результат

После любого из методов вы получите:

**Ваш постоянный Webhook URL:**
```
https://your-app-name.herokuapp.com/webhook/payment
```

**Endpoints для проверки:**
- Health check: `https://your-app-name.herokuapp.com/health`
- Info: `https://your-app-name.herokuapp.com/webhook/info`

## 🔧 Обновления

При изменении кода:
```bash
git add .
git commit -m "Update webhook"
git push origin main
```

Heroku автоматически развернет обновления!

## 💡 Преимущества

✅ Не нужно устанавливать CLI
✅ Автоматические обновления из GitHub
✅ Простое управление через веб-интерфейс
✅ Тот же результат - постоянный webhook URL
