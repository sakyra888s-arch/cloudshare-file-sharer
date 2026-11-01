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
                authBlock.innerHTML = `<span id="profileLink" title="Личный кабинет">${data.username}</span>`;
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
        .catch(err => console.error(err));
}
checkAuth(); 

document.getElementById('closeModal').addEventListener('click', () => {
    profileModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === profileModal) {
        profileModal.style.display = 'none';
    }
});

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
        .catch(error => console.error(error));
}

window.copyLink = function(url) {
    const fullUrl = window.location.origin + '/' + url;
    navigator.clipboard.writeText(fullUrl).then(() => {
        alert('Ссылка скопирована!');
    }).catch(err => {
        alert('Не удалось скопировать ссылку.');
    });
};

window.deleteFile = function(id) {
    if (confirm('Удалить этот файл?')) {
        fetch(`api/delete.php?id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    loadFiles(); 
                } else {
                    alert(data.message);
                }
            });
    }
};

const fileInput = document.getElementById('files');
const uploadBtn = document.getElementById('uploadBtn');
let selectedFile = null;

fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        alert("Файл слишком большой. Максимум 5 МБ.");
        fileInput.value = "";
        return;
    }
    selectedFile = file;
});

uploadBtn.addEventListener('click', function() {
    if (selectedFile === null) {
        alert("Выберите файл!");
        return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            uploadBtn.textContent = `Загрузка... ${percentComplete}%`;
        }
    };

    xhr.onload = function() {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.status === 'success') {
                fileInput.value = "";
                selectedFile = null;
                loadFiles(); 
            } else {
                alert("Ошибка: " + data.message);
            }
        }
        uploadBtn.textContent = 'Загрузить';
        uploadBtn.disabled = false;
    };

    xhr.onerror = function() {
        alert('Ошибка при отправке на сервер.');
        uploadBtn.textContent = 'Загрузить';
        uploadBtn.disabled = false;
    };

    xhr.open('POST', 'api/upload.php', true);
    uploadBtn.textContent = 'Загрузка... 0%';
    uploadBtn.disabled = true;
    xhr.send(formData);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW готов'))
            .catch(err => console.log(err));
    });
}
