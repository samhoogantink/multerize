import { openAsBlob } from 'fs';
import { Hono } from 'hono';
import { Miniflare } from 'miniflare';
import { describe, it, expect } from 'vitest';
import Multerize, { HonoFileBodyEnv, R2StorageProvider } from './../src';

describe('Hono Files', () => {
    const app = new Hono<{ Variables: HonoFileBodyEnv; }>();

    const miniflare = new Miniflare({
        modules: true,
        script: 'export default { fetch: () => new Response(null, { status: 404 }) };',
        r2Buckets: ['test']
    });

    describe('Upload to R2', () => {
        it('should return a single file', async () => {
            const testBucket = await miniflare.getR2Bucket('test');

            const multerize = new Multerize({
                storage: new R2StorageProvider({
                    r2Client: testBucket,
                    r2CustomMetadata: async (c, file) => ({ fieldName: file.fieldName }),
                    destination: async (c, file) => 'just_a_test/',
                    fileName: async (c, file) => crypto.randomUUID() + '.png'
                }),
                preservePath: true
            });

            const query = multerize.single('file'); // extract single file
            
            app.post('/upload', query, async (c) => {
                const file = c.get('file');

                return c.json({ 
                    file
                });
            });

            const file = await openAsBlob("C:\\Users\\Sam48\\Desktop\\default.png", { type: 'image/png' });
            const formData = new FormData();
            formData.append('file', file, 'default.png');
            formData.append('test', 'test.png');

            const req = new Request('http://localhost/upload', {
                method: 'POST',
                headers: { },
                body: formData
            });
        
            const res = await app.request(req);

            expect(res).not.toBeNull();
            expect(res.status).toBe(200);

            const json = await res.json()
            
            expect(json.file).not.toBeNull();
        });
    });
});