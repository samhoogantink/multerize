import { openAsBlob } from 'fs';
import { Hono } from 'hono';
import { Miniflare } from 'miniflare';
import { describe, it, expect } from 'vitest';
import { Multerize, MulterizeHonoBindings, R2StorageProvider, imagesOnlyFilter, FileResult, FilesResult } from './../src';
import type { R2Bucket } from '@cloudflare/workers-types/experimental';

export type Env = {
    R2_BUCKET: R2Bucket;
}

export type Variables = {
    TEST_TO_SHOW_YOU_CAN_HAVE_CUSTOM_VARIABLES: string;
    my_file: FileResult;
    my_files: FilesResult;
}
// } & MulterizeHonoBindings;

describe('Hono Files', () => {
    const app = new Hono<{ Variables: Variables; Bindings: Env; }>();

    const miniflare = new Miniflare({
        modules: true,
        script: 'export default { fetch: () => new Response(null, { status: 404 }) };',
        r2Buckets: ['test']
    });

    describe('Upload to R2', () => {
        it('should return a single file', async () => {
            const testBucket = await miniflare.getR2Bucket('test');

            const multerize = new Multerize({
                storage: new R2StorageProvider<Env, MulterizeHonoBindings>({
                    r2Client: testBucket,       // Because we've provided this, the envBucketKey will be ignored
                    envBucketKey: 'R2_BUCKET',  // This is ignored because we've provided the r2Client
                    r2CustomMetadata: async (c, file) => ({ fieldName: file.fieldName }),
                    destination: async (c, file) => 'just_a_test/',
                    fileName: async (c, file) => {
                        return crypto.randomUUID() + '.png';
                    }
                }),
                fileFilter: imagesOnlyFilter,
                preservePath: true,
                custom: {
                    FILE_VARIABLE_KEY: 'my_file',
                    FILES_VARIABLE_KEY: 'my_files'
                }
            });

            const query = multerize.single('file'); // extract single file
            
            app.post('/upload', query, async (c) => {
                const file = c.var.my_file;

                return c.json({ 
                    file
                });
            });

            const file = await openAsBlob("C:\\Users\\Sam48\\Desktop\\default.png", { type: 'image/png' });
            const formData = new FormData();
            formData.append('file', file, 'default.png');
            formData.append('test', 'test.png');

            const requestBody = {
                method: 'POST',
                headers: { },
                body: formData
            };
        
            const res = await app.request('http://localhost/upload', requestBody, { R2_BUCKET: testBucket });

            expect(res).not.toBeNull();
            expect(res.status).toBe(200);

            const json = await res.json()
            
            expect(json.file).not.toBeNull();
        });
    });
});