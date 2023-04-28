import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';

// doc express-session: https://www.npmjs.com/package/express-session

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(session({
			secret: 'secret', // secret key for signing cookies
			resave: false, // save session even if unmodified false by default for performance
			saveUninitialized: false, // save session even if no data false by default for security
			cookie: { maxAge: 360000 } // 1 hour
		})
	);
	app.use(cookieParser())
	await app.listen(3000);
}
bootstrap();
