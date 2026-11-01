-- Создаем базу данных (если её еще нет)
CREATE DATABASE IF NOT EXISTS file_sharer_db;
USE file_sharer_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE, -- Логин (уникальный)
    password VARCHAR(255) NOT NULL,       -- Пароль (в реальности его хэшируют, но для курсовой можно и так)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                 -- ID пользователя, который загрузил файл
    original_name VARCHAR(255) NOT NULL,  -- Изначальное имя файла
    file_size INT NOT NULL,               -- Размер в байтах
    file_path VARCHAR(255) NOT NULL,      -- Путь к файлу на сервере
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Связь: внешний ключ. Если пользователь удалится, его файлы тоже удалятся
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
