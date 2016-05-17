--liquibase formatted sql

--changeset protomouse:1
CREATE TABLE Recipients (
  address VARCHAR(255) CHARSET utf8 COLLATE utf8_general_ci NOT NULL,
  status ENUM('bouncing', 'deliverable') NOT NULL,

  PRIMARY KEY (address)
) ENGINE=InnoDB;
--rollback DROP TABLE Recipients;

--changeset protomouse:2
CREATE TABLE Bounces (
  id VARCHAR(255) CHARSET ascii COLLATE ascii_general_ci NOT NULL,
  type VARCHAR(255) NOT NULL,
  subType VARCHAR(255) NOT NULL,
  timestamp DATETIME NOT NULL,
  RecipientAddress VARCHAR(255) CHARSET utf8 COLLATE utf8_general_ci NOT NULL,

  PRIMARY KEY (id),
  INDEX RecipientAddress (RecipientAddress),
  FOREIGN KEY (RecipientAddress) REFERENCES Recipients(address) ON DELETE CASCADE
) ENGINE=InnoDB;
--rollback DROP TABLE Bounces;
