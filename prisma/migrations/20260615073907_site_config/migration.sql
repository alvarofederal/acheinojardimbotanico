-- CreateTable
CREATE TABLE `SiteConfig` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `showPromocoes` BOOLEAN NOT NULL DEFAULT false,
    `showNoticias` BOOLEAN NOT NULL DEFAULT false,
    `showEventos` BOOLEAN NOT NULL DEFAULT false,
    `showVagas` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
