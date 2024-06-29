# Форма для ввода данных с использованием React и IndexedDB

Пример формы для ввода данных с несколькими шагами, с сохранением данных полей локально а после и на сервре,
что делает возмождным начать заполнять форму на одном устройстве, а продолжить на другом. 
а так же с выводом имени последнего отредактировавшего пользователя и времени редактирования. 
локальное сохранение так же обеспечивает сохранность данных при отсутвии соединения с сервером а после его возобновления, автоматически синхронезирует.
реализованный с использованием React и IndexedDB и сервере на node.js .

## Особенности

- Форма состоит из трех шагов с полями для ввода данных на каждом шаге и лёгким маштабированием.
- Данные сохраняются локально в IndexedDB, сохраняя их между сеансами работы пользователя.
- Отправка данных на удаленный сервер для сохранения и получения.

## Установка и запуск
1. npm i
2. запуск приложения : 1. cd .\form\ 2. npm start  (или просто в package.json запустить скрипт start)
3. запуск сервера : 1. cd .\form-state-server\ 2. node server.js


## Технологии

- **React**: Для создания интерфейса и управления состоянием.
- **IndexedDB**: Для локального хранения данных на стороне клиента.
- **axios**: Для HTTP запросов к удаленному серверу.



