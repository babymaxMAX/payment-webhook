# 🚀 Деплой на Heroku - Пошаговая инструкция

## 📋 Что нужно сделать:

### 1️⃣ Установить Heroku CLI

1. **Скачайте Heroku CLI для Windows:**
   - Перейдите на: https://devcenter.heroku.com/articles/heroku-cli
   - Или прямая ссылка: https://cli-assets.heroku.com/heroku-x64.exe
   - Установите программу

2. **Проверьте установку:**
   ```bash
   heroku --version
   ```

### 2️⃣ Создать аккаунт на Heroku

1. Перейдите на: https://signup.heroku.com/
2. Зарегистрируйтесь (бесплатно)
3. Подтвердите email

### 3️⃣ Войти в Heroku через CLI

```bash
heroku login
```
*(Откроется браузер для входа)*

### 4️⃣ Инициализировать Git репозиторий

```bash
# В папке payment-webhook выполните:
git init
git add .
git commit -m "Initial webhook deployment"
```

### 5️⃣ Создать приложение на Heroku

```bash
# Создать приложение с автоматическим именем
heroku create

# ИЛИ создать с своим именем
heroku create your-webhook-name
```

**ВАЖНО:** Запомните URL приложения! Это будет ваш постоянный webhook URL.

### 6️⃣ Настроить переменные окружения

```bash
# Установить секретный ключ (получите от платежной системы)
heroku config:set WEBHOOK_SECRET=your_secret_key_here

# Опционально: ограничить IP-адреса
heroku config:set ALLOWED_IPS=ip1,ip2,ip3

# Опционально: настроить CORS
heroku config:set ALLOWED_ORIGINS=https://yoursite.com
```

### 7️⃣ Развернуть приложение

```bash
git push heroku main
```

*(Или `git push heroku master` если ваша главная ветка называется master)*

### 8️⃣ Проверить работу

```bash
# Открыть приложение в браузере
heroku open

# Или проверить логи
heroku logs --tail
```

## 🎯 Ваш Webhook URL

После успешного деплоя ваш webhook URL будет:

```
https://your-app-name.herokuapp.com/webhook/payment
```

**Этот URL указывайте в настройках платежной системы!**

## 🧪 Проверка работы

1. **Health Check:**
   ```
   https://your-app-name.herokuapp.com/health
   ```

2. **Информация о сервисе:**
   ```
   https://your-app-name.herokuapp.com/webhook/info
   ```

3. **Тестирование (локально):**
   ```bash
   # Отредактируйте test.js - замените localhost на ваш Heroku URL
   # Затем запустите:
   node test.js
   ```

## ⚙️ Дополнительные команды

```bash
# Просмотр логов в реальном времени
heroku logs --tail

# Перезапуск приложения
heroku restart

# Просмотр информации о приложении
heroku apps:info

# Просмотр переменных окружения
heroku config

# Масштабирование (если нужно)
heroku ps:scale web=1
```

## 🔧 Обновление приложения

Когда вы вносите изменения в код:

```bash
git add .
git commit -m "Update webhook"
git push heroku main
```

## 💰 Стоимость

- **Free tier** Heroku: 0$ в месяц
- Ограничения: 550 часов в месяц, засыпает после 30 минут неактивности
- Для production рекомендуется платный план от $7/месяц

## 🆘 Если что-то пошло не так

1. **Проверьте логи:**
   ```bash
   heroku logs --tail
   ```

2. **Проверьте переменные:**
   ```bash
   heroku config
   ```

3. **Перезапустите:**
   ```bash
   heroku restart
   ```

4. **Проверьте статус:**
   ```bash
   heroku ps
   ```

## 🎉 Готово!

После успешного деплоя:

1. ✅ У вас есть постоянный webhook URL
2. ✅ Сервис работает 24/7
3. ✅ Автоматические обновления через Git
4. ✅ Мониторинг и логи через Heroku Dashboard

**Ваш webhook готов принимать платежные уведомления!**
