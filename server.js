require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
// === Database (PostgreSQL) ===
const DATABASE_URL = process.env.DATABASE_URL;
const dbPool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : undefined }) : null;

async function ensureDb() {
  if (!dbPool) return;
  await dbPool.query(
    `CREATE TABLE IF NOT EXISTS payments (
       id TEXT PRIMARY KEY,
       amount NUMERIC,
       currency TEXT,
       provider_status TEXT,
       event_type TEXT,
       raw JSONB,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
     );`
  );
}


// === Telegram notifications config ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || process.env.ADMIN_TG_ID;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.ADMIN_KEY;

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
app.post(['/webhook/payment', '/webhook'], checkIPWhitelist, (req, res) => {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-signature'] || req.headers['signature'];
    const secret = process.env.WEBHOOK_SECRET;
    const headerApiKey = req.headers['x-apikey'] || req.headers['x-api-key'] || req.headers['x-secret'];
    const expectedApiKey = process.env.PLATEGA_API_KEY || process.env.API_KEY;
    const headerMerchantId = req.headers['x-merchantid'] || req.headers['x-merchant-id'];
    const expectedMerchantId = process.env.PLATEGA_MERCHANT_ID || process.env.MERCHANT_ID;
    
    // Проверяем подпись если секрет установлен
    if (secret) {
      if (!verifySignature(rawBody, signature, secret)) {
        console.log('Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Проверка API-ключа/мерчанта (для некоторых провайдеров, например Platega)
    if (expectedApiKey) {
      if (!headerApiKey || String(headerApiKey).trim() !== String(expectedApiKey).trim()) {
        console.log('Invalid API key');
        return res.status(401).json({ error: 'Invalid API key' });
      }
    }
    if (expectedMerchantId) {
      if (!headerMerchantId || String(headerMerchantId).trim() !== String(expectedMerchantId).trim()) {
        console.log('Invalid MerchantId');
        return res.status(401).json({ error: 'Invalid MerchantId' });
      }
    }
    
    // Обрабатываем платежное уведомление
    const paymentData = req.body;
    // Нормализуем тип события из статусных значений провайдера, если event_type не передан
    if (!paymentData.event_type && !paymentData.type && paymentData.status) {
      const status = String(paymentData.status).toUpperCase();
      if (status === 'CONFIRMED' || status === 'SUCCESS' || status === 'SUCCEEDED') {
        paymentData.event_type = 'payment.succeeded';
      } else if (status === 'PENDING' || status === 'PROCESSING') {
        paymentData.event_type = 'payment.pending';
      } else if (['CANCELED', 'FAILED', 'EXPIRED', 'CANCELLED'].includes(status)) {
        paymentData.event_type = 'payment.failed';
      }
    }
    console.log('Получено платежное уведомление:', paymentData);
    
    // Здесь добавьте вашу логику обработки платежа
    processPayment(paymentData);
    // Асинхронно сохраняем (идемпотентно)
    if (dbPool) {
      savePaymentIfNew(paymentData).catch((e) => console.error('DB save error:', e));
    }
    
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
  // Уведомление администратору
  notifyAdminPaymentEvent('success', data).catch((e) => {
    console.error('Ошибка отправки уведомления в Telegram:', e);
  });
}

function handleFailedPayment(data) {
  console.log('❌ Неудачный платеж:', data.payment_id || data.id);
  notifyAdminPaymentEvent('failed', data).catch((e) => {
    console.error('Ошибка отправки уведомления в Telegram:', e);
  });
}

function handlePendingPayment(data) {
  console.log('⏳ Платеж в обработке:', data.payment_id || data.id);
  notifyAdminPaymentEvent('pending', data).catch((e) => {
    console.error('Ошибка отправки уведомления в Telegram:', e);
  });
}

// === Telegram helpers ===
async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    return;
  }
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Telegram API error: ${response.status} ${errText}`);
  }
}

function extractAmount(paymentData) {
  return {
    amount: paymentData.amount ?? paymentData.total_amount ?? paymentData.sum ?? null,
    currency: paymentData.currency ?? paymentData.currency_code ?? 'RUB'
  };
}

function extractBalance(paymentData) {
  return paymentData.balance ?? paymentData.wallet_balance ?? paymentData.account_balance ?? null;
}

async function notifyAdminPaymentEvent(status, data) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_ID) {
    return; // уведомления выключены
  }
  const { amount, currency } = extractAmount(data);
  const balance = extractBalance(data);
  const lines = [
    `Платёж: ${status === 'success' ? 'УСПЕШНО ✅' : status === 'failed' ? 'ОТКЛОНЁН ❌' : 'В ОБРАБОТКЕ ⏳'}`,
    amount != null ? `Сумма: ${amount} ${currency}` : undefined,
    data.payment_id || data.id ? `ID платежа: ${data.payment_id || data.id}` : undefined,
    data.order_id ? `Заказ: ${data.order_id}` : undefined,
    data.status ? `Статус провайдера: ${data.status}` : undefined,
    balance != null ? `Баланс: ${balance}` : undefined,
    data.customer?.email ? `Email: ${data.customer.email}` : undefined,
    data.customer?.phone ? `Телефон: ${data.customer.phone}` : undefined,
    data.created_at ? `Время: ${data.created_at}` : undefined
  ].filter(Boolean);

  const text = lines.join('\n');
  await sendTelegramMessage(TELEGRAM_ADMIN_ID, text);
}

async function savePaymentIfNew(data) {
  if (!dbPool) return;
  const id = String(data.id || data.payment_id || '').trim();
  if (!id) return;
  const amount = data.amount ?? data.paymentDetails?.amount ?? null;
  const currency = data.currency ?? data.paymentDetails?.currency ?? null;
  const providerStatus = data.status ?? null;
  const eventType = data.event_type ?? data.type ?? null;
  const raw = JSON.stringify(data);
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT 1 FROM payments WHERE id = $1', [id]);
    if (exists.rowCount === 0) {
      await client.query(
        'INSERT INTO payments (id, amount, currency, provider_status, event_type, raw) VALUES ($1,$2,$3,$4,$5,$6)',
        [id, amount, currency, providerStatus, eventType, raw]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Endpoint для проверки здоровья сервиса
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Совместимость с типовым путём healthcheck у провайдеров
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Простой корневой ответ, чтобы не видеть Not Found при открытии домена
app.get('/', (req, res) => {
  res.status(200).send('OK');
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

// Админ: просмотр последних платежей через HTTP (только с ключом)
app.get('/admin/payments', async (req, res) => {
  try {
    if (!ADMIN_API_KEY || req.query.key !== ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!dbPool) {
      return res.status(503).json({ error: 'Database is not configured' });
    }
    const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 200);
    const { rows } = await dbPool.query(
      'SELECT id, amount, currency, provider_status, event_type, created_at FROM payments ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    res.json({ items: rows, count: rows.length });
  } catch (e) {
    console.error('admin/payments error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/admin/payments/:id', async (req, res) => {
  try {
    if (!ADMIN_API_KEY || req.query.key !== ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!dbPool) {
      return res.status(503).json({ error: 'Database is not configured' });
    }
    const { rows } = await dbPool.query(
      'SELECT * FROM payments WHERE id = $1 LIMIT 1',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('admin/payments/:id error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
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

  // Инициализация БД
  if (dbPool) {
    ensureDb()
      .then(() => console.log('🗄️  Таблица payments готова'))
      .catch((e) => console.error('Ошибка инициализации БД:', e));
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
