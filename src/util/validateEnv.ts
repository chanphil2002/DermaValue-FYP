import { cleanEnv, str, port } from 'envalid';

export default cleanEnv(process.env, {
    // MONGO_CONNECTION_STRING: str(), 
    DATABASE_URL: str(), 
    PORT: port(),
});
