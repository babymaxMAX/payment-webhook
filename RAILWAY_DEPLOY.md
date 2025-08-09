# 🚀 Деплой на Railway.app - Пошаговая инструкция

## Почему Railway?
✅ Работает с российскими пользователями
✅ Простой деплой через GitHub  
✅ Бесплатный план на старте
✅ Автоматические обновления
✅ Постоянный URL

## 📋 Пошаговая инструкция:

### 1️⃣ Подготовка GitHub репозитория

**Если у вас нет GitHub аккаунта:**
1. Создайте: https://github.com/join
2. Подтвердите email

**Создайте репозиторий:**
1. Перейдите: https://github.com/new
2. Название: `payment-webhook`
3. Публичный репозиторий
4. Нажмите "Create repository"

**Загрузите код (выполните в терминале):**
```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/payment-webhook.git
git branch -M main
git push -u origin main
```

### 2️⃣ Регистрация на Railway

1. Перейдите: https://railway.app/
2. Нажмите "Login" 
3. Выберите "Login with GitHub"
4. Разрешите доступ

### 3️⃣ Создание проекта

1. **На главной Railway нажмите:** "New Project"
2. **Выберите:** "Deploy from GitHub repo"
3. **Найдите:** `payment-webhook`
4. **Нажмите:** "Deploy Now"

### 4️⃣ Настройка переменных окружения

1. **В проекте перейдите во вкладку:** "Variables"
2. **Добавьте переменные:**

```
WEBHOOK_SECRET = ваш_секретный_ключ_от_платежной_системы
PORT = 3000
```

*(Опционально можно добавить ALLOWED_IPS и ALLOWED_ORIGINS)*

### 5️⃣ Получение URL

1. **Перейдите во вкладку:** "Settings"
2. **В разделе "Networking"** нажмите "Generate Domain"
3. **Получите URL вида:** `https://payment-webhook-production-xxxx.up.railway.app`

## 🎯 Ваш Webhook URL:

```
https://ваш-домен.up.railway.app/webhook/payment
```

**Этот URL указывайте в платежной системе!**

## 🧪 Проверка работы

1. **Health Check:**
   ```
   https://ваш-домен.up.railway.app/health
   ```

2. **Информация о сервисе:**
   ```
   https://ваш-домен.up.railway.app/webhook/info
   ```

## 🔄 Автоматические обновления

При изменении кода в GitHub:
```bash
git add .
git commit -m "Update webhook"
git push origin main
```

Railway автоматически развернет обновления!

## 💰 Стоимость

- **Бесплатно:** 500 часов в месяц
- **Платный план:** от $5/месяц
- **Для простого webhook:** бесплатного плана хватит

## 🆘 Если что-то не работает

1. **Проверьте логи** в Railway Dashboard
2. **Убедитесь** что все переменные настроены
3. **Проверьте** что репозиторий публичный
