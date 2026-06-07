-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `name` VARCHAR(191) NULL,
    `image` TEXT NULL,
    `passwordHash` VARCHAR(191) NULL,
    `role` ENUM('VISITOR', 'ADVERTISER', 'ADMIN') NOT NULL DEFAULT 'VISITOR',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `providerAccountId` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_provider_providerAccountId_key`(`provider`, `providerAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionToken` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_sessionToken_key`(`sessionToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    UNIQUE INDEX `VerificationToken_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `type` ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'CLAIM_VERIFICATION') NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AuthToken_token_key`(`token`),
    INDEX `AuthToken_userId_idx`(`userId`),
    INDEX `AuthToken_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Business` (
    `id` VARCHAR(191) NOT NULL,
    `placeId` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `handle` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `address` VARCHAR(191) NOT NULL,
    `neighborhood` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL DEFAULT 'Brasília',
    `state` VARCHAR(191) NOT NULL DEFAULT 'DF',
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `phone` VARCHAR(191) NULL,
    `whatsapp` VARCHAR(191) NULL,
    `website` TEXT NULL,
    `instagram` VARCHAR(191) NULL,
    `facebook` TEXT NULL,
    `linkedin` TEXT NULL,
    `youtube` TEXT NULL,
    `googleRating` DOUBLE NULL,
    `googleRatingCount` INTEGER NULL,
    `openingHours` JSON NULL,
    `reviews` JSON NULL,
    `status` ENUM('IMPORTED', 'CLAIMED', 'PENDING_REVIEW', 'SUSPENDED') NOT NULL DEFAULT 'IMPORTED',
    `plan` ENUM('FREE', 'VISIBILITY', 'PREMIUM') NOT NULL DEFAULT 'FREE',
    `planExpiresAt` DATETIME(3) NULL,
    `planIsCourtesy` BOOLEAN NOT NULL DEFAULT false,
    `ownerId` VARCHAR(191) NULL,
    `storeWhatsappMessage` TEXT NULL,
    `storeCoverUrl` TEXT NULL,
    `storeTagline` VARCHAR(191) NULL,
    `importedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSyncedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Business_placeId_key`(`placeId`),
    UNIQUE INDEX `Business_slug_key`(`slug`),
    UNIQUE INDEX `Business_handle_key`(`handle`),
    INDEX `Business_categoryId_idx`(`categoryId`),
    INDEX `Business_ownerId_idx`(`ownerId`),
    INDEX `Business_neighborhood_idx`(`neighborhood`),
    INDEX `Business_plan_idx`(`plan`),
    INDEX `Business_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `iconName` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Category_slug_key`(`slug`),
    INDEX `Category_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Photo` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `source` ENUM('GOOGLE_PLACES', 'OWNER_UPLOAD', 'OPERATOR_UPLOAD') NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Photo_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClaimRequest` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `message` TEXT NULL,
    `documentUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewerId` VARCHAR(191) NULL,

    INDEX `ClaimRequest_businessId_idx`(`businessId`),
    INDEX `ClaimRequest_userId_idx`(`userId`),
    INDEX `ClaimRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BusinessView` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `count` INTEGER NOT NULL DEFAULT 1,

    INDEX `BusinessView_businessId_idx`(`businessId`),
    INDEX `BusinessView_date_idx`(`date`),
    UNIQUE INDEX `BusinessView_businessId_date_key`(`businessId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsappClick` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `count` INTEGER NOT NULL DEFAULT 1,

    INDEX `WhatsappClick_businessId_idx`(`businessId`),
    UNIQUE INDEX `WhatsappClick_businessId_date_key`(`businessId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `plan` ENUM('FREE', 'VISIBILITY', 'PREMIUM') NOT NULL,
    `status` ENUM('ACTIVE', 'PAST_DUE', 'CANCELED') NOT NULL,
    `asaasCustomerId` VARCHAR(191) NOT NULL,
    `asaasSubId` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `canceledAt` DATETIME(3) NULL,

    UNIQUE INDEX `Subscription_businessId_key`(`businessId`),
    INDEX `Subscription_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Presence` (
    `visitorId` VARCHAR(191) NOT NULL,
    `firstSeen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeen` DATETIME(3) NOT NULL,
    `hits` INTEGER NOT NULL DEFAULT 1,

    INDEX `Presence_lastSeen_idx`(`lastSeen`),
    PRIMARY KEY (`visitorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `AuditLog_businessId_idx`(`businessId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiUsage` (
    `id` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `units` INTEGER NOT NULL DEFAULT 1,
    `results` INTEGER NOT NULL DEFAULT 0,
    `costUsd` DOUBLE NOT NULL DEFAULT 0,
    `query` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApiUsage_kind_idx`(`kind`),
    INDEX `ApiUsage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `categoria` VARCHAR(191) NULL,
    `priceMode` ENUM('FIXED', 'FROM', 'ON_REQUEST') NOT NULL DEFAULT 'FIXED',
    `priceCents` INTEGER NULL,
    `promoPriceCents` INTEGER NULL,
    `images` JSON NULL,
    `variations` JSON NULL,
    `soldOut` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Product_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentConfig` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `pixKey` VARCHAR(191) NULL,
    `pixHolderName` VARCHAR(191) NULL,
    `pixCopyPaste` TEXT NULL,
    `mercadoPagoLink` TEXT NULL,
    `instructions` TEXT NULL,
    `visibilityCents` INTEGER NOT NULL DEFAULT 7900,
    `premiumCents` INTEGER NOT NULL DEFAULT 19700,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentClaim` (
    `id` VARCHAR(191) NOT NULL,
    `businessId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `plan` ENUM('FREE', 'VISIBILITY', 'PREMIUM') NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `months` INTEGER NOT NULL DEFAULT 1,
    `amountCents` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewerId` VARCHAR(191) NULL,

    INDEX `PaymentClaim_status_idx`(`status`),
    INDEX `PaymentClaim_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanConfig` (
    `plan` ENUM('FREE', 'VISIBILITY', 'PREMIUM') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `priceCents` INTEGER NOT NULL DEFAULT 0,
    `productLimit` INTEGER NOT NULL DEFAULT 2,
    `photoLimit` INTEGER NOT NULL DEFAULT 3,
    `features` JSON NOT NULL,
    `mercadoPagoLink` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`plan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `News` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `coverUrl` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `authorId` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `News_slug_key`(`slug`),
    INDEX `News_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `coverUrl` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `eventDate` DATETIME(3) NULL,
    `eventLocation` VARCHAR(191) NULL,
    `eventUrl` TEXT NULL,
    `moderationNote` TEXT NULL,
    `businessId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Event_slug_key`(`slug`),
    INDEX `Event_status_eventDate_idx`(`status`, `eventDate`),
    INDEX `Event_businessId_idx`(`businessId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

