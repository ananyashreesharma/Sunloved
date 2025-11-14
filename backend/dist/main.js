"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5000',
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = process.env.PORT || 2000;
    await app.listen(port);
    console.log(`
  🚀 Sunloved Backend Server is running!
  
  📍 Local:            http://localhost:${port}
  🌐 API Base:         http://localhost:${port}/api
  🎯 Health Check:     http://localhost:${port}/api/health
  
  📝 Environment:      ${process.env.NODE_ENV || 'development'}
  🔗 Frontend URL:     ${process.env.FRONTEND_URL || 'http://localhost:5000'}
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map