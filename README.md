# Prerequisites

- `bash`
- MinIO Client `mc`
- MongoDB Database Tools `mongodump` and `mongorestore`

# Usage

Environment variables:

- `S3_HOSTNAME`
- `S3_USERNAME`
- `S3_PASSWORD`

```
mongo-backup capture <MONGO_URI> <S3_BUCKET> <S3_OBJECT>
mongo-backup restore <S3_BUCKET> <S3_OBJECT> <MONGO_URI>
```
