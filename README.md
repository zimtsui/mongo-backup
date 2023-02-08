# Prerequisites

- MinIO Client `mc`
- MongoDB Database Tools `mongodump` and `mongorestore`

# Usage

Environment variables:

- `HOSTNAME`
- `USER_ID`
- `PASSWORD`

```
backup capture <DATABASE_URI> <BUCKET/FILE_PATH>
backup restore <BUCKET/FILE_PATH> <DATABASE_URI>
```
