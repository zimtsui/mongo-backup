# Prerequisites

- `bash`
- MinIO Client `mc`
- MongoDB Database Tools `mongodump` and `mongorestore`

# 安装卸载

```shell
./configure && sudo make install
mongo-backup --version
sudo make uninstall
```

# Usage

## Required Environment variables

- `MC_ALIAS`
- `MONGO_HOST`

## 备份

```shell
mongo-backup capture <MONGO_URI> <S3_BUCKET> <S3_OBJECT>
```

## 恢复

```shell
mongo-backup restore <S3_BUCKET> <S3_OBJECT> <MONGO_URI>
```

## abort a job

```shell
kill -s <SIGNAL> -<PID>
```

注意 `PID` 前面有负号。

`SIGNAL` 可以是

- `SIGINT`
- `SIGTERM`
- `SIGHUP`

。
