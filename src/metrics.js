
const { send } = require('process');
const config = require('./config.js');

const requests = {};
const authEvents = { success: 0, failure: 0 };
const activeUsers = new Map();
const purchase = { count: 0, revenue: 0, error: 0, latency: 0 };
let requestLatency = 0;

function track(req, res, next) {
    const httpMethod = req.method.toLowerCase();
    const previousValue = requests[httpMethod] ?? 0;
    requests[httpMethod] = previousValue + 1;
  
    const dateNow = Date.now();
    
    if (req.user) {
      if (activeUsers.has(req.user.id)) {
        activeUsers.get(req.user.id).last = dateNow;
      }
    }

    res.on('finish', () => {
        requestLatency += Date.now() - dateNow;
    });
  
    next(); 
  }

function loginEvent(userId, success) {
    // console.log(`loginEvent called - userId: ${userId}, success: ${success}`);
    
    if (!authEvents.hasOwnProperty(success ? 'success' : 'failure')) {
      console.error("Invalid success parameter in loginEvent");
      return;
    }
  
    authEvents[success ? 'success' : 'failure'] += 1;
  
    if (success) {
    //   console.log(`Tracking active user: ${userId}`);
      activeUsers.set(userId, { login: Date.now(), last: Date.now() });
    }
  }

function orderEvent(orderEvent) {
    // console.log(orderEvent.revenue)
    purchase.count += orderEvent.count;
    purchase.revenue += orderEvent.revenue;
    purchase.error += orderEvent.error ? 1 : 0;
    if (orderEvent.end && orderEvent.start) {
      const latency = orderEvent.end - orderEvent.start;
      purchase.latency += latency;
    }
  };
  

const os = require('os');

function getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return Math.round(cpuUsage * 100);  // Convert to integer
  }
  
  function getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return Math.round(memoryUsage);  // Convert to integer
  }

function getCurrentUserCount() {
    console.log("active users", activeUsers)
    activeUsers.forEach((value, key) => {
        const expiresThreshold = Date.now() - 10 * 60 * 1000;
        if (value.last < expiresThreshold) {
          activeUsers.delete(key);
        }
      });
    return activeUsers.size;
}

function sendMetricToGrafana(metricName, metricValue, attributes, units = 's') {
  attributes = { ...attributes, source: config.metrics.source };

  const metric = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics: [
              {
                name: metricName,
                // unit: units,
                gauge: {
                  dataPoints: [
                    {
                      asInt: metricValue,
                      timeUnixNano: Date.now() * 1000000,
                      attributes: [],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  Object.keys(attributes).forEach((key) => {
    metric.resourceMetrics[0].scopeMetrics[0].metrics[0].gauge.dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  fetch(`${config.metrics.host}`, {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: { Authorization: `Bearer ${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Failed to push metrics data to Grafana');
      } else {
        console.log(`Pushed ${metricName}`);
      }
    })
    .catch((error) => {
      console.error('Error pushing metrics:', error);
    });
}

// Periodically send metrics to Grafana
const timer = setInterval(async () => {
  Object.keys(requests).forEach((endpoint) => {
    sendMetricToGrafana('requests', requests[endpoint], { endpoint }, 's');
  });

  const cpuUsage = getCpuUsagePercentage();
  sendMetricToGrafana('cpu_usage', cpuUsage, {}, '%');

  const memoryUsage = getMemoryUsagePercentage();
  sendMetricToGrafana('memory_usage', memoryUsage, {}, '%');

  const userCount = getCurrentUserCount();
  sendMetricToGrafana('current_users', userCount, {}, '1');

  sendMetricToGrafana('pizza_auth_success', authEvents.success, {}, '1');
  sendMetricToGrafana('pizza_auth_failure', authEvents.failure, {}, '1');

  sendMetricToGrafana('pizza_purchase_count', purchase.count, {}, '1');
  sendMetricToGrafana('pizza_purchase_latency', purchase.latency, {}, 'ms');
  sendMetricToGrafana('pizza_purchase_error', purchase.error, {}, '1');
  sendMetricToGrafana('pizza_purchase_revenue', Math.round(purchase.revenue*1000), {}, '$');

  sendMetricToGrafana('pizza_request_latency', requestLatency, {}, 'ms');
}, 10000);

timer.unref();

module.exports = { track, loginEvent, orderEvent };