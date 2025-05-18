if (window.Telegram && window.Telegram.WebApp) {

    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.disableVerticalSwipes();

    // Уведомляем Telegram, что приложение готово
    window.Telegram.WebApp.ready();

    // Переменная user объявляется заранее
    let user = null;
    const initData = window.Telegram.WebApp.initData;

    console.log(initData, 123);

    // Получение данных пользователя
    try {
        if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            user = window.Telegram.WebApp.initDataUnsafe.user; // Присваиваем значение
        } else {
            alert('initDataUnsafe или user недоступен');
        }
    } catch (error) {
        console.error('Ошибка при доступе к initDataUnsafe:', error);
        alert('Ошибка при доступе к initDataUnsafe.');
    }

    if (user) {

        const userId = user.id;
        const username = user.username || '';

        fetch(`/check_user_exist/?userId=${userId}&username=${encodeURIComponent(username)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Init-Data': initData,

            },
        })

        .then(async response => {
            const data = await response.json();
            if (data.success) {
                // Выполняем редирект на стороне клиента
                window.location.href = data.redirect_url;
            } else {
                // Обработка ошибки
                console.error(data.message);
            }
        })
        .catch(error => {
            console.error('Ошибка при выполнении запроса:', error.message);
        });

    } else {
        alert('Информация о пользователе недоступна.');
    }
} else {
    alert('Пожалуйста, откройте это приложение через Telegram.');
}

