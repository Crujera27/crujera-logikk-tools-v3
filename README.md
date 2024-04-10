# Versión discontinuada

### La presente versión ha sido oficialmente discontinuada a partir del 10/04/2024. Su sucesor, la versión 4, se encuentra disponible [aquí](https://github.com/Crujera27/logitools). Este repositorio se conserva exclusivamente con fines de preservación de la memoria histórica y para permitir la revisión de ejemplos pasados del software. Es importante destacar que **NO** se recomienda su uso en entornos de producción bajo ninguna circunstancia, debido a las vulnerabilidades de seguridad que podrían surgir con el tiempo. Además, es pertinente mencionar que una de las principales razones para el desarrollo de la versión 4 fue la organización desordenada de los archivos en esta versión anterior.

# Logikk Tools - v3

 Este proyecto ha sido diseñador por Crujera27_3#2328 (Web personal: https://crujera.galnod.com | GitHub: https://github.com/Crujera27) con el fin de ser utilizando en Logikk's Discord, 
 una comunidad del creador de contenido Logikk para facilitar al equipo de moderación sus taras.
 Este copia de este software ha sido distribuido bajo la licencia "GNU General Public License v3" 
 una copia de esta licencia puede ser encontrado en license.md o en esta página web https://www.gnu.org/licenses/quick-guide-gplv3.pdf

Las imágenes que contienen el nombre y proyecto son propiedad del creador de contenido [Logikk](https://www.youtube.com/@LogikkYT)

 Copyright © 2023 Crujera27_3#2328 (Ángel) - Todos los derechos reservados


## Setup


#### Requisitos:

-   Servidor MariaDB 10 o similar. (Puede que otras versiones funcionen)
-   Usuario con acceso total a una base de datos.
-   Acceso a una IP con un puerto (Para el servidor web)
-   Node.JS v18 LTS & NPM
-   Paciencia si quieres adaptar este código inútil para algo productivo.

*Nota: El funcionamiento solamente ha sido testado en Ubuntu 22.04.4 LTS (Jammy Jellyfish)*

1. Importa la estructura de la base de datos:


```sql
-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Server version: 10.3.39-MariaDB-1:10.3.39+maria~ubu2004
-- PHP Version: 8.1.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `s84_s84_logikktoolsv3usa`
--

-- --------------------------------------------------------

--
-- Table structure for table `appeals`
--

CREATE TABLE `appeals` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `warn_id` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `automod_queue`
--

CREATE TABLE `automod_queue` (
  `id` int(11) NOT NULL,
  `message_content` text NOT NULL,
  `message_author` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `discriminator` varchar(255) NOT NULL,
  `warn_level_interaction_id` varchar(255) DEFAULT NULL,
  `warn_medio_interaction_id` varchar(255) DEFAULT NULL,
  `warn_grave_interaction_id` varchar(255) DEFAULT NULL,
  `message_id` varchar(255) DEFAULT NULL,
  `falsopositivo_interaction_id` varchar(100) DEFAULT NULL,
  `channel_id` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `casospub`
--

CREATE TABLE `casospub` (
  `ID` int(11) NOT NULL,
  `Cita` text DEFAULT NULL,
  `type` text DEFAULT NULL,
  `pdflink` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `user_id` bigint(20) NOT NULL,
  `profile_image_url` varchar(255) DEFAULT NULL,
  `warn_notification` enum('disabled','enabled') DEFAULT NULL,
  `support_notification` enum('disabled','enabled') DEFAULT NULL,
  `suspicious_activity_notification` enum('disabled','enabled') DEFAULT NULL,
  `api_key_status` enum('disabled','enabled') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` enum('abierto','en progreso','cerrado') NOT NULL DEFAULT 'abierto',
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp(),
  `userId` int(11) NOT NULL,
  `discord_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `ticket_response`
--

CREATE TABLE `ticket_response` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `response` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `discord_id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(255) NOT NULL,
  `discriminator` varchar(4) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `banned` tinyint(4) DEFAULT 0,
  `isStaff` bit(1) DEFAULT b'0',
  `avatar_uuid` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Table structure for table `warns`
--

CREATE TABLE `warns` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `mod_id` varchar(255) NOT NULL,
  `reason` text DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `type` enum('warn','mute','kick','ban','unmute','unban') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appeals`
--
ALTER TABLE `appeals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `automod_queue`
--
ALTER TABLE `automod_queue`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `casospub`
--
ALTER TABLE `casospub`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `discord_id` (`discord_id`);

--
-- Indexes for table `ticket_response`
--
ALTER TABLE `ticket_response`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `discord_id` (`discord_id`);

--
-- Indexes for table `warns`
--
ALTER TABLE `warns`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appeals`
--
ALTER TABLE `appeals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `automod_queue`
--
ALTER TABLE `automod_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `casospub`
--
ALTER TABLE `casospub`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ticket_response`
--
ALTER TABLE `ticket_response`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `warns`
--
ALTER TABLE `warns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
COMMIT;
```

2. Descarga el código, descomprímelo y ponlo en tu carpeta de trabajo o cópialo utilizando el siguiente comando:
```bash
git clone https://github.com/Crujera27/crujera-logikk-tools-v3.git
```
3. Instala las dependencias
```bash
npm install
```
4. Edita las configuraciones (Renombra .env.example a .env y rellénalo, Renombra config-default a config y rellena los archivos que este directorio pose).
5. Inicia la aplicación.
```bash
npm run start
```
