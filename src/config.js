module.exports =  {
    jwtSecret: 'ethanblaylock',
    db: {
        connection: {
            host: '127.0.0.1',
            user: 'root',
            password: 'Mathcounts21',
            database: 'pizza',
            connectTimeout: 60000,
        },
        listPerPage: 10,
    },
    factory: {
        url: 'https://pizza-factory.cs329.click',
        apiKey: 'fe5ed64c4d97431b88369020b7eb331c',
    },
};