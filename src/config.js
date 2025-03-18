module.exports = {
  jwtSecret: '343ab90294hijkfd2fdsaf4dsa3f376',
  db: {
    connection: {
      host: '127.0.0.1',
      user: 'root',
      password: 'tempdbpassword',
      database: 'pizza',
      connectTimeout: 60000,
    },
    listPerPage: 10,
  },
  factory: {
    url: 'https://pizza-factory.cs329.click',
    apiKey: 'fe5ed64c4d97431b88369020b7eb331c',
  },
  metrics: {
    source: 'jwt-pizza-service-dev',
    host: "https://otlp-gateway-prod-us-east-2.grafana.net/otlp/v1/metrics",
    apiKey: "1187041:glc_eyJvIjoiMTM2Mzg5NCIsIm4iOiJzdGFjay0xMTg3MDQxLWludGVncmF0aW9uLWp3dC1waXp6YS1tZXRyaWNzIiwiayI6IjY0dWsxdXAzWTBIMTJCWGxyMlY1dUxiMyIsIm0iOnsiciI6InByb2QtdXMtZWFzdC0wIn19"
  },
};
