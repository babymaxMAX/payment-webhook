require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для безопасности
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
}));

// Middleware для парсинга JSON
app.use(bodyParser.json({ limit: '10mb' }));

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Проверка подписи (для безопасности)
function verifySignature(payload, signature, secret) {
  if (!secret || !signature) {
    return false;
  }

  try {
    const expectedBuffer = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest(); // Buffer

    const providedBuffer = Buffer.from(String(signature).trim(), 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (e) {
    return false;
  }
}

// Middleware для проверки IP-адресов (whitelist)
function checkIPWhitelist(req, res, next) {
  const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];
  
  if (allowedIPs.length === 0) {
    return next(); // Если whitelist пуст, пропускаем проверку
  }
  
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  console.log('Client IP:', clientIP);
  
  if (!allowedIPs.includes(clientIP)) {
    console.log('IP not in whitelist:', clientIP);
    return res.status(403).json({ error: 'Forbidden: IP not allowed' });
  }
  
  next();
}

// Главный endpoint для вебхука
app.post('/webhook/payment', checkIPWhitelist, (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-signature'] || req.headers['signature'];
    const secret = process.env.WEBHOOK_SECRET;
    
    // Проверяем подпись если секрет установлен
    if (secret) {
      if (!verifySignature(rawBody, signature, secret)) {
        console.log('Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
    
    // Обрабатываем платежное уведомление
    const paymentData = req.body;
    console.log('Получено платежное уведомление:', paymentData);
    
    // Здесь добавьте вашу логику обработки платежа
    processPayment(paymentData);
    
    // Отправляем успешный ответ
    res.status(200).json({ 
      status: 'success', 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка обработки вебхука:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error' 
    });
  }
});

// Функция обработки платежа
function processPayment(paymentData) {
  // Логируем данные платежа
  console.log('=== ОБРАБОТКА ПЛАТЕЖА ===');
  console.log('Время:', new Date().toISOString());
  console.log('Данные платежа:', JSON.stringify(paymentData, null, 2));
  
  // Здесь можно добавить логику:
  // - Сохранение в базу данных
  // - Отправка уведомлений пользователю
  // - Обновление статуса заказа
  // - Интеграция с другими системами
  
  try {
    // Пример обработки различных типов событий
    switch (paymentData.event_type || paymentData.type) {
      case 'payment.succeeded':
      case 'payment_success':
        handleSuccessfulPayment(paymentData);
        break;
        
      case 'payment.failed':
      case 'payment_failed':
        handleFailedPayment(paymentData);
        break;
        
      case 'payment.pending':
      case 'payment_pending':
        handlePendingPayment(paymentData);
        break;
        
      default:
        console.log('Неизвестный тип события:', paymentData.event_type || paymentData.type);
    }
  } catch (error) {
    console.error('Ошибка при обработке платежа:', error);
  }
}

// Обработчики для разных типов платежных событий
function handleSuccessfulPayment(data) {
  console.log('✅ Успешный платеж:', data.payment_id || data.id);
  // Здесь логика для успешного платежа
}

function handleFailedPayment(data) {
  console.log('❌ Неудачный платеж:', data.payment_id || data.id);
  // Здесь логика для неудачного платежа
}

function handlePendingPayment(data) {
  console.log('⏳ Платеж в обработке:', data.payment_id || data.id);
  // Здесь логика для платежа в обработке
}

// Endpoint для проверки здоровья сервиса
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint для получения информации о вебхуке
app.get('/webhook/info', (req, res) => {
  res.status(200).json({
    service: 'Payment Webhook Service',
    version: '1.0.0',
    webhook_url: `${req.protocol}://${req.get('host')}/webhook/payment`,
    endpoints: {
      webhook: '/webhook/payment (POST)',
      health: '/health (GET)',
      info: '/webhook/info (GET)'
    }
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Глобальный обработчик ошибок
app.use((error, req, res, next) => {
  console.error('Глобальная ошибка:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер вебхука запущен на порту ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook/payment`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.WEBHOOK_SECRET) {
    console.log('🔐 Проверка подписи включена');
  } else {
    console.log('⚠️  Проверка подписи отключена (установите WEBHOOK_SECRET)');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Получен сигнал SIGTERM. Завершаем работу...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Получен сигнал SIGINT. Завершаем работу...');
  process.exit(0);
});
