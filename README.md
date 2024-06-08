# Multerize

Multerize is a Hono middleware for handling `multipart/form-data`, which is primarily used for uploading files. It's API is based on [Multer](https://github.com/expressjs/multer). Please note that it's not exactly the same, and currently is being focussed to work only on CloudFlare Workers. Other platforms are not tested.

A demo can be found here: [multerize-workers-test](https://github.com/samhoogantink/multerize-workers-test)

**NOTE**: Multerize will not process any form which is not multipart (`multipart/form-data`).

## Installation

```sh
$ npm install --save multerize
```

## Usage

Multerize adds a `file` or `files` object to the `request` object. The `file` or `files` object contains the files uploaded via the form.

Basic usage example:

Don't forget the `enctype="multipart/form-data"` in your form.

```html
<form action="/profile" method="post" enctype="multipart/form-data">
  <input type="file" name="avatar" />
</form>
```

```typescript
import { Hono } from 'hono';
import { Multerize, R2StorageProvider, MulterizeHonoBindings } from 'multerize';

const multerize = new Multerize({
    storage: new R2StorageProvider<Env>({
        r2Client: env.R2_BUCKET,
        // or
        envBucketKey: 'R2_BUCKET' // we'll look in the Hono Context for this key
    })
});

const app = new Hono<{ Variables: MulterizeHonoBindings; Bindings: Env; }>();

app.post('/profile', upload.single('avatar'), async (c) => {
  // c.get('file') is the `avatar` file
  // c.req.formData() will hold the text fields, if there were any
})

app.post('/photos/upload', upload.array('photos', 12), async (c) => {
  // c.get('files') is array of `photos` files
  // c.req.formData() will contain the text fields, if there were any
})

const cpUpload = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'gallery', maxCount: 8 }])
app.post('/cool-profile', cpUpload, async (c) => {
  // c.get('files') is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  c.get('files')['avatar'][0] -> File
  //  c.get('files')['gallery'] -> Array
  //
  // c.req.formData() will contain the text fields, if there were any
})
```

In case you need to handle a text-only multipart form, you should use the `.none()` method:

```javascript
import { Hono } from 'hono';
import { Multerize, MulterizeHonoBindings } from 'multerize';

const multerize = new Multerize();

const app = new Hono<{ Variables: MulterizeHonoBindings; }>();

app.post('/profile', upload.none(), async (c) => {
  // c.req.formData() contains the text fields
})
```


## API

### File information

Each file contains the following information:

Key | Description | Note
--- | --- | ---
`fieldName` | Field name specified in the form |
`originalName` | Name of the file on the user's computer |
`mimetype` | Mime type of the file |
`size` | Size of the file in bytes |
`destination` | The folder to which the file has been saved | `R2Storage`
`fileName` | The name of the file within the `destination` | `R2Storage`
`path` | The full path to the uploaded file | `R2Storage`
`buffer` | A `Buffer` of the entire file | `MemoryStorage & R2Storage`

### `multerize(opts)`

Multerize accepts an options object. In case you omit the
options object, the files will be kept in memory and never written to disk.

By default, Multerize will rename the files so as to avoid naming conflicts. The
renaming function can be customized according to your needs.

The following are the options that can be passed to Multerize.

Key | Description
--- | ---
`storage` | Where to store the files
`fileFilter` | Function to control which files are accepted
`limits` | Limits of the uploaded data
`preservePath` | Keep the full path of files instead of just the base name
`custom` | Overwrite some variables, for example if the Variable key 'file' and 'files' are already in use by another Middleware

In an average web app, no options are required, and configured as shown in
the following example.

```javascript
const upload = new Multerize()
```

If you want more control over your uploads, you'll want to use the `storage` options. Multerize ships with storage engines `R2Storage`
and `MemoryStorage`; More engines will be available soon.

#### `.single(fieldname)`

Accept a single file with the name `fieldname`. The single file will be stored
in `c.get('file')`.

#### `.array(fieldname[, maxCount])`

Accept an array of files, all with the name `fieldname`. Optionally error out if
more than `maxCount` files are uploaded. The array of files will be stored in
`c.get('files')`.

#### `.fields(fields)`

Accept a mix of files, specified by `fields`. An object with arrays of files
will be stored in `c.get('files')`.

`fields` should be an array of objects with `name` and optionally a `maxCount`.
Example:

```javascript
[
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]
```

#### `.none()`

Accept only text fields. If any file upload is made, error with code
"ExpectedTextFieldsOnly" will be issued.

#### `.any()`

Accepts all files that comes over the wire. An array of files will be stored in
`c.get('files')`.

**WARNING:** Make sure that you always handle the files that a user uploads.
Never add multerize as a global middleware since a malicious user could upload
files to a route that you didn't anticipate. Only use this function on routes
where you are handling the uploaded files.

### `storage`

#### `R2Storage`

The R2 storage engine gives you full control on storing files to your R2 bucket. This options can only be used inside CloudFlare Workers

```typescript
const storage = new R2StorageProvider<Env>({
  r2Client: env.R2_BUCKET,
  // or
  envBucketKey: 'R2_BUCKET',

  r2StorageClass: 'Standard',
  r2CustomMetaData: async (c, file) => {
      return {
          key: 'value'
      }
  },
  returnBuffer: false,
  destination: async (c, file) => {
    return 'folder/my-uploads/'; // Note: ALWAYS end with a forward slash at the end of the destination. Multerize doesn't add this for you.
  },
  filenName: async (c, file) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    return file.fieldName + '-' + uniqueSuffix;
  }
})

const upload = new Multerize({ storage: storage })
```

There are seven options available, `r2Client`, `envBucketKey`, `r2StorageClass`, `r2CustomMetaData`, `returnBuffer`, `destination` and `filename`. Some are
functions that determine where the file should be stored.

`r2Client` is the R2 Client provided in CloudFlare Workers. 

`envBucketKey` is an alternative to `r2Client`. You can provide a key that's available in the environment, we'll then take a look there and extract the R2 Client.

`r2StorageClass` you can provide either the `Standard` or `InfrequentAccess` class. Take a look at the [CloudFlare docs](https://developers.cloudflare.com/r2/buckets/storage-classes/) for more information.

`returnBuffer` if the R2 Storage Provider should return a buffer in the `c.get('file')` object. Defaults to false.

`destination` is used to determine within which folder the uploaded files should
be stored. This can also be given as a `string` (e.g. `'/tmp/uploads'`). If no
`destination` is given, it will default to the root of your Bucket.

`fileName` is used to determine what the file should be named inside the folder.
If no `fileName` is given, the original file name will be used.

#### `MemoryStorage`

The memory storage engine stores the files in memory as `Buffer` objects. It
doesn't have any options.

```javascript
const storage = new MemoryStorageProvider()
const upload = new Multerize({ storage: storage })
```

When using memory storage, the file info will contain a field called
`buffer` that contains the entire file.

**WARNING**: Uploading very large files, or relatively small files in large
numbers very quickly, can cause your application to run out of memory when
memory storage is used.

### `limits`

An object specifying the size limits of the following optional properties.

The following integer values are available:

Key | Description | Default
--- | --- | ---
`fieldNameSize` | Max field name size | 100 bytes
`fieldSize` | Max field value size (in bytes) | 1MB
`fields` | Max number of non-file fields | Infinity
`fileSize` | For multipart forms, the max file size (in bytes) | Infinity
`files` | For multipart forms, the max number of file fields | Infinity
`parts` | For multipart forms, the max number of parts (fields + files) | Infinity
`headerPairs` | For multipart forms, the max number of header key=>value pairs to parse | 2000

Specifying the limits can help protect your site against denial of service (DoS) attacks.

### `fileFilter`

Set this to a function to control which files should be uploaded and which
should be skipped. The function should look like this:

```typescript
const fileFilter = async (c, file) => {

  // To reject this file pass `false`, like so:
  return false;

  // To accept the file pass `true`, like so:
  return true;

  // You can always throw an error if something goes wrong:
  throw new Error('I don\'t have a clue!')

}
```

## License

[MIT](LICENSE)