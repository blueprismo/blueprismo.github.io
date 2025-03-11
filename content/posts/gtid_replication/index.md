---
title: GTID replication
Summary: Creating some replication between databases.
date: "2028-01-09"
---

# Intro

We want to have some master-slave replica in order to have a database migration.
We want the databses to be moved into another place with the minimal downtime for our beautiful customers

We will use GTIDs just for the fun sake of it. Let's always [RTFM](https://dev.mysql.com/doc/refman/8.0/en/replication-gtids-howto.html)

## TLDR

In short, our steps should be as follows:

1. If replication is already running, synchronize both servers by making them read-only.
2. Stop both servers.
3. Restart both servers with GTIDs enabled and the correct options configured.
4. The mysqld options necessary to start the servers as described are discussed in the example that follows later in this section.
5. Instruct the replica to use the source as the replication data source and to use auto-positioning. The SQL statements needed to accomplish this step are described in the example that follows later in this section.
6. Take a new backup. Binary logs containing transactions without GTIDs cannot be used on servers where GTIDs are enabled, so backups taken before this point cannot be used with your new configuration.
7. Start the replica, then disable read-only mode on both servers, so that they can accept updates.

## Hands on

As our scenario is creating a new server, we will start from point number 3 which is setting the GTIDs in both servers before our initial change.

### Step 1: Enable GTIDs

To check if GTIDs are enabled in our servers (if we don't really know it) we can check with the mysql command `SHOW VARIABLES LIKE 'gtid_mode';`
If GTID is not enabled before taking the dump:

- The transactions in the dump will not have GTID information.
- The replica cannot use GTID-based replication, as GTIDs are not recorded in the source's binary logs for those transactions.
Thus, enabling GTID beforehand ensures a seamless replication setup.

We must set both variables `enforce_gtid_consistency` and `gtid_mode` to `ON`. And FYI the `mysql.gtid_executed` system table is used to preserve the assigned GTIDs of all the transactions applied on a MySQL server, except those that are stored in a currently active binary log file.

```mysql
mysql>  SHOW VARIABLES LIKE 'log_bin';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| log_bin       | ON    |
+---------------+-------+
1 row in set (0.01 sec)

mysql> SHOW VARIABLES LIKE 'gtid_mode';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| gtid_mode     | ON    |
+---------------+-------+
1 row in set (0.00 sec)

mysql> describe mysql.gtid_executed;
+----------------+----------+------+-----+---------+-------+
| Field          | Type     | Null | Key | Default | Extra |
+----------------+----------+------+-----+---------+-------+
| source_uuid    | char(36) | NO   | PRI | NULL    |       |
| interval_start | bigint   | NO   | PRI | NULL    |       |
| interval_end   | bigint   | NO   |     | NULL    |       |
+----------------+----------+------+-----+---------+-------+
3 rows in set (0.01 sec)
```

Once we have this in the origin server, then we can make an initial dump via:

```sh
mysqldump --single-transaction --quick --triggers --routines --events $DATABASE | gzip > dump.sql.gz
```

After this dump, we are going to upload it into a new s3 bucket just in case we would like to streamline this process and automate it. To do so we will add an upload to s3 policy into the instance profile of our ec2 instance.

After this, we need to ensure this s3 bucket from our account has access from the destination account where our EKS cluster will be.
In order to quickly and dirty prepare cross-account access to our s3 bucket only for download (read) we will need this policy:

```json
{
    "Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "Allow access from ACCOUNT_B",
			"Principal": {
			    "AWS": "arn:aws:iam::<ACCOUNT_B>:root"
			},
			"Effect": "Allow",
			"Action": [
			    "s3:ListBucket",
			    "s3:GetObject",
                "s3:GetObjectVersion"
			],
			"Resource": [
			    "arn:aws:s3:::<BUCKET_A>",
			    "arn:aws:s3:::<BUCKET_A>/*"
			]
		}
	]
}
```

We can test so with simple commands locally:

```sh
❯ aws s3 ls --profile account-b s3://bucket_a
2025-01-10 12:54:42          0 testfile
❯ aws s3 cp --profile account-b s3://bucket_a/testfile .
download: s3://bucket_a/testfile to ./testfile
```

But we want to access them through kubernetes, therefore IRSA comes into the game, with the following policy:

```json
### Main policy 
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Allow RW bucket",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::temp-sre-db-migration"
        }
    ]
}

### Trust policy:
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::074420003649:oidc-provider/oidc.eks.eu-central-1.amazonaws.com/id/6E810DEDEA9CF6CA253EC318722EC038"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringLike": {
                    "oidc.eks.eu-central-1.amazonaws.com/id/6E810DEDEA9CF6CA253EC318722EC038:aud": "sts.amazonaws.com",
                    "oidc.eks.eu-central-1.amazonaws.com/id/6E810DEDEA9CF6CA253EC318722EC038:sub": "system:serviceaccount:*:*"
                }
            }
        }
    ]
}
```
### Set up helm chart for single-instance mysql

The bitnami chart has a toggle that describes to set a standalone image (master/slave previously, now primary/replica) [ref](https://github.com/bitnami/containers/tree/main/bitnami/mysql#setting-up-a-replication-cluster)

But we are not going to use the bitnami mysql version, rather than that the original mysql on 
