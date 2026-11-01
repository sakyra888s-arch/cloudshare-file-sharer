// 1. Проверка авторизации и отрисовка шапки
const authBlock = document.getElementById('auth-block');
const uploadSection = document.getElementById('upload-section');
const guestSection = document.getElementById('guest-section');
const profileModal = document.getElementById('profileModal');

function checkAuth() {
    fetch('api/check_auth.php')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                uploadSection.style.display = 'block';
                guestSection.style.display = 'none';
                
                authBlock.innerHTML = `
                    <span id="profileLink" title="Открыть личный кабинет">
                        ${data.username}
                    </span>
                `;
                
                document.getElementById('profileLink').addEventListener('click', () => {
                    document.getElementById('modalUsername').textContent = data.username;
                    profileModal.style.display = 'flex'; 
                });

                document.getElementById('modalLogoutBtn').addEventListener('click', () => {
                    fetch('api/logout.php').then(() => window.location.reload());
                });

                loadFiles();
            } else {
                uploadSection.style.display = 'none';
                guestSection.style.display = 'block';
                document.getElementById('fileList').innerHTML = ''; 
                
                authBlock.innerHTML = `
                    <a href="login.html" class="btn-login">Войти</a>
                    <a href="register.html" class="btn-register">Регистрация</a>
                `;
            }
        })
        .catch(err => console.error('Ошибка проверки авторизации:', err));
}
checkAuth(); 

// Закрытие модального окна
document.getElementById('closeModal').addEventListener('click', () => {
    profileModal.style.display = 'none';
});
window.addEventListener('click', (event) => {
    if (event.target === profileModal) {
        profileModal.style.display = 'none';
    }
});

// 2. Загрузка списка файлов (Скачать/Поделиться/Удалить)
function loadFiles() {
    fetch('api/get_files.php')
        .then(response => response.json())
        .then(files => {
            const fileList = document.getElementById('fileList');
            fileList.innerHTML = ''; 
            
            if (files.length === 0) {
                fileList.innerHTML = '<p style="text-align:center; color:#888;">У вас пока нет файлов.</p>';
                return;
            }

            files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.classList.add('file-item');

                let sizeStr = file.file_size < 1024 * 1024
                    ? (file.file_size / 1024).toFixed(1) + " КБ"
                    : (file.file_size / (1024 * 1024)).toFixed(1) + " МБ";

                // Определяем иконку по расширению
                let icon = '📄'; 
                const ext = file.original_name.split('.').pop().toLowerCase();
                if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) icon = '🖼️';
                else if (['pdf'].includes(ext)) icon = '📕';
                else if (['zip', 'rar', '7z'].includes(ext)) icon = '📦';
                else if (['mp3', 'wav'].includes(ext)) icon = '🎵';
                else if (['mp4', 'avi', 'mkv'].includes(ext)) icon = '🎬';

                const downloadUrl = `api/download.php?id=${file.id}`;

                fileItem.innerHTML = `
                    <span class="file-name">${icon} ${file.original_name}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="file-size">${sizeStr}</span>
                        <a href="${downloadUrl}" style="text-decoration: none; font-size: 18px;" title="Скачать">⬇️</a>
                        <button onclick="copyLink('${downloadUrl}')" style="background: none; border: none; font-size: 18px; cursor: pointer;" title="Поделиться">🔗</button>
                        <button onclick="deleteFile(${file.id})" style="background: none; border: none; font-size: 18px; cursor: pointer;" title="Удалить">🗑️</button>
                    </div>
                `;
                fileList.appendChild(fileItem);
            });
        })
        .catch(error => console.error('Ошибка загрузки файлов:', error));
}

// Функция копирования ссылки
window.copyLink = function(url) {
    const fullUrl = window.location.origin + '/' + url;
    navigator.clipboard.writeText(fullUrl).then(() => {
        alert('Ссылка скопирована! Отправьте её другу, и он сможет скачать файл.');
    }).catch(err => {
        alert('Не удалось скопировать ссылку.');
    });
};

// Функция удаления файла
window.deleteFile = function(id) {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
        fetch(`api/delete.php?id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    loadFiles(); // Обновляем список
                } else {
                    alert(data.message);
                }
            });
    }
};

// 3. Логика загрузки файлов
const fileInput = document.getElementById('files');
const uploadBtn = document.getElementById('uploadBtn');
let selectedFile = null;

fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("Ошибка! Файл слишком большой. Максимум 5 МБ.");
        fileInput.value = "";
        return;
    }
    selectedFile = file;
});

uploadBtn.addEventListener('click', function() {
    if (selectedFile === null) {
        alert("Пожалуйста, сначала выберите файл!");
        return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    uploadBtn.textContent = 'Загрузка...';
    uploadBtn.disabled = true;

    fetch('api/upload.php', { method: 'POST', body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            fileInput.value = "";
            selectedFile = null;
            loadFiles(); 
        } else {
            alert("Ошибка: " + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при отправке на сервер.');
    })
    .finally(() => {
        uploadBtn.textContent = 'Загрузить';
        uploadBtn.disabled = false;
    });
});

// 4. Регистрация SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker зарегистрирован'))
            .catch(err => console.log('Ошибка SW:', err));
    });
}
