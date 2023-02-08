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
backup capture <MONGO_URI> <S3_BUCKET> <S3_OBJECT>
backup restore <S3_BUCKET> <S3_OBJECT> <MONGO_URI>
```
