# Prerequisites

- `bash`
- MinIO Client `mc`
- MongoDB Database Tools `mongodump` and `mongorestore`

# Usage

Environment variables:

- `HOSTNAME`
- `USER_ID`
- `PASSWORD`

```
mongo-backup capture <MONGO_URI> <S3_BUCKET> <S3_OBJECT>
mongo-backup restore <S3_BUCKET> <S3_OBJECT> <MONGO_URI>
```
