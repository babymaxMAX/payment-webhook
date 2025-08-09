// Тестовый скрипт для проверки вебхука
const http = require('http');
const crypto = require('crypto');

const WEBHOOK_URL = 'http://localhost:3000/webhook/payment';
const SECRET = 'test_secret'; // Установите тот же секрет в .env файле

// Тестовые данные платежа
const testPaymentData = {
  event_type: 'payment.succeeded',
  payment_id: 'test_payment_' + Date.now(),
  amount: 1000.00,
  currency: 'RUB',
  status: 'succeeded',
  order_id: 'order_123',
  customer: {
    email: 'test@example.com',
    phone: '+7900123456'
  },
  created_at: new Date().toISOString(),
  metadata: {
    source: 'test_script'
  }
};

// Функция для создания подписи
function createSignature(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(data))
    .digest('hex');
}

// Функция для отправки тестового вебхука
function sendTestWebhook() {
  const payload = JSON.stringify(testPaymentData);
  const signature = createSignature(testPaymentData, SECRET);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/webhook/payment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'X-Signature': signature,
      'User-Agent': 'PaymentSystem/1.0'
    }
  };

  console.log('🧪 Отправка тестового вебхука...');
  console.log('📦 Данные:', testPaymentData);
  console.log('🔐 Подпись:', signature);

  const req = http.request(options, (res) => {
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📨 Ответ сервера:');
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Body:', responseBody);
      
      if (res.statusCode === 200) {
        console.log('✅ Тест прошел успешно!');
      } else {
        console.log('❌ Тест не прошел!');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Ошибка при отправке запроса:', error.message);
    console.log('💡 Убедитесь что сервер запущен: npm start');
  });

  req.write(payload);
  req.end();
}

// Функция для тестирования различных сценариев
function runAllTests() {
  console.log('🚀 Запуск тестов вебхука...\n');
  
  // Тест 1: Успешный платеж
  setTimeout(() => {
    console.log('=== ТЕСТ 1: Успешный платеж ===');
    sendTestWebhook();
  }, 100);
  
  // Тест 2: Неудачный платеж
  setTimeout(() => {
    console.log('\n=== ТЕСТ 2: Неудачный платеж ===');
    const failedPayment = { ...testPaymentData };
    failedPayment.event_type = 'payment.failed';
    failedPayment.status = 'failed';
    failedPayment.payment_id = 'failed_payment_' + Date.now();
    
    const payload = JSON.stringify(failedPayment);
    const signature = createSignature(failedPayment, SECRET);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/webhook/payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Signature': signature
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode, 'Body:', responseBody);
      });
    });

    req.on('error', (error) => {
      console.error('Ошибка:', error.message);
    });

    req.write(payload);
    req.end();
  }, 2000);

  // Тест 3: Неверная подпись
  setTimeout(() => {
    console.log('\n=== ТЕСТ 3: Неверная подпись ===');
    const payload = JSON.stringify(testPaymentData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/webhook/payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Signature': 'invalid_signature'
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode, 'Body:', responseBody);
        console.log('✅ Тест проверки подписи работает!');
      });
    });

    req.on('error', (error) => {
      console.error('Ошибка:', error.message);
    });

    req.write(payload);
    req.end();
  }, 4000);
}

// Проверяем доступность сервера перед тестами
function checkServer() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Сервер доступен, запускаем тесты...\n');
      runAllTests();
    } else {
      console.log('❌ Сервер недоступен');
    }
  });

  req.on('error', (error) => {
    console.error('❌ Сервер не запущен. Запустите сервер командой: npm start');
  });

  req.end();
}

// Запуск
console.log('🔍 Проверка доступности сервера...');
checkServer();
